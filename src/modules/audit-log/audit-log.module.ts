import { MyBot } from "../../telegram/telegram.types";

import AuditLogService from './audit-log.service'

export default {
    install(bot: MyBot) {
        AuditLogService.setBot(bot);
    }
}