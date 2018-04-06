module.exports = {
	/**
	 * Hostname of PBX you want to add bank holidays to.
	 */
	hostname: '',
	
	/**
	 * API token from a user on the system. This user will need to have enough  
	 * privileges in order to use the nightmode API. (i.e. the user needs to
	 * have a role with "Night-mode management" permission AND they be a company
	 * administrator)
	 */
	token: 'ABCDEFG',

	/**
	 * Set the companies that you want to set nightmodes for, or leave blank for
	 * all companies.
	 */
	companies: [],

	/**
	 * Set the division of the UK you wish to add bank holidays for. Current
	 * possible values are 'england-and-wales', 'scotland', or 
	 * 'northern-ireland'.
	 */
	division: 'england-and-wales'
};
