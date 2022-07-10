export interface IMessage {
  id?: number;
  telegramMessageId: number;
  telegramChatId: number;
  telegramSenderId?: number;
  telegramChatTitle?: string | null;
  telegramSenderType: TelegramSenderType;
  senderName?: string | null;
  senderUsername?: string | null;
  contentType: string;
  content: string;
  sentAt: Date;
  moderationVerdict?: string;
  deletedAt?: Date | null;
}

export enum TelegramSenderType {
  USER = "USER",
  CHANNEL = "CHANNEL",
  GROUP = "GROUP",
}

export interface IBaseContextState {
  dbMessage: IMessage;
}

export interface IMessageSenderMetadata {
  telegramSenderId?: number;
  telegramSenderType: TelegramSenderType;
  senderName?: string | null;
  senderUsername?: string | null;
}