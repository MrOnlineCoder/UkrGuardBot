import { Telegraf } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

import MessageLogModule from '../modules/messages-logger/messages-logger.module'
import BanHammerModule from "../modules/ban-hammer/ban-hammer.module";
import LanguageWatcherModule from '../modules/language-watcher/language-watcher.module';

import { session, Stage, BaseScene } from 'telegraf'
import { MiddlewareFn } from "telegraf/typings/composer";


async function init() {
    const bot = new Telegraf(process.env.TELEGRAM_TOKEN!);

    const stage = new Stage([]);

    bot.use(session());
    
    bot.use(stage.middleware() as MiddlewareFn<TelegrafContext>);

    //bot.use(MessageLogMiddleware);
    MessageLogModule.install(bot);
    LanguageWatcherModule.install(bot);
    BanHammerModule.install(bot);

    await bot.launch();
}

export default {
    init
}