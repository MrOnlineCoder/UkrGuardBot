import { getDbClient } from "../db";
import { IBan } from "./ban-hammer.interfaces";

export default {
    insertBan: async (ban: IBan) => {
        await getDbClient().query(`
            INSERT INTO bans (telegram_user_id, telegram_chat_id, telegram_message_id, telegram_admin_id, origin_message_content, is_global, reason)
            VALUES (
                $1, $2, $3, $4, $5, $6, $7
            )
        `, [
            ban.telegramUserId,
            ban.telegramChatId,
            ban.telegramMessageId,
            ban.telegramAdminId,
            ban.originMessageContent,
            ban.isGlobal,
            ban.reason
        ]);
    }
}