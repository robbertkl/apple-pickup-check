'use strict';

const log = require('./log');
const moment = require('moment-timezone');
const Twit = require('twit');

module.exports = () => {  
  const {
    TWITTER_CONSUMER_KEY: consumerKey,
    TWITTER_CONSUMER_SECRET: consumerSecret,
    TWITTER_ACCESS_TOKEN: accessToken,
    TWITTER_ACCESS_TOKEN_SECRET: accessTokenSecret,
  } = process.env;

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    log('WARNING', 'Not all TWITTER_ environment variables are set; disabling Twitter');
    return async () => {};
  }

  const twitter = new Twit({
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token: accessToken,
    access_token_secret: accessTokenSecret,
  });
  return async (notification) => {
    try {
      // Prepend time to prevent duplicate tweets from getting rejected
      const tweet = `[${moment().format('HH:mm')}] ${notification}`;      
      await twitter.post('statuses/update', {status: tweet});
    } catch (error) {
      log(error);
    }
  };  
};
