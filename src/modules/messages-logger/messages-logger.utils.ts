import { Context } from "telegraf";
import { Chat, Message, User } from "telegraf/typings/telegram-types";
import logger from "../../common/logger";
import {
  IMessageSenderMetadata,
  TelegramSenderType,
} from "./messages-logger.interfaces";
import messagesLoggerRepository from "./messages-logger.repository";

export function getTelegramSenderTypeFromMessage(
  message?: Message
): TelegramSenderType {
  if (message?.sender_chat) {
    if (message.sender_chat.type == "channel")
      return TelegramSenderType.CHANNEL;

    return TelegramSenderType.GROUP;
  } else {
    return TelegramSenderType.USER;
  }
}

export function extractSenderMetadata(
  message?: Message,
  from?: User
): IMessageSenderMetadata {
  const meta: IMessageSenderMetadata = {
    telegramSenderType: getTelegramSenderTypeFromMessage(message),
  };

  //We should take data from ctx.from only if sender is really a user
  if (meta.telegramSenderType == TelegramSenderType.USER) {
    const nameTokens = [
      from?.first_name && from?.first_name.trim(),
      from?.last_name && from?.last_name.trim(),
    ].filter(Boolean);

    meta.senderName = nameTokens.join(" ");

    meta.senderUsername = from?.username || null;
    meta.telegramSenderId = from?.id;
  } else {
    //Otherwise, the ctx.from would be some fake user as ChannelBot or GroupBot
    //so we must address `ctx.message.sender_chat`
    const realSender =
      meta.telegramSenderType == TelegramSenderType.CHANNEL
        ? (message?.sender_chat as Chat.ChannelChat)
        : (message?.sender_chat as Chat.SupergroupChat);

    meta.senderUsername = realSender.username;
    meta.senderName = realSender.title;
    meta.telegramSenderId = realSender.id;
  }

  return meta;
}

export async function deleteMessageInTelegramAndDb(
  ctx: Context,
  chatId: number,
  messageId: number
) {
  try {
    await messagesLoggerRepository.setMessageDeletionDateByChatId(
      chatId,
      messageId,
      new Date()
    );

    await ctx.telegram.deleteMessage(chatId, messageId);
  } catch (err) {
    logger.error(
      `MessagesLogger`,
      `Failed to delete message ${chatId}/${messageId}`,
      err
    );
  }
}
