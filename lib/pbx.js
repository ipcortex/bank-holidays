const debug = require('debug')('pbx');
const http = require('http');
const pool = new http.Agent({ maxSockets: 5 });
const request = require('request-promise-native').defaults({ pool: pool });

module.exports = function(hostname, token, companies) {
	const apiWriteCalURI = '/rest/dialplan/createcal';
	const apiAuthURI = '/rest/auth';
	const apiReadCalURI = '/rest/dialplan/readcal';
	const target = {
		hostname: hostname,
		token: token,
		companies: companies,
		get auth() { return { type: 'auth', key: this.token }; }
	};

	const requestErrorHandler = function(err, reject) {
		reject(['Connection error occurred:', err]);
	};

	/**
	 * Validate the target information we've been given.
	 */
	const validateTarget = () => new Promise((resolve, reject) => {
		return request.post(target.hostname + apiAuthURI, { json: { auth: target.auth } })
			.then((data) => {
				if(!data || !data.result) {
					reject('PBX API returned invalid data! API bug?');
				}
				if(data.result !== 'success') {
					reject(['PBX API authentication failed:', data.message]);
					return;
				}
				if(!data.user || !data.user.companies || !(data.user.companies instanceof Array)) {
					reject('Unexpected user company data!');
					return;
				}
				if(target.companies.length) {
					target.companies.forEach(company => {
						if(!data.user.companies.includes(company)) {
							console.warn('Company doesn\'t exist or we don\'t have access:', company);
							target.companies.splice(target.companies.indexOf(company), 1);
						}
					});
				}
				else {
					// If no companies are specified, assume that we want them all
					target.companies = data.user.companies;
				}
				debug('Target validation passed');
				resolve(target.companies);
			})
			.catch(err => requestErrorHandler(err, reject));
	});

	/**
	 * Get the existing nightmode events, and then process them.
	 */
	const getNightmodeEvents = () => new Promise((resolve, reject) => {
		return request.post(target.hostname + apiReadCalURI, { json: { type: 'nm', auth: target.auth } })
			.then((data) => {
				if(!data || !data.result) {
					reject('PBX API returned invalid data! API bug?');
				}
				if(data.result !== 'success') {
					reject(['Failed to get nightmode events: ', data.message]);
					return;
				}
				let events = {};
				Object.keys(data.values).forEach(company => {
					events[company] = data.values[company].map(event => {
						return { start: new Date(event.event_start), end: new Date(event.event_end), action: event.event_action, repeat: event.event_repeat, instance: event.event_instance };
					});
				});
				debug('Got events for', Object.keys(data.values).length, 'companies');
				resolve(events);
			})
			.catch(err => requestErrorHandler(err, reject));
	});

	/**
	 * Writes a date into nightmode events, via the PBX API.
	 */
	const writeEvent = (company, nightmode, day) => new Promise((resolve, reject) => {
		let event = {
			type: 'nm',
			values: {
				start: day.getTime(),
				end: day.getTime() + 86400000,
				last: null,
				repeat: 'NEVER',
				action: 'ON',
				instance: nightmode.toString(),
				company: company
			},
			auth: target.auth
		};
		return request.post(target.hostname + apiWriteCalURI, { json: event })
			.then((data) => {  
				if(!data || !data.result) {
					reject('PBX API returned invalid data! API bug?');
				}
				if(data.result !== 'success') {
					reject(['Failed to add event! Message:', data.message]);
					return;
				}
				else {
					debug('Event', day, 'added succesfully to', company, 'nightmode', nightmode);
				}
				resolve();
			})
			.catch(err => requestErrorHandler(err, reject));
	});

	return {
		validateTarget: validateTarget,
		getNightmodeEvents: getNightmodeEvents,
		writeEvent: writeEvent
	};
};
