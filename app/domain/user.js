var UserFlag = require('../lib/constants/userFlag');
var GameConfig = require('../lib/config/gameConfig');
var messageService = require('./messageService');
var Debug = require('../log/debug');

var User = function(session, name) {
	this.name = '';
	if (name) {
		this.name = name;
		this.userId = name;
	}
	this.session = session;
	this.serverId = session.frontendId;
	this.id = session.uid;
	this.ipAddress = '';
	this.properties = {};
	this.room = null;
	this.connected = true;
};

module.exports = User;

User.prototype.setId = function(id) {
	this.id = id;
};

User.prototype.getId = function() {
	return this.id;
};

User.prototype.getSession = function() {
	return this.session;
};

User.prototype.setName = function(name) {
	this.name = name;
};

User.prototype.getName = function() {
	return this.name;
};

User.prototype.setSession = function(session) {
	this.session = session;
};

User.prototype.getSessionId = function() {
	if (this.session) {
		return this.session.id;
	} else {
		return -1;
	}
};

User.prototype.getServerId = function() {
	return this.serverId;
};

User.prototype.getUid = function() {
	return {uid: this.userId, sid: this.serverId};
};

User.prototype.getIpAddress = function() {
	return this.ipAddress;
};

User.prototype.setIpAddress = function(ipAddress) {
	this.ipAddress = ipAddress;
};

User.prototype.setProperty = function(key, value) {
	if (key !== UserFlag.MONEY) {
		this.properties[key] = value;
	} else {
		this.updateMoney(value);
	}
};

User.prototype.containsProperty = function(key) {
	return !!this.properties[key];
};

User.prototype.getProperty = function(key) {
	return this.properties[key];
};

User.prototype.setRoom = function(room) {
	this.room = room;
};

User.prototype.getRoom = function() {
	return this.room;
};

User.prototype.isConnected = function() {
	return this.connected;
};

User.prototype.setConnected = function(bl) {
	this.connected = bl;
};

//Chi dung voi nhung game ma user co thong so money
User.prototype.updateMoney = function(money) {
	if (money < 0) {
		money = 0;
	}
	this.properties[UserFlag.MONEY] = money;
};

User.prototype.addMoney = function(deltaMoney) {
	var currentMoney = this.properties[UserFlag.MONEY];
	if (currentMoney + deltaMoney < 0) {
		deltaMoney = -currentMoney;
	}
	this.properties[UserFlag.MONEY] = currentMoney + deltaMoney
};

User.prototype.updateGold = function(gold) {
	if (gold < 0) {
		gold = 0;
	}
	this.properties[UserFlag.GOLD] = gold;
};

User.prototype.addGold = function(deltaGold) {
	var currentGold = this.properties[UserFlag.GOLD];
	if (currentGold + deltaGold < 0) {
		deltaGold = -currentGold;
	}
	this.properties[UserFlag.GOLD] = currentGold + deltaGold;
};

