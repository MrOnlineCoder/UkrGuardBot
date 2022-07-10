import { getRedisClient } from "../../common/redis";

const JOIN_COUNTDOWN = 12 * 60 * 60; //12 hours
const BAN_DURATION = 12 * 60 * 60; //12 hours
const NEEDED_VOTES = 3;
const VOTING_DURATION = 1 * 60 * 60; //1 hour

function getRequiredVotesCount(chatSize: number) {
    if (chatSize <= 100) return 3;
    if (chatSize <= 500) return 4;
    return 5;
}

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
  getRequiredVotesCount,
  BAN_DURATION,
};