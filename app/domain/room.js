var UserManagerService = require('./userManagerService');
var channelUtil = require('../util/channelUtil');
var messageService = require('./messageService');
var QuickplayGameController = require('../main/room/quickplay/quickplayGameController');
var ChallengeGameController = require('../main/room/challenge/challengeGameController');
var FreeplayGameController = require('../main/room/freeplay/freeplayGameController');
var Consts = require('../consts/consts');
var pomelo = require('pomelo');

var Room = function(opts) {
	this.name = opts.tableName;
	this.maxUsers = opts.maxUsers || 20;
	this.gameId = opts.gameId;
	this.password = null;
	this.passwordProtected = false;
	this.maxSpectators = -1;
	this.owner = null;
	this.userManager = new UserManagerService();
	this.hidden = false;
	this.active = true;
	this.properties = {};
	this.channel = null;
	this.initGameController();
	opts = null;
};

module.exports = Room;

Room.prototype.initGameController = function() {
	var opts = {room : this, gameId : this.gameId};
	switch (this.gameId) {
		case Consts.GAME_TYPE.CHALLENGE:
			this.gameController = new ChallengeGameController(opts);
			break;
		case Consts.GAME_TYPE.QUICK_PLAY:
			this.gameController = new QuickplayGameController(opts);
			break;
		case Consts.GAME_TYPE.FREE_PLAY:
			this.gameController = new FreeplayGameController(opts);
			break;
	}
};

Room.prototype.getGameId = function() {
	return this.gameId;
};

// For Send Message 

Room.prototype.getChannel = function() {
	//if (!this.channel) {
	//	var channelName = channelUtil.getRoomChannelName(this.name);
	//	this.channel = pomelo.app.get('channelService').getChannel(channelName, true);
	//}
	//return this.channel;
};

Room.prototype.sendAll = function(route, msg) {
	//this.getChannel().pushMessage(route, msg);
};

Room.prototype.sendToUser = function(route, msg, user) {
	messageService.pushMessageToPlayer(user.getUid(), route, msg);
};

Room.prototype.sendToUid = function(route, msg, userId, frontendId) {
	messageService.pushMessageToPlayer({uid: userId, sid: frontendId}, route, msg);
};

// End Send Message

Room.prototype.setGameController = function(gameController) {
	this.gameController = gameController;
};

Room.prototype.getGameControlelr = function() {
	return this.gameController;
};

Room.prototype.getId = function() {
	return this.id;
};

Room.prototype.getGroupId = function() {
	return this.groupId;
};

Room.prototype.setGroupId = function(groupId) {
	this.groupId = groupId;
};

Room.prototype.getName = function() {
	return this.name;
};

Room.prototype.setName = function(name) {
	this.name = name;
};

Room.prototype.getPassword = function() {
	return this.password;
};

Room.prototype.setPassword = function(password) {
	this.password = password;
	if (this.password && this.password.length > 0) {
		this.passwordProtected = true;
	} else {
		this.passwordProtected = false;
	}
};

Room.prototype.isPasswordProtected = function() {
	return this.passwordProtected;
};

Room.prototype.isPublic = function() {
	return this.passwordProtected;
};

Room.prototype.getMaxUsers = function() {
	return this.maxUsers;
};

Room.prototype.setMaxUsers = function(maxUsers) {
	this.maxUsers = maxUsers;
};

Room.prototype.getMaxSprectators = function() {
	return this.maxSpectators;
};

Room.prototype.setMaxSpectators = function(maxSpectators) {
	this.maxSpectators = maxSpectators;
};

Room.prototype.getOwner = function() {
	return this.owner;
};

Room.prototype.setOwner = function(user) {
	this.owner = user;
};

Room.prototype.getUserManager = function() {
	return this.userManager;
};

Room.prototype.setUserManager = function(userManager) {
	this.userManager = userManager;
};

Room.prototype.isHidden = function() {
	return this.hidden;
};

Room.prototype.setHidden = function(hidden) {
	this.hidden = hidden;
};

Room.prototype.isActive = function() {
	return this.active;
};

Room.prototype.setActive = function(active) {
	this.active = active;
};

Room.prototype.getPlayersList = function() {
	var playerList = [];
	for (var k in this.userManager.getAllUsers()) {
		var user = this.userManager.getAllUsers()[k];
		playerList.push(user);
	}
	return playerList;
};

Room.prototype.getProperty = function(key) {
	return this.properties[key];
};

Room.prototype.removeProperty = function(key) {
	delete this.properties[key];
};

Room.prototype.getUserById = function(id) {
	return this.userManager.getUserById(id);
};

Room.prototype.getUserByName = function(name) {
	return this.userManager.getUserByName(name);
};

Room.prototype.getUserList = function() {
	//return this.userManager.getAllUsers();
	var list = [];
	for (var i in this.userManager.getAllUsers()) {
		list.push(this.userManager.getAllUsers()[i]);
	}
	return list;
};

Room.prototype.containsProperty = function(key) {
	return this.properties.hasOwnProperty(key);
};

Room.prototype.setProperty = function(key, value) {
	this.properties[key] = value;
};

Room.prototype.containsUser = function(name) {
	if (typeof name === 'string') {
		return this.userManager.containsName(name);
	} else {
		return this.userManager.containsUser(name);
	}
};

Room.prototype.addUser = function(user) {
	if (this.userManager.containsUser(user)) {
		return {code : 500, message : "User already join room " + this.name};
	} 
	if (this.userManager.getCountUser() >= this.maxUsers) {
		return {code : 500, message : "Room " + this.name + " is full"};
	}
	this.userManager.addUser(user);
	return {code : 200, message : "Join Room Success"};
};

Room.prototype.removeUser = function(user) {
	this.userManager.removeUser(user);
};

Room.prototype.isEmpty = function() {
	return this.userManager.getCountUser() === 0;
};

Room.prototype.isFull = function() {
	return this.userManager.getCountUser() === this.maxUsers;
};

Room.prototype.reset = function() {
	this.gameController.reset();
	this.password = null;
	this.passwordProtected = false;
	this.userManager = new UserManagerService();
};

