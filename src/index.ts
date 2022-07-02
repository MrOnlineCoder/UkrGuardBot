import dotenv from 'dotenv'
dotenv.config();

import TelegramBot from './telegram/bot'

import Logger from './common/logger'

async function start() {
    await TelegramBot.init();

    Logger.log('Main', 'Bot started');
}

start();