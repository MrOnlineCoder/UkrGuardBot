import { Context } from "telegraf";
import { banChatMember } from "../../telegram/ban-chat-member.extension";
import { isChatAdmin } from "../../telegram/utils";

export default async (ctx: Context, next: Function) => {
  if (ctx.chat?.type == "private") return next();

  const hasPermission = await isChatAdmin(ctx);

  if (!hasPermission) return next();

  if (!ctx.message?.reply_to_message) return next();

  const targetMessage = ctx.message?.reply_to_message!;
  const targetUser = targetMessage.from!;

  if (targetUser.id === ctx.from?.id) return next();

  if (ctx.message?.text.trim() == "!русня") {
    const isTargetAdmin = await isChatAdmin(ctx, targetUser.id);

    if (isTargetAdmin) return next();

    await banChatMember(ctx, ctx.chat?.id!, targetUser.id!, true);
    await ctx.deleteMessage();
    
    const ack = await ctx.reply(
      `✅ Русню під іменем ${targetUser.first_name} (ID ${targetUser.id}) забанено.`
    );  

    setTimeout(async () => {
        await ctx.telegram.deleteMessage(
            ack.chat.id,
            ack.message_id
        );
    }, 5000);
  }
};
