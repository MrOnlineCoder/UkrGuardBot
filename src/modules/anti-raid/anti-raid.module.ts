import { MyBot } from "../../telegram/telegram.types";
import antiRaidMiddleware from "./anti-raid.middleware";

function install(bot: MyBot) {
    bot.hears(/!рейд\s.*/, antiRaidMiddleware.antiRaidCommandMiddleware);
    bot.use(antiRaidMiddleware.antiRaidJudgementMiddleware);
}

export default {
    install
}