import { MyBot } from "../../telegram/telegram.types";

import BanHammerMiddleware from "./ban-hammer.middleware";

export function install(bot: MyBot) {
    bot.hears(
      "!русня",
      BanHammerMiddleware.banHammerGeneralMiddleware,
    BanHammerMiddleware.rusBanMiddleware
    );
    bot.hears(/!спам.*/, BanHammerMiddleware.banHammerGeneralMiddleware, BanHammerMiddleware.spamBanMiddleware)

    bot.hears(
      /!spam.*/,
      BanHammerMiddleware.banHammerGeneralMiddleware,
      BanHammerMiddleware.spamBanMiddleware
    );

    bot.hears(
      /!treasonlover.*/,
      BanHammerMiddleware.banHammerGeneralMiddleware,
      BanHammerMiddleware.treasonLoverBanMiddleware
    );

    bot.hears(
      /!зрадойоб.*/,
      BanHammerMiddleware.banHammerGeneralMiddleware,
      BanHammerMiddleware.treasonLoverBanMiddleware
    );

    bot.use(BanHammerMiddleware.banHammerWatcher);
}

export default {
  install,
};
