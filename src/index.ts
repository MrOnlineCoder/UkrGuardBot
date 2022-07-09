import dotenv from 'dotenv'
dotenv.config();

import TelegramBot from './telegram/bot'

import Logger from './common/logger'
import { initDb } from './common/db';
import { initRedis } from './common/redis';

async function start() {
    await initDb();
    await initRedis();
    await TelegramBot.init();

    Logger.log('Main', 'Bot started');
}

start();