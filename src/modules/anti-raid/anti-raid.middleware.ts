import { Context } from "telegraf";
import { isChatAdmin } from "../../telegram/utils";
import { IBaseContextState } from "../messages-logger/messages-logger.interfaces";
import messagesLoggerRepository from "../messages-logger/messages-logger.repository";
import { MessageJudgementVerdict } from "./anti-radis.types";

import antiRaidService from './anti-raid.service'

async function antiRaidCommandMiddleware(ctx: Context, next: () => Promise<void>) {
    if (ctx.chat?.type == 'private') return null;
    
    const hasPermission = await isChatAdmin(ctx);

    if (!hasPermission) return null;

    const chatId = ctx.chat?.id!;

    const isAntiRaidEnabled = await antiRaidService.isAntiRaidEnabled(chatId);

    if (isAntiRaidEnabled) {
        await antiRaidService.markAntiRaidDisabled(chatId);

        await ctx.reply(`✅ Режим "антирейда" відключено.`);
    } else {
        await antiRaidService.markAntiRaidEnabled(chatId);

        await ctx.reply(`❗️ Увага! Оголошена рейдова тривога. Бот зараз буде видавати бани наліво і направо.`);
    }
}

async function antiRaidJudgementMiddleware(ctx: Context, next: () => Promise<void>) {
    if (ctx.chat?.type == "private") return next();

    const chatId = ctx.chat?.id!;

    if (!ctx.message?.text) return next();

    const isAntiRaidEnabled = await antiRaidService.isAntiRaidEnabled(chatId);

    if (!isAntiRaidEnabled) return next();

    const state = ctx.state as IBaseContextState;

    const verdict = await antiRaidService.judgeMessage(
        ctx.message?.text
    );

    await messagesLoggerRepository.updateMessageVerdict(
        state.dbMessage.id!,
        verdict
    );

    if (verdict == MessageJudgementVerdict.Ban) {
        await ctx.reply(`Banned ${ctx.from?.first_name}`);
    }
}

export default {
  antiRaidCommandMiddleware,
  antiRaidJudgementMiddleware,
};