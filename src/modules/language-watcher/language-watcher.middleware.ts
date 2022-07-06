import { Context } from "telegraf";
import Logger from "../../common/logger";

export default async (ctx: Context, next: Function) => {
  if (
    ctx.updateType == "message" &&
    ctx.updateSubTypes.includes("new_chat_members")
  ) {
    const users = ctx.message?.new_chat_members!;

    for (const user of users) {
      Logger.log(
        `LanguageWatcherMiddleware`,
        `New user ID ${user.id} (${user.first_name}) in chat ${
          ctx.chat!.id
        } has language code: ${user.language_code || 'n/a'}`
      );

      if (user.language_code && user.language_code.toLowerCase() == "ru") {
        const alertMsg = await ctx.reply(
          `❗️🇷🇺 У нового учасника чату ${user.first_name} (${
            user.username || user.id
          }) російська мова пристрою.`
        );

          setTimeout(async () => {
            await ctx.deleteMessage(alertMsg.message_id);
          }, 10 * 1000);
      }
    }
  }

  next();
};
