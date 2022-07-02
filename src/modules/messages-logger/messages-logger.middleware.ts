import { Context } from "telegraf";
import logger from "../../common/logger";
import messagesLoggerRepository from "./messages-logger.repository";
import {
    IMessage
} from './messages-logger.interfaces'

export default async (ctx: Context, next: () => Promise<void>) => {
  const username = ctx.from?.username || ctx.from?.first_name || "n/a";
  const id = ctx.from?.id;
  const fromFull =
    ctx.chat?.type == "private" ? `PM (${id})` : `"${ctx.chat?.title}" (${ctx.chat?.id})`;
  const loggedMessageText =
    ctx.message?.text || `** ${ctx.updateType}/${ctx.updateSubTypes.join()} **`;

  logger.log(
    "TelegramChat",
    `<${username} @ ${fromFull}> ${loggedMessageText}`
  );

  try {
    let dbMessageContent: string = '';

    if (ctx.message?.text) dbMessageContent = ctx.message.text;
    if (ctx.message?.photo) dbMessageContent = ctx.message.photo.map(p => p.file_id).join();
    if (ctx.message?.sticker) dbMessageContent = ctx.message.sticker.file_id;
    if (ctx.message?.video) dbMessageContent = [ctx.message.video.file_id, ctx.message.video.file_name!].join();

    const msg: IMessage = {
      content: dbMessageContent,
      contentType: ctx.updateSubTypes.join(),
      senderName: ctx.from?.first_name! + (ctx.from?.last_name ? ' ' + ctx.from?.last_name : ''),
      senderUsername: ctx.from?.username,
      telegramChatId: ctx.chat?.id!,
      telegramMessageId: ctx.message?.message_id!,
      telegramSenderId: ctx.from?.id!,
      sentAt: new Date(ctx.message?.date! * 1000),
      telegramChatTitle: ctx.chat?.type === 'private' ? null : ctx.chat?.title
    };

    await messagesLoggerRepository.insert(msg);
  } catch(err) {
      logger.error(`MessagesLogger`, `Error writing message to DB`, err);
  }

  next();
};
