var crc = require('crc');

module.exports.dispatch = function(uid, connectors) {
	var index = Math.abs(crc.crc32(uid)) % connectors.length;
	 //var index = Number(uid) % connectors.length;
	// var index = 0;
	if (!index) {
		index = 0;
	}
	return connectors[index];
};
