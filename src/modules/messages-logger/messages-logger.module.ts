import { MyBot } from "../../telegram/telegram.types";
import MessagesLoggerMiddleware from "./messages-logger.middleware";

export default {
    install(bot: MyBot) {
        bot.use(MessagesLoggerMiddleware);
    }
}