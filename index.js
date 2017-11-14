'use strict';

const axios = require('axios');
const EventEmitter = require('events');
const moment = require('moment-timezone');

module.exports =
class PickupAvailabilityEmitter extends EventEmitter {
	constructor	(products, postcode = '1017 PS') {
		super();

		const productsQuery = products.map((product, index) => `parts.${index}=${encodeURIComponent(product)}`).join('&');
		const locationQuery = `location=${encodeURIComponent(postcode)}`;
		this.url = `https://www.apple.com/nl/shop/retail/pickup-message?pl=true&${productsQuery}&${locationQuery}`;
		this.state = {};
	}
	
	static get AVAILABLE() {
		return 'available';
	}
	
	static get UNAVAILABLE() {
		return 'unavailable';
	}
	
	static get INELIGIBLE() {
		return 'ineligible';
	}

	async once() {
		try {
			const changes = await this._checkForChanges();
			for (const change of changes) {
				this.emit('change', ...change);
			}
		} catch (error) {
			this.emit('error', error);
		}
	}

	schedule(interval = 10 * 1000) {
		const scheduled = async () => {
			await this.once();
			setTimeout(scheduled, interval);
		}
		scheduled();
	}

	async _checkForChanges() {
		const changes = [];
		
		const productAvailability = await this._fetchProductAvailability();
		const now = moment();		
		for (const product in productAvailability) {
			if (!(product in this.state)) this.state[product] = {};
			for (const store in productAvailability[product]) {
				if (!(store in this.state[product])) this.state[product][store] = {status: null, time: null};
				const state = this.state[product][store];
				
				// Skip change if there was already a change less than 2 minutes ago
				if (state.time !== null && now.diff(state.time, 'seconds') < 120) continue;

				const oldStatus = state.status;
				const newStatus = productAvailability[product][store];
				if (oldStatus !== newStatus) {
					changes.push([product, store, oldStatus, newStatus]);
					state.status = newStatus;
					if (oldStatus !== null) state.time = now;
				}
			}
		}
		
		return changes;
	}
	
	async _fetchProductAvailability() {
		const result = {};
		
		const response = await axios.get(this.url, {timeout: 2000});
		for (const store of response.data.body.stores) {
			const storeName = store.storeName;
			for (const product in store.partsAvailability) {
				const availability = store.partsAvailability[product];
				const productName = availability.storePickupProductTitle;
				if (!(productName in result)) result[productName] = {};
				result[productName][storeName] = availability.pickupDisplay;
			}
		}
		
		return result;
	}
}
