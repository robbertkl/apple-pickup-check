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

    if (newStatus == PickupAvailabilityEmitter.AVAILABLE) {
      notification = `De ${product} is NU beschikbaar voor ophalen bij Apple Store ${store}!`;
    } else if (oldStatus == PickupAvailabilityEmitter.AVAILABLE && newStatus == PickupAvailabilityEmitter.INELIGIBLE) {
      notification = `De ${product} is nu helaas niet meer beschikbaar voor ophalen bij Apple Store ${store}, maar staat nog wel klaar om binnenkort opnieuw beschikbaar te komen.`;
    } else if (oldStatus == PickupAvailabilityEmitter.AVAILABLE) {
      notification = `De ${product} is nu helaas niet meer beschikbaar voor ophalen bij Apple Store ${store}.`;
    } else if (oldStatus == PickupAvailabilityEmitter.UNAVAILABLE && newStatus == PickupAvailabilityEmitter.INELIGIBLE) {
      notification = `De ${product} staat klaar om binnenkort beschikbaar te komen voor ophalen bij Apple Store ${store}. Meestal gebeurt dit om 06:00 of 23:00.`;
    } else if (oldStatus == PickupAvailabilityEmitter.INELIGIBLE && newStatus == PickupAvailabilityEmitter.UNAVAILABLE) {
      notification = `De ${product} staat nu niet meer klaar om binnenkort beschikbaar te komen voor ophalen bij Apple Store ${store}.`;
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
