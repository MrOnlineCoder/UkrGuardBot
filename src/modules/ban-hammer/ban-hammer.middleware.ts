import { Context } from "telegraf";
import { banChatMember } from "../../telegram/ban-chat-member.extension";
import { isChatAdmin } from "../../telegram/utils";

import BanHammerRepository from "./ban-hammer.repository";

import { BanReason, IBan, IBanHammerMiddlewareState } from "./ban-hammer.interfaces";
import { Message } from "telegraf/typings/telegram-types";

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

async function rusBanMiddleware(ctx: Context, next: Function) {
  const { targetBanUser, targetBanMessage } = ctx.state as IBanHammerMiddlewareState;

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
    `🇷🇺🖕 Русню під іменем ${targetBanUser.first_name} (ID ${targetBanUser.id}) забанено. Вартовий бот тепер не допустить його в жоден інший чат.`
  );

  setTimeout(async () => {
    await ctx.telegram.deleteMessage(ack.chat.id, ack.message_id);
  }, 7500);
}

async function spamBanMiddleware(ctx: Context, next: Function) {
  const { targetBanUser, targetBanMessage } =
    ctx.state as IBanHammerMiddlewareState;

  await banChatMember(ctx, ctx.chat?.id!, targetBanUser.id!, true);
  await ctx.deleteMessage();

  console.log();

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
    `🗣❌ Спамера під іменем ${targetBanUser.first_name} (ID ${targetBanUser.id}) забанено. Вартовий бот тепер не допустить його в жоден інший чат.`
  );

  setTimeout(async () => {
    await ctx.telegram.deleteMessage(ack.chat.id, ack.message_id);
  }, 7500);
}

export default {
  rusBanMiddleware,
  spamBanMiddleware,
  banHammerGeneralMiddleware
}