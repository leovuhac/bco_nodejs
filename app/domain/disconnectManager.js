var instance;

var DisconnectManager = function() {
	this.userDisconnectMap = {};
	this.userRoomDisconnectMap = {};
};

DisconnectManager.prototype.add = function(name, roomName) {
	this.userDisconnectMap[name] = Date.now();
	if (roomName) {
		this.userRoomDisconnectMap[name] = roomName;
	}
};

DisconnectManager.prototype.remove = function(name) {
	if (this.userDisconnectMap.hasOwnProperty(name)) {
		delete this.userDisconnectMap[name];
	}
	if (this.userRoomDisconnectMap.hasOwnProperty(name)) {
		delete this.userDisconnectMap[name];
	}
};

DisconnectManager.prototype.isContain = function(name) {
	return this.userDisconnectMap.hasOwnProperty(name);
};

DisconnectManager.prototype.getTime = function(name) {
	return this.userDisconnectMap[name];
};

DisconnectManager.prototype.getRoomName = function(name) {
	return this.userRoomDisconnectMap[name];
};

function getInstance () {
	if (!instance) {
		instance = new DisconnectManager();
	}
	return instance;
}

module.exports = {
	getInstance : getInstance
}