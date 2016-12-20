var utils = require('../util/utils.js');
var dispatcher = require('../util/dispatcher.js');

var OK = 200;
var ERROR = 500;
var CHAT = 'onChat';

var ChatService = function(app) {
	this.app = app;
	this.uidMap = {};
	this.nameMap = {};
	this.channelMap = {};
}

module.exports = ChatService;

/**
* Add player into the channel
*/

ChatService.prototype.add = function(uid, userName, channelName) {
	var sid = getSidByUid(uid, this.app);
	if (!sid) {
		return ERROR;
	}

	if (checkDuplicate(this, uid, channelName)) {
		return OK;
	}

	var channel = this.app.get('channelService').getChannel(channelName, true);
	if (!channel) {
		return ERROR;
	}
	channel.add(uid, sid);
	addRecord(this, uid, userName, sid, channelName);
	return OK;

};

/**
* User leave the channel
*/

ChatService.prototype.leave = function(uid, channelName) {
	var record = this.uidMap[uid];
	var channel = this.app.get('channelService').getChannel(channelName, true);
	if (channel && record) {
		channel.leave(uid, record.sid);
	}
	removeRecord(this, uid, channelName);
};

ChatService.prototype.kick = function(uid) {
	var channelNames = this.channelMap[uid];
	var record = this.uidMap[uid];

	if(channelNames && record) {
		// remove user from channels
		var channel;
		for(var name in channelNames) {
			channel = this.app.get('channelService').getChannel(name);
			if(channel) {
				channel.leave(uid, record.sid);
			}
		}
	}
	clearRecords(this, uid);
};

/**
* Push message by the specified channel
*/

ChatService.prototype.pushByChannel = function(channelName, msg, cb) {
	var channel = this.app.get('channelService').getChannel(channelName);
	if (!channel) {
		cb(new Error('channel ' + channelName + ' does not exist'));
		return;
	}
	channel.pushMessage(CHAT, msg, cb);
}

/**
* Push message to the specified player
*/

ChatService.prototype.pushByPlayerName = function(playerName, msg, cb) {
	var record = this.nameMap[playerName];
	if (!record) {
		cb(null, ERROR);
		return;
	}
	this.app.get('channelService').pushMessageByUids(CHAT, msg, [{uid : record.uid, sid : record.sid}], cb);
};

var checkDuplicate = function(service, uid, channelName) {
	return !!service.channelMap[uid] && !!service.channelMap[uid][channelName];
};

/**
* Remove records for the specified user and channel pair
*/

var removeRecord = function(service, uid, channelName) {
	delete service.channelMap[uid][channelName];
	if (utils.size(service.channelMap[uid])) {
		return;
	}
	//If user not in any channel then clear his records
	clearRecords(service, uid);
};

/**
* Add records for the specified user
*/

var addRecord = function(service, uid, name, sid, channelName) {
	var record = {uid : uid, name : name, sid : sid};
	service.uidMap[uid] = record;
	service.nameMap[name] = record;
	var item = service.channelMap[uid];
	if (!item) {
		item = service.channelMap[uid] = {};
	}
	item[channelName] = 1;
};

/**
* Clear all records of the user
*/

var clearRecords = function(service, uid) {
	delete service.channelMap[uid];
	var record = service.uidMap[uid];
	if (!record) {
		return;
	}
	delete service.uidMap[uid];
	delete service.nameMap[record.name];
}

var getSidByUid = function(uid, app) {
	var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
	if (connector) {
		return connector.id;
	}
	return null;
};