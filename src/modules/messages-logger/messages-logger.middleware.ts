import { Context } from "telegraf";
import logger from "../../common/logger";
import messagesLoggerRepository from "./messages-logger.repository";
import {
  IBaseContextState,
    IMessage
} from './messages-logger.interfaces'
import { extractSenderMetadata } from "./messages-logger.utils";
import { Chat } from "telegraf/typings/telegram-types";

export default async (ctx: Context, next: () => Promise<void>) => {
  if (!ctx.message) {
    logger.log(`TelegramChat`, `Update "${ctx.updateType}" in chat ${ctx.chat?.id}`);
    return next();
  }

  const id = ctx.from?.id;
  const destinationFullText =
    ctx.chat?.type == "private" ? `PM (${id})` : `"${ctx.chat?.title}" (${ctx.chat?.id})`;
  const loggedMessageText =
    ctx.message?.text || `** ${ctx.updateType}/${ctx.updateSubTypes.join()} **`;

  let dbMessageContent: string = "";

  if (ctx.message?.text) dbMessageContent = ctx.message.text;
  if (ctx.message?.photo)
    dbMessageContent = ctx.message.photo.map((p) => p.file_id).join();
  if (ctx.message?.sticker) dbMessageContent = ctx.message.sticker.file_id;
  if (ctx.message?.video)
    dbMessageContent = [
      ctx.message.video.file_id,
      ctx.message.video.file_name!,
    ].join();

  const msg: IMessage = {
    content: dbMessageContent,
    contentType: ctx.updateSubTypes.join(),
    telegramChatId: ctx.chat?.id!,
    telegramMessageId: ctx.message?.message_id!,
    sentAt: new Date(ctx.message?.date! * 1000),
    telegramChatTitle: ctx.chat?.type === "private" ? null : ctx.chat?.title,
    ...extractSenderMetadata(ctx.message, ctx.from),
  };

  logger.log(
    "TelegramChat",
    `<${msg.telegramSenderType} ${msg.senderUsername || msg.senderName} (${msg.telegramSenderId}) @ ${destinationFullText}> ${loggedMessageText}`
  );

  try {
    const dbMessage = await messagesLoggerRepository.insert(msg);

    (ctx.state as IBaseContextState).dbMessage = dbMessage;
  } catch(err) {
      logger.error(`MessagesLogger`, `Error writing message to DB`, err);
  }
  
  next();
};
