import { Telegraf } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

import MessageLogMiddleware from './message-log.middleware'

import LanguageWatcherModule from '../modules/language-watcher/language-watcher.module';

import { session, Stage, BaseScene } from 'telegraf'
import { MiddlewareFn } from "telegraf/typings/composer";
import BanHammerMiddleware from "../modules/ban-hammer/ban-hammer.middleware";

async function init() {
    const bot = new Telegraf(process.env.TELEGRAM_TOKEN!);

    const stage = new Stage([]);

    bot.use(session());
    
    bot.use(stage.middleware() as MiddlewareFn<TelegrafContext>);

    bot.use(MessageLogMiddleware);
    
    LanguageWatcherModule.install(bot);
    bot.use(BanHammerMiddleware);

    await bot.launch();
}

export default {
    init
}