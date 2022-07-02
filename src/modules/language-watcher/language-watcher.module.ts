import Telegraf, { Context } from "telegraf";
import { MyBot } from "../../telegram/telegram.types";

import languageWatcherMiddleware from "./language-watcher.middleware";

export function install(bot: MyBot) {
  bot.use(languageWatcherMiddleware);
}

export default {
  install
}