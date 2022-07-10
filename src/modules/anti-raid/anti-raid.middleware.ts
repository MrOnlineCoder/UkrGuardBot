import { Context } from "telegraf";
import { isChatAdmin } from "../../telegram/utils";
import { IBaseContextState } from "../messages-logger/messages-logger.interfaces";
import messagesLoggerRepository from "../messages-logger/messages-logger.repository";
import { MessageJudgementVerdict } from "./anti-radis.types";

import antiRaidService from "./anti-raid.service";
import auditLogService from "../audit-log/audit-log.service";
import { AuditLogEventType } from "../audit-log/audit-log.types";

import moment from "moment";
import { deleteMessageInTelegramAndDb } from "../messages-logger/messages-logger.utils";
import banHammerService from "../ban-hammer/ban-hammer.service";
import { banChatMember } from "../../telegram/ban-chat-member.extension";
import logger from "../../common/logger";

async function antiRaidCommandMiddleware(
  ctx: Context,
  next: () => Promise<void>
) {
  if (ctx.chat?.type == "private") return null;

  const hasPermission = await isChatAdmin(ctx);

  if (!hasPermission) return null;

  const chatId = ctx.chat?.id!;

  const antiRaidEnablingDate = await antiRaidService.isAntiRaidEnabled(chatId);

  const [_raidCmd, commandToken] = ctx.message?.text!.split(" ")!;

  if (commandToken) {
    if (commandToken === "+") {
      if (antiRaidEnablingDate)
        return await ctx.reply(
          `🛑 Антирейд вже триває з ${moment(antiRaidEnablingDate).format(
            "DD.MM.YYYY HH:mm"
          )}`
        );

      await antiRaidService.markAntiRaidEnabled(chatId);
      await auditLogService.writeLog(
        ctx.chat!,
        AuditLogEventType.EnableAntiraid,
        {
          adminId: ctx.from?.id!,
          adminFullname: (ctx.state as IBaseContextState).dbMessage.senderName,
        }
      );

      await deleteMessageInTelegramAndDb(ctx, chatId, ctx.message?.message_id!);

      return await ctx.reply(
        `❗️ Увага! Оголошена рейдова тривога. Бот зараз буде видавати бани наліво і направо всім свинособакам які намагатимуться відправити щось в чат.`
      );
    }

    if (commandToken === "-") {
      if (!antiRaidEnablingDate)
        return await ctx.reply(`👍 Антирейд наразі не є ввімкненим`);

      await antiRaidService.markAntiRaidDisabled(chatId);
      await auditLogService.writeLog(
        ctx.chat!,
        AuditLogEventType.DisableAntiraid,
        {
          adminId: ctx.from?.id!,
          adminFullname: (ctx.state as IBaseContextState).dbMessage.senderName,
        }
      );

      await deleteMessageInTelegramAndDb(ctx, chatId, ctx.message?.message_id!);

      return await ctx.reply(`✅ Відбій рейдової тривоги.`);
    }
  }

  if (antiRaidEnablingDate) {
    return await ctx.reply(
      `🛑 Антирейд активний з ${moment(antiRaidEnablingDate).format(
        "DD.MM.YYYY HH:mm"
      )}`
    );
  } else {
    return await ctx.reply(`👍 Режим антирейда вимкнений.`);
  }
}

async function antiRaidJudgementMiddleware(
  ctx: Context,
  next: () => Promise<void>
) {
  if (ctx.chat?.type == "private") return next();

  const chatId = ctx.chat?.id!;

  if (!ctx.message?.text) return next();

  const isAntiRaidEnabled = await antiRaidService.isAntiRaidEnabled(chatId);

  if (!isAntiRaidEnabled) return next();

  const isAdmin = await isChatAdmin(ctx);

  if (isAdmin) return next();

  const state = ctx.state as IBaseContextState;

  let banned = false;

  if (ctx.message.sticker) {
    const isStickerBanned = await banHammerService.isStickerBanned(
      ctx.message.sticker
    );

    if (isStickerBanned) {
      banned = true;
    }
  } else {
    const verdict = await antiRaidService.judgeMessage(ctx.message?.text);

    await messagesLoggerRepository.updateMessageVerdict(
      state.dbMessage.id!,
      verdict
    );

    if (verdict == MessageJudgementVerdict.Ban) {
      banned = true;
    }
  }

  if (banned) {
    try {
      await deleteMessageInTelegramAndDb(
        ctx,
        ctx.chat?.id!,
        ctx.message.message_id
      );

      await banHammerService.banBySenderMetadata(ctx, state.dbMessage);

      await auditLogService.writeLog(ctx.chat!, AuditLogEventType.RaidBan, {
        userId: state.dbMessage.telegramSenderId,
        userFullname: state.dbMessage.senderName,
      });
    } catch (err) {
      logger.error(
        `Antiraid`,
        `Failed to autoban during raid in chat ${ctx.chat!.id!}`,
        err
      );
    }
  }
}

export default {
  antiRaidCommandMiddleware,
  antiRaidJudgementMiddleware,
};
