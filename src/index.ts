import dotenv from 'dotenv'
dotenv.config();

import TelegramBot from './telegram/bot'

import Logger from './common/logger'
import { initDb } from './common/db';
import { initRedis } from './common/redis';
import { initWebApi } from './api';

async function start() {
    await initDb();
    await initRedis();
    await initWebApi();
    await TelegramBot.init();

    Logger.log('Main', 'Bot started');
}

start().catch(err => {
    console.error(`start() caught error:`,err);
    process.exit(1);
});

process.on("uncaughtException", async (error) => {
  console.error(`uncaughtException`, error);
  process.exit(1);
});

process.on("unhandledRejection", async (error) => {
  console.error(`unhandledRejection`, error);
  process.exit(1);
});