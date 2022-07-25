import { getDbClient } from "../../common/db";
import { BanReason, IBan } from "./ban-hammer.interfaces";

function mapRowToBan(row: any): IBan {
  return {
    id: row["id"],
    telegramUserId: row["telegram_user_id"],
    telegramChatId: row["telegram_chat_id"],
    telegramAdminId: row["telegram_admin_id"],
    telegramMessageId: row["telegram_message_id"],
    isGlobal: row["is_global"],
    reason: row["reason"],
    banDate: row["ban_date"],
    originMessageContent: row["origin_message_content"],
    telegramSenderType: row["telegram_sender_type"],
  };
}

export type IBanCountsByType = {
  reason: BanReason;
  count: number;
};

export default {
  mapRowToBan,
  insertBan: async (ban: IBan) => {
    await getDbClient().query(
      `
            INSERT INTO bans (telegram_user_id, telegram_chat_id, telegram_message_id, telegram_admin_id, telegram_sender_type, origin_message_content, is_global, reason)
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8
            )
        `,
      [
        ban.telegramUserId,
        ban.telegramChatId,
        ban.telegramMessageId,
        ban.telegramAdminId,
        ban.telegramSenderType,
        ban.originMessageContent,
        ban.isGlobal,
        ban.reason,
      ]
    );
  },
  findBansByUserId: async (
    userId: number,
    isGlobal = true
  ): Promise<IBan[]> => {
    const { rows } = await getDbClient().query(
      `
            SELECT * FROM bans WHERE telegram_user_id = $1 AND is_global = $2
        `,
      [userId, isGlobal]
    );

    return rows.map(mapRowToBan);
  },
  findSpamBansByContent: async (content: string): Promise<IBan[]> => {
    const { rows } = await getDbClient().query(
      `
                SELECT * FROM bans WHERE reason = $1 AND origin_message_content = $2 AND is_global = $3
            `,
      [BanReason.SPAM, content, true]
    );

    return rows.map(mapRowToBan);
  },
  countBanTypes: async (): Promise<IBanCountsByType[]> => {
    const { rows } = await getDbClient().query(
      `SELECT reason, count(*) FROM bans GROUP BY reason`
    )

    return rows;
  },
};
