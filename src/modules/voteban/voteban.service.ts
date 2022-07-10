import { getRedisClient } from "../../common/redis";

const JOIN_COUNTDOWN = 12 * 60 * 60; //12 hours
const BAN_DURATION = 12 * 60 * 60; //12 hours
const NEEDED_VOTES = 1;
const VOTING_DURATION = 1 * 60 * 60; //1 hour

async function startJoinCountdown(chatId: number, userId: number) {
    await getRedisClient().set(`join_countdown:${chatId}:${userId}`, new Date().toISOString(), "EX", JOIN_COUNTDOWN);
}

async function isOnCountdown(chatId: number, userId: number) {
    return await getRedisClient().exists(`join_countdown:${chatId}:${userId}`);
}

async function putVote(chatId: number, voterId: number, targetId: number): Promise<number> {
    const setName = `voteban:${chatId}:${targetId}`;

    await getRedisClient().sadd(setName, voterId);

    await getRedisClient().expire(setName, VOTING_DURATION);

    return await getRedisClient().scard(setName);
}

export default {
  NEEDED_VOTES,
  startJoinCountdown,
  isOnCountdown,
  putVote,
  BAN_DURATION,
};