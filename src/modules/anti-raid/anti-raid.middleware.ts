import { Context } from "telegraf";

async function antiRaidCommandMiddleware(ctx: Context, next: () => Promise<void>) {
    if (ctx.chat?.type == 'private') return null;
    
}

export default {
    antiRaidCommandMiddleware
}