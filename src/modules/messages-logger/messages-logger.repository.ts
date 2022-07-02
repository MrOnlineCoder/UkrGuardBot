import { getDbClient } from "../db";
import { IMessage } from "./messages-logger.interfaces";

export default {
    insert: async (message: IMessage) => {
        await getDbClient().query(
            `INSERT INTO messages 
            (telegram_message_id, telegram_chat_id, telegram_sender_id, sender_name, sender_username, content_type, content, sent_at, moderation_verdict) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
            )`, [
                message.telegramMessageId,
                message.telegramChatId,
                message.telegramSenderId,
                message.senderName,
                message.senderUsername,
                message.contentType,
                message.content,
                message.sentAt,
                message.moderationVerdict
            ]
        );
    }
}