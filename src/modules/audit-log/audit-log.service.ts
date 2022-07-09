import { Chat } from "telegraf/typings/telegram-types";
import { MyBot } from "../../telegram/telegram.types";
import { makeChatLink } from "../../telegram/utils";
import { AuditLogEventType } from "./audit-log.types";
import AuditlogMessages, { IAuditLogBaseTemplatePayload } from './audit-log.messages'
import logger from "../../common/logger";
import { Extra } from "telegraf";

let bot: MyBot;

const LOG_CHAT_ID = +process.env.BOT_LOG_CHAT_ID!;

function setBot(_bot: MyBot) {
    bot = _bot;
}

async function writeLog(chat: Chat, eventType: AuditLogEventType, payload: any) {
    if (!LOG_CHAT_ID) return;

    const possibleChatTitle: string = (chat as any).title;

    const chatLink = makeChatLink(possibleChatTitle || chat.id.toString());

    const messageTemplate = AuditlogMessages[eventType];

    const templatePayload: IAuditLogBaseTemplatePayload = {
        chatLink,
        chatTitle: possibleChatTitle,
        ...payload
    }

    const builtMessage = messageTemplate(templatePayload as any);

    const tgMessage = await bot.telegram.sendMessage(
        LOG_CHAT_ID,
        builtMessage,
        {
            parse_mode: 'Markdown'
        }
    );

    logger.log(
      `AuditLogService`,
      `Sent log event ${eventType}, happened in chat ${possibleChatTitle} (${chat.id}), message_id = ${tgMessage.message_id}`
    );

}

async function forwardMessageToLog(chatId: number, messageId: number) {
    await bot.telegram.forwardMessage(
        LOG_CHAT_ID,
        chatId,
        messageId,
    );
}

export default {
    setBot,
    forwardMessageToLog,
    writeLog
}