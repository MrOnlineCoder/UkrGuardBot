import { makeRawUserIdLink } from "../../telegram/utils";
import { BanReason } from "../ban-hammer/ban-hammer.interfaces";
import { AuditLogEventType } from "./audit-log.types";
import moment from 'moment'

export interface IAuditLogBaseTemplatePayload {
  chatTitle: string;
  chatLink: string;
}

export interface IAuditLogBanTemplatePayload
  extends IAuditLogBaseTemplatePayload {
  userId: number;
  userFullname: string;
  adminId: number;
  adminFullname: string;
}

export interface IAuditLogAntiraidToggleTemplatePayload
  extends IAuditLogBaseTemplatePayload  {
    adminId: number;
    adminFullname: string;
  }

export interface IAuditLogAutobanTemplatePayload extends IAuditLogBanTemplatePayload {
  banReason: BanReason;
  banDate: Date;
}

export default {
  [AuditLogEventType.BanRussian]: (payload: IAuditLogBanTemplatePayload) =>
    `🐷🇷🇺 Забанено свинособаку.\n\nАккаунт: ${makeRawUserIdLink(
      payload.userFullname,
      payload.userId
    )}\nЧат: ${payload.chatLink}\nАдмін: ${makeRawUserIdLink(
      payload.adminFullname,
      payload.adminId
    )}\n#bans #rusbot`,
  [AuditLogEventType.BanSpam]: (payload: IAuditLogBanTemplatePayload) =>
    `🙊 Забанено спамера.\n\nАккаунт: ${makeRawUserIdLink(
      payload.userFullname,
      payload.userId
    )}\nЧат: ${payload.chatLink}\nАдмін: ${makeRawUserIdLink(
      payload.adminFullname,
      payload.adminId
    )}\n#bans #spam`,
  [AuditLogEventType.EnableAntiraid]: (
    payload: IAuditLogAntiraidToggleTemplatePayload
  ) =>
    `❗️ Оголошено рейдову тривогу в чаті ${
      payload.chatLink
    } адміністратором ${makeRawUserIdLink(
      payload.adminFullname,
      payload.adminId
    )}\n#antiraid`,
  [AuditLogEventType.DisableAntiraid]: (
    payload: IAuditLogAntiraidToggleTemplatePayload
  ) =>
    `✅ Відбій рейдової тривоги в чаті ${
      payload.chatLink
    }, повідомлено адміністратором ${makeRawUserIdLink(
      payload.adminFullname,
      payload.adminId
    )}\n#antiraid`,
  [AuditLogEventType.AutoBan]: (payload: IAuditLogAutobanTemplatePayload) => `
      🛡 Видано автоматичний бан.\n\nАккаунт: ${makeRawUserIdLink(
        payload.userFullname,
        payload.userId
      )}\nЧат: ${payload.chatLink}\nПричина: ${payload.banReason} від ${moment(payload.banDate).format('DD.MM.YYY HH:mm')}\n#bans
  `,
};
