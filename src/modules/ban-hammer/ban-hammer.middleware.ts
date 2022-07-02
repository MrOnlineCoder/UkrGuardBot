import { Context } from "telegraf";
import { banChatMember } from "../../telegram/ban-chat-member.extension";
import { isChatAdmin } from "../../telegram/utils";

import BanHammerRepository from "./ban-hammer.repository";

import {
  BanReason,
  IBan,
  IBanHammerMiddlewareState,
} from "./ban-hammer.interfaces";
import { Message } from "telegraf/typings/telegram-types";
import logger from "../../common/logger";
import messagesLoggerRepository from "../messages-logger/messages-logger.repository";

async function banHammerGeneralMiddleware(ctx: Context, next: Function) {
  if (ctx.chat?.type == "private") return null;

  const hasPermission = await isChatAdmin(ctx);

  if (!hasPermission) return null;

  if (!ctx.message?.reply_to_message) return null;

  const targetMessage = ctx.message?.reply_to_message!;
  const targetUser = targetMessage.from!;

  if (targetUser.id === ctx.from?.id) return null;

  const isTargetAdmin = await isChatAdmin(ctx, targetUser.id);

  if (isTargetAdmin) return null;

  const stateObject = ctx.state as IBanHammerMiddlewareState;

  stateObject.targetBanUser = targetUser;
  stateObject.targetBanMessage = targetMessage;

  next();
}

async function issueInOtherChats(ctx: Context, ban: IBan) {
  const messages = await messagesLoggerRepository.findLastMessagesOfUser(
    ban.telegramUserId,
    24 * 60 * 60 * 1000 // 24 hours
  );

  logger.log(
    `BanHammer`,
    `Found ${messages.length} total messages for banning user ${ban.telegramUserId}`
  );

  for (const msg of messages) {
    try {
      await ctx.telegram.deleteMessage(
        msg.telegramChatId,
        msg.telegramMessageId
      );

      logger.log(
        `BanHammer`,
        `Deleted message ${msg.telegramMessageId} in chat ${msg.telegramChatId} (${msg.telegramChatTitle}) of banned user ${msg.senderName} (${msg.telegramSenderId})`
      );
    } catch (err) {
      logger.error(
        `BanHammer`,
        `Error happened while cleaning up message ${msg.telegramMessageId} for chat ${msg.telegramChatId} for user ${msg.telegramSenderId}`,
        err
      );
    }

    await banChatMember(ctx, msg.telegramChatId, msg.telegramSenderId, true);
  }
}

async function rusBanMiddleware(ctx: Context, next: Function) {
  const { targetBanUser, targetBanMessage } =
    ctx.state as IBanHammerMiddlewareState;

  await banChatMember(ctx, ctx.chat?.id!, targetBanUser.id!, true);
  await ctx.deleteMessage();

  const ban: IBan = {
    isGlobal: true,
    telegramChatId: ctx.chat?.id!,
    telegramAdminId: ctx.from?.id!,
    telegramMessageId: targetBanMessage.message_id,
    telegramUserId: targetBanUser.id,
    banDate: new Date(),
    reason: BanReason.RUSSIAN_ORC,
  };

  await BanHammerRepository.insertBan(ban);

  const ack = await ctx.reply(
    `🇷🇺🖕 Русню під іменем ${targetBanUser.first_name} (ID ${targetBanUser.id}) забанено. Вартовий бот тепер не допустить його в жоден інший чат під охороною.`
  );

  await issueInOtherChats(ctx, ban);

  setTimeout(async () => {
    await ctx.telegram.deleteMessage(ack.chat.id, ack.message_id);
  }, 7500);
}

async function spamBanMiddleware(ctx: Context, next: Function) {
  const { targetBanUser, targetBanMessage } =
    ctx.state as IBanHammerMiddlewareState;

  await banChatMember(ctx, ctx.chat?.id!, targetBanUser.id!, true);
  await ctx.deleteMessage();

  const ban: IBan = {
    isGlobal: true,
    telegramChatId: ctx.chat?.id!,
    telegramAdminId: ctx.from?.id!,
    telegramMessageId: targetBanMessage.message_id,
    originMessageContent: (targetBanMessage as Message).text || null,
    telegramUserId: targetBanUser.id,
    banDate: new Date(),
    reason: BanReason.SPAM,
  };

  await BanHammerRepository.insertBan(ban);

  const ack = await ctx.reply(
    `🗣❌ Спамера під іменем ${targetBanUser.first_name} (ID ${targetBanUser.id}) забанено. Вартовий бот тепер не допустить його в жоден інший чат під охороною.`
  );

  await issueInOtherChats(ctx, ban);

  setTimeout(async () => {
    await ctx.telegram.deleteMessage(ack.chat.id, ack.message_id);
  }, 7500);
}

async function banHammerWatcher(ctx: Context, next: Function) {
  if (ctx.chat?.type == "private") return next();

  if (!ctx.from) return next();

  //Typical ban
  const bans = await BanHammerRepository.findBansByUserId(ctx.from?.id!, true);

  if (bans.length) {
    const ban = bans[0];
    logger.log(
      `BanHammerWatcher`,
      `User ${ctx.from.first_name} (${
        ctx.from.id
      }) tried to send a message in chat ${ctx.chat
        ?.id!}, but he has an active ban ID ${ban.id}, reason = ${
        ban.reason
      } since ${ban.banDate.toISOString()}. Banning in chat...`
    );
    if (ctx.message) await ctx.deleteMessage();
    await banChatMember(ctx, ctx.chat?.id!, ctx.from?.id!, true);
  }

  //Spam ban
  if (ctx.message?.text) {
    const spamBans = await BanHammerRepository.findSpamBansByContent(
      ctx.message.text
    );

    if (spamBans.length) {
      const ban = spamBans[0];
      logger.log(
        `BanHammerWatcher`,
        `User ${ctx.from.first_name} (${
          ctx.from.id
        }) tried to send a SPAM message in chat ${ctx.chat
          ?.id!}, matched by global ban ID ${ban.id} since ${ban.banDate.toISOString()}. Banning in chat...`
      );
      await ctx.deleteMessage();
      await banChatMember(ctx, ctx.chat?.id!, ctx.from.id);

      const ack = await ctx.reply(`🛡 Користувач ${ctx.from.first_name} (${ctx.from.id}) намагався відправити спам-повідомлення, і тому був забанений.`);

      setTimeout(async () => {
        await ctx.deleteMessage(ack.message_id);
      }, 4500);
    }
  }

  next();
}

export default {
  rusBanMiddleware,
  spamBanMiddleware,
  banHammerGeneralMiddleware,
  banHammerWatcher,
};
