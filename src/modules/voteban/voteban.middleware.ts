import moment from "moment";
import { Context } from "telegraf";
import { Message } from "telegraf/typings/telegram-types";
import { isChatAdmin, makeRawUserIdLink } from "../../telegram/utils";
import auditLogService from "../audit-log/audit-log.service";
import { AuditLogEventType } from "../audit-log/audit-log.types";
import {
  IBaseContextState,
  TelegramSenderType,
} from "../messages-logger/messages-logger.interfaces";
import { extractSenderMetadata } from "../messages-logger/messages-logger.utils";
import votebanService from "./voteban.service";

async function votebanMiddleware(ctx: Context, next: Function) {
  if (!ctx.chat) return next();

  if (ctx.chat!.type == "private") return next();

  if (!ctx.message?.reply_to_message) return next();

  const state = ctx.state as IBaseContextState;

  const targetMessage = ctx.message.reply_to_message as Message;

  const targetMetadata = extractSenderMetadata(
    targetMessage,
    targetMessage.from
  );

  const isTargetAdmin = await isChatAdmin(ctx, targetMessage.from?.id!);

  if (isTargetAdmin) return next();

  if (state.dbMessage.telegramSenderType != TelegramSenderType.USER)
    return next();

  const joinCountdown = await votebanService.isOnJoinCountdown(
    ctx.chat.id!,
    ctx.from?.id!
  );

  if (joinCountdown) {
    const ack = await ctx.reply(
      `⏱ ${state.dbMessage.senderName}, для голосування за бан, Вам необіхдно пробути в чаті щонайменше 1 добу.`
    );

    setTimeout(async () => {
      await ctx.deleteMessage(ack.message_id);
    }, 6500);

    return;
  }

  const votingCountdown = await votebanService.isOnVotebanCountdown(
    ctx.chat.id!,
    ctx.from?.id!
  );

  if (votingCountdown) {
    const ack = await ctx.reply(
      `⏱ ${state.dbMessage.senderName}, Ви можете розпочинати голосування на бан лише раз в 20 хвилин. Зачекайте будь ласка.`
    );

    setTimeout(async () => {
      await ctx.deleteMessage(ack.message_id);
    }, 6500);

    return;
  }

  const votesCount = await votebanService.putVote(
    ctx.chat?.id!,
    state.dbMessage.telegramSenderId!,
    targetMetadata.telegramSenderId!
  );

  const chatMembersCount = await ctx.getChatMembersCount();

  const requiredVotesCount = votebanService.getRequiredVotesCount(chatMembersCount);

  const targetLink = makeRawUserIdLink(
    targetMetadata.senderName!,
    targetMetadata.telegramSenderId!
  );

  if (votesCount < requiredVotesCount) {
    if (votesCount == 1) {
      //we just started the voting right now
      await votebanService.startVotebanCountdown(
        ctx.chat?.id!,
        state.dbMessage.telegramSenderId!
      );
    }

    await ctx.reply(
      `🗳 ${makeRawUserIdLink(
        state.dbMessage.senderName!,
        state.dbMessage.telegramSenderId!
      )} проголосував за бан ${targetLink}, набрано ${votesCount} / ${requiredVotesCount} голосів.`,
      {
        parse_mode: "Markdown",
      }
    );
  } else {
    await ctx.restrictChatMember(targetMetadata.telegramSenderId!, {
      until_date: moment().add(votebanService.BAN_DURATION, "seconds").unix(),
      permissions: {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_other_messages: false,
        can_pin_messages: false,
      },
    });

    await ctx.reply(
      `🏹 За результатами голосування, ${targetLink} був заблокований на декілька годин. Адміністраторам чата було повідомлено про необхідність перевірки даного користувача.`,
      {
        parse_mode: "Markdown",
      }
    );

    const admins = await ctx.getChatAdministrators();

    const adminMentions = [];

    for (const admin of admins) {
      if (admin.user.username) {
        adminMentions.push(`@${admin.user.username!}`);
      }
    }

    await auditLogService.writeLog(ctx.chat!, AuditLogEventType.Votebanned, {
      userId: targetMetadata.telegramSenderId,
      userFullname: targetMetadata.senderName,
      adminList: adminMentions.join(" "),
    });
  }
}

async function votebanNewChatMembersListener(ctx: Context, next: Function) {
  const newMembers = ctx.message?.new_chat_members!;

  for (const member of newMembers) {
    await votebanService.startJoinCountdown(ctx.chat?.id!, member.id);
  }
}

export default {
  votebanMiddleware,
  votebanNewChatMembersListener,
};
