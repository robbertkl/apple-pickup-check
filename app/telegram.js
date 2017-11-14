'use strict';

const log = require('./log');
const TelegramBot = require('node-telegram-bot-api');

module.exports = () => {  
  const {
    TELEGRAM_BOT_TOKEN: botToken,
    TELEGRAM_CHAT_ID: chatId,
  } = process.env;
  
  if (!botToken || !chatId) {
    log('WARNING', 'Not all TELEGRAM_ environment variables are set; disabling Telegram');
    return async () => {};
  }
  const telegram = new TelegramBot(botToken);
  return async (notification) => {
    try {
      await telegram.sendMessage(chatId, notification);
    } catch (error) {
      log(error);
    }
  };  
};
