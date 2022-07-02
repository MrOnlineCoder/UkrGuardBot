import { Context } from "telegraf";

import Logger from '../common/logger'


export default (ctx: Context, next: () => Promise<void>) => {
    const username = ctx.from?.username || ctx.from?.first_name || 'n/a';
    const id = ctx.from?.id;
    const fromFull = ctx.chat?.type == 'private' ? `PM (${id})` : `"${ctx.chat?.title}" (${id})`;
    const message = ctx.message?.text || `** ${ctx.updateType}/${ctx.updateSubTypes.join()} **`;

    Logger.log('TelegramChat', `<${username} @ ${fromFull}> ${message}`);

    next();
}