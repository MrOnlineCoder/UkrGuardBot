import { MyBot } from "../../telegram/telegram.types";
import votebanMiddleware from "./voteban.middleware";

function install(bot: MyBot) {
  bot.hears("!voteban", votebanMiddleware.votebanMiddleware);
  bot.hears("!вотебан", votebanMiddleware.votebanMiddleware);
  bot.on('new_chat_members', votebanMiddleware.votebanNewChatMembersListener)
}

export default {
  install,
};
