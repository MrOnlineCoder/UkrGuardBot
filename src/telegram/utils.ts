import { Context } from "telegraf";

export async function isChatAdmin(ctx: Context) {
    const admins = await ctx.getChatAdministrators();

    return admins.find(admin => admin.user.id === ctx.from?.id);
}