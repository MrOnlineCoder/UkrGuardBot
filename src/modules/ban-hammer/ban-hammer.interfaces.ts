import { Message, ReplyMessage, User } from 'telegraf/typings/telegram-types';
import { IBaseContextState, IMessageSenderMetadata, TelegramSenderType } from '../messages-logger/messages-logger.interfaces';

export interface IBan {
    id?: number;
    telegramUserId: number;
    telegramChatId: number;
    telegramAdminId: number;
    telegramMessageId: number;
    telegramSenderType: TelegramSenderType;
    originMessageContent?: string | null;
    reason: BanReason;
    isGlobal: boolean;
    banDate: Date;
}

export enum BanReason {
    UNKNOWN = 'UNKNOWN',
    RUSSIAN_ORC = 'RUSSIAN_ORC',
    SPAM = 'SPAM',
    TREASON_LOVER = 'TREASON_LOVER'
}

export interface IBanHammerMiddlewareState extends IBaseContextState {
    targetSenderMetadata: IMessageSenderMetadata;
    targetMessage: Message;
}