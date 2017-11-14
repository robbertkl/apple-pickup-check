'use strict';

const moment = require('moment-timezone');

module.exports = (event, message) => {
  if (event === null) {
    return;
  }
  let outputFunction = console.log;
  if (event instanceof Error) {
    message = event.message;
    event = 'ERROR';
    outputFunction = console.error;
  }
  outputFunction(`${moment().format('YYYY-MM-DD HH:mm:ss')} - ${event}: ${message}`);
}
