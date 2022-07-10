import { getDbClient } from "../../common/db";
import { MessageJudgementVerdict } from "../anti-raid/anti-radis.types";
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
        moderationVerdict: row.moderation_verdict,
        telegramSenderType: row.telegram_sender_type,
        deletedAt: row.deleted_at
    }
}

export default {
  insert: async (message: IMessage): Promise<IMessage> => {
    const { rows } = await getDbClient().query(
      `INSERT INTO messages 
            (telegram_message_id, telegram_chat_id, telegram_sender_id, telegram_sender_type, sender_name, sender_username, content_type, content, sent_at, moderation_verdict, telegram_chat_title) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING id`,
      [
        message.telegramMessageId,
        message.telegramChatId,
        message.telegramSenderId,
        message.telegramSenderType,
        message.senderName,
        message.senderUsername,
        message.contentType,
        message.content,
        message.sentAt,
        message.moderationVerdict,
        message.telegramChatTitle,
      ]
    );

    const insertedId = rows[0].id;

    return {
      ...message,
      id: insertedId,
    };
  },
  findLastMessagesOfUser: async (
    userId: number,
    agoMillis: number = MS_PER_HOUR
  ) => {
    const { rows } = await getDbClient().query(
      `
        SELECT * FROM messages WHERE telegram_sender_id = $1 AND sent_at > $2 AND deleted_at is NULL
      `,
      [userId, new Date(Date.now() - agoMillis)]
    );

    return rows.map(mapRowToMessage);
  },
  updateMessageVerdict: async (
    messageId: number,
    veridct: MessageJudgementVerdict
  ) => {
    await getDbClient().query(
      `
      UPDATE messages SET moderation_verdict = $1 WHERE id = $2
    `,
      [veridct, messageId]
    );
  },
  setMessageDeletionDate: async (messageId: number, date: Date | null) => {
    await getDbClient().query(
      `UPDATE messages SET deleted_at = $1 WHERE id = $2`,
      [date, messageId]
    );
  },
  setMessageDeletionDateByChatId: async (telegramChatId: number, telegramMessageId: number, date: Date | null) => {
    await getDbClient().query(
      `UPDATE messages SET deleted_at = $1 WHERE telegram_chat_id = $2 AND telegram_message_id = $3`,
      [date, telegramChatId, telegramMessageId]
    );
  },
};