import { Context } from "telegraf"

export async function banChatMember(ctx: Context, chatId: number, userId: number, revokeMessages = true) {
    await ctx.telegram.callApi("banChatMember", {
      chat_id: chatId,
      user_id: userId,
      revoke_messages: revokeMessages,
    });
}

export async function banChatSenderChat(
  ctx: Context,
  chatId: number,
  senderChatId: number,
) {
  await ctx.telegram.callApi("banChatSenderChat", {
    chat_id: chatId,
    sender_chat_id: senderChatId,
  });
}