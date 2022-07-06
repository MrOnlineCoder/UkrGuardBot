import { MyBot } from "../../telegram/telegram.types";
import antiRaidMiddleware from "./anti-raid.middleware";

function install(bot: MyBot) {
    bot.hears('!рейд', antiRaidMiddleware.antiRaidCommandMiddleware);
}

export default {
    install
}