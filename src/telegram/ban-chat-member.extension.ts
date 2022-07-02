import { Context } from "telegraf"

export async function banChatMember(ctx: Context, chatId: number, userId: number, revokeMessages = true) {
    await ctx.telegram.callApi("banChatMember", {
      chat_id: chatId,
      user_id: userId,
      revoke_messages: revokeMessages,
    });
}