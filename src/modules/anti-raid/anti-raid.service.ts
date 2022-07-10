import { getRedisClient } from "../../common/redis";

import axios from 'axios'
import logger from "../../common/logger";
import { MessageJudgementVerdict } from "./anti-radis.types";

async function isAntiRaidEnabled(chat_id: number) : Promise<Date | null> {
    const value  = await getRedisClient().get(`antiraid_mode:${chat_id}`);

    if (value) return new Date(value);

    return null;
} 

async function markAntiRaidEnabled(chat_id: number) {
    await getRedisClient().set(
      `antiraid_mode:${chat_id}`,
      new Date().toISOString()
    );
}

async function markAntiRaidDisabled(chat_id: number) {
  await getRedisClient().del(`antiraid_mode:${chat_id}`);
} 

async function judgeMessage(text: string): Promise<MessageJudgementVerdict> {
    try {
        const response = await axios({
            method: 'POST',
            baseURL: process.env.ML_URL,
            url: '/predict',
            data: {
                query: text
            }
        });

        logger.log(`AntiRaidService`, `Judgement finished form message "${text}": ${response.data.result}`);

        return response.data.result;
    } catch(err) {
        logger.error(`AntiRaidService`, `Judgement request failed`, err);

        return MessageJudgementVerdict.Pass;
    }
}

export default {
  isAntiRaidEnabled,
  markAntiRaidDisabled,
  markAntiRaidEnabled,
  judgeMessage,
};