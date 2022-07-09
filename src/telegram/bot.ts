import { Context, Telegraf } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

import MessageLogModule from "../modules/messages-logger/messages-logger.module";
import BanHammerModule from "../modules/ban-hammer/ban-hammer.module";
import LanguageWatcherModule from "../modules/language-watcher/language-watcher.module";

import { session, Stage, BaseScene } from "telegraf";
import { MiddlewareFn } from "telegraf/typings/composer";
import logger from "../common/logger";
import AntiRaidModule from "../modules/anti-raid/anti-raid.module";
import AuditlogModule from "../modules/audit-log/audit-log.module"

async function init() {
  const bot = new Telegraf(process.env.TELEGRAM_TOKEN!);

  const stage = new Stage([]);

  bot.use(session());

  bot.use(stage.middleware() as MiddlewareFn<TelegrafContext>);

  //bot.use(MessageLogMiddleware);
  bot.use((ctx: Context, next: Function) => {
    if (!ctx.chat) return next();
    const whitelist = process.env.BOT_CHAT_WHITELIST?.split(",").map(Number);

    if (!whitelist?.includes(ctx.chat?.id!)) {
      logger.log(
        `Whitelist`,
        `User (${ctx.from?.username || ctx.from?.first_name}) ${
          ctx.from?.id
        } tried to send message in non-whitelisted chat ${ctx.chat.id}: ${
          ctx.message?.text || ctx.updateSubTypes.join()
        }`
      );
    } else {
      next();
    }
  });

  MessageLogModule.install(bot);
  LanguageWatcherModule.install(bot);
  BanHammerModule.install(bot);
  AntiRaidModule.install(bot);
  AuditlogModule.install(bot);

  await bot.launch();
}

export default {
  init,
};
