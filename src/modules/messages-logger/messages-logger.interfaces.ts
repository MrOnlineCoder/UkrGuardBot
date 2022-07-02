export interface IMessage {
    id?: number;
    telegramMessageId: number;
    telegramChatId: number;
    telegramSenderId: number;
    senderName: string;
    senderUsername?: string;
    contentType: string;
    content: string;
    sentAt: Date;
    moderationVerdict?: string;
}