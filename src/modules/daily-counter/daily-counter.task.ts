import { IAuditLogDailyTemplatePayload } from "../audit-log/audit-log.messages";
import auditLogService from "../audit-log/audit-log.service";
import { AuditLogEventType } from "../audit-log/audit-log.types";
import { BanReason } from "../ban-hammer/ban-hammer.interfaces";
import banHammerRepository from "../ban-hammer/ban-hammer.repository";

const END_OF_RUSSIA_DATE_START = new Date("2022-02-24T03:00:00.000Z");

async function sendDailyMessage() {
    const results = await banHammerRepository.countBanTypes();

    const rusBans = results.find(r => r.reason == BanReason.RUSSIAN_ORC)?.count ?? 0;
    const spamBans = results.find((r) => r.reason == BanReason.RUSSIAN_ORC)?.count ?? 0;

    const diffMs = Date.now() - END_OF_RUSSIA_DATE_START.valueOf();

    const diffDays = Math.round(
        diffMs / 1000 / 60 / 60 / 24
    );

    await auditLogService.writeLog(
        null,
        AuditLogEventType.DailyCounter,
        {
            rusBans,
            spamBans,
            warDays: diffDays
        } as IAuditLogDailyTemplatePayload
    );
}

export default {
    sendDailyMessage
}