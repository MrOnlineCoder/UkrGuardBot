import { Context } from "telegraf";

export async function isChatAdmin(ctx: Context, userId?: number) {
    const admins = await ctx.getChatAdministrators();

    return admins.some(admin => admin.user.id ===  (userId || ctx.from?.id));
}