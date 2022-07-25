import { Context } from "telegraf";
import { Message } from "telegraf/typings/telegram-types";

export async function isChatAdmin(ctx: Context, userId?: number) {
    const admins = await ctx.getChatAdministrators();

    return admins.some(admin => admin.user.id ===  (userId || ctx.from?.id));
}

export function makeChatLink(title: string, username?: string) {
    if (!username) return `*${title} (private)*`;
    return `[${title}](https://t.me/${username})`
}

export function makeRawUserIdLink(title: string, id: number) {
    return `[${title}](tg://user?id=${id})`;
}

export function extractTextFromMessage(message: Message) : string | null {        
    if (message.text) return message.text;
    if (message.caption) return message.caption;
    
    return null;
}