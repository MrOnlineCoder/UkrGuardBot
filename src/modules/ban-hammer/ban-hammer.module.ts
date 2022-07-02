import { MyBot } from "../../telegram/telegram.types";

import BanHammerMiddleware from "./ban-hammer.middleware";

export function install(bot: MyBot) {
    bot.use(BanHammerMiddleware);
}

export default {
  install,
};
