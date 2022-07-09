import { makeRawUserIdLink } from "../../telegram/utils";
import { AuditLogEventType } from "./audit-log.types";

export interface IAuditLogBaseTemplatePayload {
  chatTitle: string;
  chatLink: string;
}

export interface IAuditLogBanRussianTemplatePayload
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

export default {
  [AuditLogEventType.BanRussian]: (
    payload: IAuditLogBanRussianTemplatePayload
  ) =>
    `🐷🇷🇺 Забанено свинособаку.\n\nАккаунт ${makeRawUserIdLink(
      payload.userFullname,
      payload.userId
    )}\nЧат: ${payload.chatLink}\nАдмін: ${makeRawUserIdLink(
      payload.adminFullname,
      payload.adminId
    )}\n#bans #rusbot`,
  [AuditLogEventType.BanSpam]: (payload: IAuditLogBanRussianTemplatePayload) =>
    `🙊 Забанено спамера.\n\nАккаунт ${makeRawUserIdLink(
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
    )}`,
  [AuditLogEventType.DisableAntiraid]: (
    payload: IAuditLogAntiraidToggleTemplatePayload
  ) =>
    `✅ Відбій рейдової тривоги в чаті ${
      payload.chatLink
    }, повідомлено адміністратором ${makeRawUserIdLink(
      payload.adminFullname,
      payload.adminId
    )}`,
};
