import dotenv from 'dotenv'
dotenv.config();

import TelegramBot from './telegram/bot'

import Logger from './common/logger'
import { initDb } from './modules/db';

async function start() {
    await initDb();
    await TelegramBot.init();

    Logger.log('Main', 'Bot started');
}

start();