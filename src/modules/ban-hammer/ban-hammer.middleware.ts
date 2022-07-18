import { Context } from "telegraf";
import { banChatMember } from "../../telegram/ban-chat-member.extension";
import { isChatAdmin, makeRawUserIdLink } from "../../telegram/utils";

import BanHammerRepository from "./ban-hammer.repository";

import {
  BanReason,
  IBan,
  IBanHammerMiddlewareState,
} from "./ban-hammer.interfaces";
import { Message } from "telegraf/typings/telegram-types";
import logger from "../../common/logger";
import messagesLoggerRepository from "../messages-logger/messages-logger.repository";
import { deleteMessageInTelegramAndDb, extractSenderMetadata } from "../messages-logger/messages-logger.utils";
import { IBaseContextState, TelegramSenderType } from "../messages-logger/messages-logger.interfaces";
import banHammerService from "./ban-hammer.service";
import auditLogService from "../audit-log/audit-log.service";
import { AuditLogEventType } from "../audit-log/audit-log.types";

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

  stateObject.targetSenderMetadata = extractSenderMetadata(
    targetMessage as Message,
    targetUser
  );

  stateObject.targetMessage = targetMessage as Message;

  next();
}

async function rusBanMiddleware(ctx: Context, next: Function) {
  await banHammerService.issueBan(ctx, BanReason.RUSSIAN_ORC);
}

async function spamBanMiddleware(ctx: Context, next: Function) {
  const [_cmdName, arg] = ctx.message?.text.split(' ')!;
  await banHammerService.issueBan(ctx, BanReason.SPAM, true, false, arg !== '-');
}

async function banHammerWatcher(ctx: Context, next: Function) {
  if (ctx.chat?.type == "private") return next();

  if (!ctx.from) return next();

  const isAdmin = await isChatAdmin(ctx);

  if (isAdmin) return next();

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
    if (ctx.message) await deleteMessageInTelegramAndDb(ctx, ctx.chat?.id!, ctx.message?.message_id!);
    await banChatMember(ctx, ctx.chat?.id!, ban.telegramUserId, true);
    await auditLogService.writeLog(
      ctx.chat!,
      AuditLogEventType.AutoBan,
      {
        banReason: BanReason.RUSSIAN_ORC,
        banDate: ban.banDate,
        userId: ban.telegramUserId,
        userFullname: (ctx.state as IBaseContextState).dbMessage.senderName
      }
    ); 
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
       if (ctx.message)
         await deleteMessageInTelegramAndDb(
           ctx,
           ctx.chat?.id!,
           ctx.message?.message_id!
         );
      await banChatMember(ctx, ctx.chat?.id!, ctx.from.id);

      const state = ctx.state as IBaseContextState;

      const ack = await ctx.reply(`🛡 Користувач ${makeRawUserIdLink(state.dbMessage.senderName || state.dbMessage.senderUsername || '?', state.dbMessage.telegramSenderId!)} намагався відправити спам-повідомлення, і тому був забанений.`);

      await auditLogService.writeLog(ctx.chat!, AuditLogEventType.AutoBan, {
        banReason: BanReason.SPAM,
        banDate: ban.banDate,
        userId: ban.telegramUserId,
        userFullname: (ctx.state as IBaseContextState).dbMessage.senderName,
      }); 

      setTimeout(async () => {
        await ctx.deleteMessage(ack.message_id);
      }, 5500);
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
