'use strict';

const log = require('./log');
const moment = require('moment-timezone');
const PickupAvailabilityEmitter = require('..');

// Send out notifications on these channels
const notificationChannels = [
  require('./telegram')(),
  require('./twitter')(),
];

// Make sure all times are local
moment.tz.setDefault('Europe/Amsterdam');

// Search near the Apple Store Amsterdam by default
const defaultPostcode = '1017 PS';

// By default, look for all 4 iPhone X configurations
const defaultProducts = [
  'MQAC2ZD/A', // iPhone X 64 GB space gray
  'MQAD2ZD/A', // iPhone X 64 GB silver
  'MQAF2ZD/A', // iPhone X 256 GB space gray
  'MQAG2ZD/A', // iPhone X 256 GB silver
];

const products = process.env.PRODUCTS ? process.env.PRODUCTS.split(',') : defaultProducts;
let postcode = process.env.POSTCODE || defaultPostcode;
postcode.replace(/^(\d{4})([A-Z]{2})$/i, (match, p1, p2) => `${p1} ${p2}`);

const pickupAvailabilityEmitter = new PickupAvailabilityEmitter(products, postcode);

pickupAvailabilityEmitter.on('error', log);

pickupAvailabilityEmitter.on('change', (product, store, oldStatus, newStatus) => {
  if (oldStatus) {
    log('CHANGE', `${oldStatus} => ${newStatus} (${product} @ ${store})`);
  } else {
    log('INIT', `${newStatus} (${product} @ ${store})`);
  }
  
  if (newStatus != PickupAvailabilityEmitter.AVAILABLE
      && newStatus != PickupAvailabilityEmitter.UNAVAILABLE
      && newStatus != PickupAvailabilityEmitter.INELIGIBLE) {
    log(new Error(`Unknown status ${newStatus}`));
  }

  product = product.replace(', ', ' ');

  if (oldStatus) {
    let notification = null;

    const now = moment();
    let when = 'in de komende uren';
    if (now.hour() >= 20 && now.hour() < 23) {
      when = 'straks om 23:00';
    } else if (now.hour() >= 0 && now.hour() < 6) {
      when = 'straks om 06:00';
    }
    
    if (newStatus == PickupAvailabilityEmitter.AVAILABLE) {
      notification = `De ${product} is NU beschikbaar voor ophalen bij Apple Store ${store}!`;
    } else if (oldStatus == PickupAvailabilityEmitter.AVAILABLE && newStatus == PickupAvailabilityEmitter.INELIGIBLE) {
      notification = `De ${product} is nu helaas niet meer beschikbaar voor ophalen bij Apple Store ${store}, maar waarschijnlijk is deze ${when} wel weer beschikbaar.`;
    } else if (oldStatus == PickupAvailabilityEmitter.AVAILABLE) {      
      notification = `De ${product} is nu helaas niet meer beschikbaar voor ophalen bij Apple Store ${store}.`;
    } else if (oldStatus == PickupAvailabilityEmitter.UNAVAILABLE && newStatus == PickupAvailabilityEmitter.INELIGIBLE) {
      notification = `De ${product} komt waarschijnlijk ${when} beschikbaar voor ophalen bij Apple Store ${store}.`;
    } else if (oldStatus == PickupAvailabilityEmitter.INELIGIBLE && newStatus == PickupAvailabilityEmitter.UNAVAILABLE) {
      notification = `Het lijkt erop dat de ${product} waarschijnlijk toch niet meer in de komende uren beschikbaar komt voor ophalen bij Apple Store ${store}.`;
    }

    if (notification) {
      log('NOTIFY', `"${notification}"`);
      notificationChannels.forEach(channel => {
        channel(notification);
      });
    }
  }
});

pickupAvailabilityEmitter.schedule(5 * 1000);
