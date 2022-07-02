import { Context } from "telegraf";
import { banChatMember } from "../../telegram/ban-chat-member.extension";
import { isChatAdmin } from "../../telegram/utils";

export default async (ctx: Context, next: Function) => {
  if (ctx.chat?.type == "private") return next();

  if (!isChatAdmin(ctx)) return next();

  if (!ctx.message?.reply_to_message) return next();

  const targetMessage = ctx.message?.reply_to_message!;
  const targetUser = targetMessage.from!;

  if (ctx.message?.text == "!русня") {
    await banChatMember(ctx, ctx.chat?.id!, targetUser.id!, true);
    await ctx.deleteMessage();
    
    const ack = await ctx.reply(
      `✅ Русню під іменем ${targetUser.first_name} (${targetUser.id}) забанено.`
    );  

    setTimeout(async () => {
        await ctx.telegram.deleteMessage(
            ack.chat.id,
            ack.message_id
        );
    }, 5000);
  }
};
