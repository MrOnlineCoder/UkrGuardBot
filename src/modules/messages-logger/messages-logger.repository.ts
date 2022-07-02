import { getDbClient } from "../db";
import { IMessage } from "./messages-logger.interfaces";

const MS_PER_HOUR = 60 * 60 * 1000;

function mapRowToMessage(row: any): IMessage {
    return {
        id: row.id,
        telegramChatTitle: row.telegram_chat_title,
        content: row.content,
        contentType: row.content_type,
        senderName: row.sender_name,
        sentAt: row.sent_at,
        telegramChatId: row.telegram_chat_id,
        telegramSenderId: row.telegram_sender_id,
        senderUsername: row.sender_username,
        telegramMessageId: row.telegram_message_id,
        moderationVerdict: row.moderation_verdict
    }
}

export default {
  insert: async (message: IMessage) => {
    await getDbClient().query(
      `INSERT INTO messages 
            (telegram_message_id, telegram_chat_id, telegram_sender_id, sender_name, sender_username, content_type, content, sent_at, moderation_verdict, telegram_chat_title) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )`,
      [
        message.telegramMessageId,
        message.telegramChatId,
        message.telegramSenderId,
        message.senderName,
        message.senderUsername,
        message.contentType,
        message.content,
        message.sentAt,
        message.moderationVerdict,
        message.telegramChatTitle,
      ]
    );
  },
  findLastMessagesOfUser: async (userId: number, agoMillis: number = MS_PER_HOUR) => {
      const { rows } = await getDbClient().query(`
        SELECT * FROM messages WHERE telegram_sender_id = $1 AND sent_at > $2
      `, [
          userId,
          new Date(Date.now() - agoMillis)
      ]);

      return rows.map(mapRowToMessage);
  }
};