import { Telegraf } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

import MessageLogMiddleware from './message-log.middleware'

import LanguageWatcherMiddleware from '../modules/language-watcher/language-watcher.middleware';

import { session, Stage, BaseScene } from 'telegraf'
import { MiddlewareFn } from "telegraf/typings/composer";

async function init() {
    const bot = new Telegraf(process.env.TELEGRAM_TOKEN!);

    const stage = new Stage([]);

    bot.use(session());
    
    bot.use(stage.middleware() as MiddlewareFn<TelegrafContext>);

    bot.use(MessageLogMiddleware);
    bot.use(LanguageWatcherMiddleware);

    await bot.launch();
}

export default {
    init
}