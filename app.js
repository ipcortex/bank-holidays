'use strict';

const debug = require('debug')('app');
const request = require('request-promise-native');
const bankHolidayURL = 'https://www.gov.uk/bank-holidays.json';

// Load the config...
const config = require('./config');
// ...and set the defaults
config.companies = config.companies || [];
config.division = config.division || 'england-and-wales';

const pbx = require('./lib/pbx')(config.hostname, config.token, config.companies);

/**
 * Gets the bank holidays from the gov.uk website.
 */
const getBankHolidays = () => new Promise((resolve, reject) => {
	return request(bankHolidayURL)
		.then((body) => {
			let data;
			if(typeof body == 'string') {
				try {
					data = JSON.parse(body);
				}
				catch(e) {
					reject(e);
					return;
				}
			}
			if(!data.hasOwnProperty(config.division)) {
				reject(['Invalid division specified! Valid keys are:', Object.keys(data)]);
				return;
			}
			if(!data[config.division].hasOwnProperty('events') || !(data[config.division].events instanceof Array)) {
				reject('Unexpected data format! No event array in division?');
				return;
			}
			debug('Got', data[config.division].events.length, 'bank holiday dates');
			resolve(data[config.division].events);
		});
});

/**
 * Gets the bank holidays, filters them and then adds them to the PBX.
 */
const addBankHolidays = (existingEvents) => new Promise((resolve, reject) => {
	return getBankHolidays()
		.then((dates) => {
			let today = new Date();
			let oneYear = new Date(today.getTime());
			oneYear.setUTCFullYear(oneYear.getUTCFullYear() + 1);
			let nightmodes = Array.apply(null, { length: 10 }).map(Number.call, Number);
			let promises = [];
			let companies = Object.keys(existingEvents);
			debug('Adding bank holidays for', companies.length, (companies.length === 1) ? 'company' : 'companies');
			companies.forEach(company => {
				dates.forEach((day) => {
					let date = new Date(day.date);
					// Skip old dates and ones too far ahead
					if(date <= today || date > oneYear) return;
					nightmodes.forEach(n => {
						// Make sure we don't write the same event twice
						if(!existingEvents[company].some(event => (event.action == 'ON'
										&& event.repeat == 'NEVER'
										&& event.start.getTime() == date.getTime()
										&& event.end.getTime() == date.getTime() + 86400000)
										&& event.instance == n.toString())) {
							debug('Adding', date, 'to company', company, 'nightmode', n+1);
							promises.push(pbx.writeEvent(company, n, date));
						}
						/*else {
							// This produces silly levels of debug
							debug('Skipping', date, 'in company', company, 'nightmode', n+1, 'due to match.');
						}*/
					});
				});
			});
			debug(promises.length, (promises.length === 1) ? 'event' : 'events', 'to write');
			return Promise.all(promises).then(() => resolve());
		})
		.catch(err => reject(err));
});

pbx.validateTarget()
	.then(() => pbx.getNightmodeEvents())
	.then(events => addBankHolidays(events))
	.catch((err) => {
		if(!(err instanceof Array)) {
			err = [err];
		}
		console.error.apply(this, err);
	});
