import { Context } from "telegraf";
import { Sticker } from "telegraf/typings/telegram-types";
import logger from "../../common/logger";
import { getRedisClient } from "../../common/redis";
import {
  banChatMember,
  banChatSenderChat,
} from "../../telegram/ban-chat-member.extension";
import { extractTextFromMessage, makeRawUserIdLink } from "../../telegram/utils";
import auditLogService from "../audit-log/audit-log.service";
import { AuditLogEventType } from "../audit-log/audit-log.types";
import {
  IMessageSenderMetadata,
  TelegramSenderType,
} from "../messages-logger/messages-logger.interfaces";
import messagesLoggerRepository from "../messages-logger/messages-logger.repository";
import { deleteMessageInTelegramAndDb } from "../messages-logger/messages-logger.utils";
import {
  BanReason,
  IBan,
  IBanHammerMiddlewareState,
} from "./ban-hammer.interfaces";
import banHammerRepository from "./ban-hammer.repository";

const TREASON_LOVER_BAN_DURATION = 7 * 24 * 60 * 60; //1 week

async function issueInOtherChats(ctx: Context, ban: IBan) {
  if (!ban.isGlobal) return;
  
  const messages = await messagesLoggerRepository.findLastMessagesOfUser(
    ban.telegramUserId,
    24 * 60 * 60 * 1000 // 24 hours
  );

  logger.log(
    `BanHammer`,
    `Found ${messages.length} total messages for banning user ${ban.telegramUserId}`
  );

  const bannedChatIds = new Set();

  for (const msg of messages) {
    try {
      await deleteMessageInTelegramAndDb(
        ctx,
        msg.telegramChatId,
        msg.telegramMessageId
      );

      logger.log(
        `BanHammer`,
        `Deleted message ${msg.telegramMessageId} in chat ${msg.telegramChatId} (${msg.telegramChatTitle}) of banned user ${msg.senderName} (${msg.telegramSenderId})`
      );

      if (!bannedChatIds.has(msg.telegramChatId)) {
        if (msg.telegramSenderType === TelegramSenderType.USER)
          await banChatMember(
            ctx,
            msg.telegramChatId,
            msg.telegramSenderId!,
            true
          );

        bannedChatIds.add(msg.telegramChatId);
      }
    } catch (err) {
      logger.error(
        `BanHammer`,
        `Error happened while cleaning up message ${msg.telegramMessageId} for chat ${msg.telegramChatId} for user ${msg.telegramSenderId}`,
        err
      );
    }
  }
}

async function banBySenderMetadata(
  ctx: Context,
  metadata: IMessageSenderMetadata,
  banUntil: number = 0
) {
  if (metadata.telegramSenderType === TelegramSenderType.USER) {
    await banChatMember(
      ctx,
      ctx.chat?.id!,
      metadata.telegramSenderId!,
      true,
      banUntil
    );
  } else {
    await banChatSenderChat(ctx, ctx.chat?.id!, metadata.telegramSenderId!);
  }
}

async function issueBan(
  ctx: Context,
  reason: BanReason,
  isGlobal = true,
  silent = false,
  persistText = true
) {
  const { targetSenderMetadata, targetMessage, dbMessage } =
    ctx.state as IBanHammerMiddlewareState;

  const possibleTreasonBanEndDate = Math.round(Date.now() / 1000 + TREASON_LOVER_BAN_DURATION);

  await banBySenderMetadata(
    ctx,
    targetSenderMetadata,
    reason === BanReason.TREASON_LOVER ? possibleTreasonBanEndDate : 0
  );

  await deleteMessageInTelegramAndDb(
    ctx,
    ctx.chat?.id!,
    ctx.message?.message_id!
  );

  const messageTextContent = extractTextFromMessage(targetMessage);

  const ban: IBan = {
    isGlobal,
    telegramChatId: ctx.chat?.id!,
    telegramAdminId: ctx.from?.id!,
    telegramMessageId: targetMessage.message_id,
    telegramUserId: targetSenderMetadata.telegramSenderId!,
    telegramSenderType: dbMessage.telegramSenderType,
    originMessageContent: persistText ? messageTextContent : null,
    banDate: new Date(),
    reason: reason,
  };

  await banHammerRepository.insertBan(ban);

  const targetUserIdLink = makeRawUserIdLink(
      targetSenderMetadata.senderName!,
      ban.telegramUserId
    );

  const ackMessages = {
    [BanReason.RUSSIAN_ORC]: `🇷🇺🖕 Русню ${targetUserIdLink} (ID ${targetSenderMetadata.telegramSenderId}) забанено. Вартовий бот тепер не допустить його в жоден інший чат під охороною.`,
    [BanReason.SPAM]: `🙊 Спамера ${targetUserIdLink} забанено. Вартовий бот тепер не допустить ні його, ні його спам розсилку в інші чати під охороною`,
    [BanReason.UNKNOWN]: `Видано якось бан ${targetSenderMetadata.senderName} (${targetSenderMetadata.telegramSenderId})`,
    [BanReason.TREASON_LOVER]: `🍫 Зрадофіла ${targetUserIdLink} (ID ${targetSenderMetadata.telegramSenderId}) забанено. Тепер його панічні настрої будуть росповсюджені в рази менше`,
  };

  const auditLogMapping = {
    [BanReason.RUSSIAN_ORC]: AuditLogEventType.BanRussian,
    [BanReason.SPAM]: AuditLogEventType.BanSpam,
    [BanReason.TREASON_LOVER]: AuditLogEventType.BanTreasonLover,
    [BanReason.UNKNOWN]: AuditLogEventType.BanRussian
  };

  await auditLogService.forwardMessageToLog(
    ctx.chat?.id!,
    targetMessage.message_id
  );

  await auditLogService.writeLog(
    ctx.chat!,
    auditLogMapping[ban.reason],
    {
      adminId: ban.telegramAdminId,
      adminFullname: dbMessage.senderName,
      userId: ban.telegramUserId,
      userFullname: targetSenderMetadata.senderName,
      blacklisted: persistText,
    }
  );

  if (targetMessage.sticker) {
    await banStickerOrSet(targetMessage.sticker);
  }

  const ack = await ctx.reply(ackMessages[reason], {
    parse_mode: "Markdown",
  });

  await issueInOtherChats(ctx, ban);

  setTimeout(async () => {
    await ctx.telegram.deleteMessage(ack.chat.id, ack.message_id);
  }, 6500);
}

async function banStickerOrSet(sticker: Sticker) {
  if (sticker.set_name)
    await getRedisClient().sadd(`banned_stickersets`, sticker.set_name);
  await getRedisClient().sadd(`banned_stickers`, sticker.file_unique_id);
}

async function isStickerBanned(sticker: Sticker) {
  const isStickerBanned = await getRedisClient().sismember(
    `banned_stickersets`,
    sticker.set_name || "n/a"
  );
  const isSetBanned = await getRedisClient().sismember(
    `banned_stickers`,
    sticker.file_unique_id
  );

  return isStickerBanned || isSetBanned;
}

export default {
  issueBan,
  isStickerBanned,
  banStickerOrSet,
  banBySenderMetadata,
};
