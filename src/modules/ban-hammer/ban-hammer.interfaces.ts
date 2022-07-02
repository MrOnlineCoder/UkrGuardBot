import { ReplyMessage, User } from 'telegraf/typings/telegram-types';

export interface IBan {
    id?: number;
    telegramUserId: number;
    telegramChatId: number;
    telegramAdminId: number;
    telegramMessageId: number;
    originMessageContent?: string | null;
    reason: BanReason;
    isGlobal: boolean;
    banDate: Date;
}

export enum BanReason {
    UNKNOWN = 'UNKNOWN',
    RUSSIAN_ORC = 'RUSSIAN_ORC',
    SPAM = 'SPAM'
}

export interface IBanHammerMiddlewareState {
    targetBanMessage: ReplyMessage; 
    targetBanUser: User;
}