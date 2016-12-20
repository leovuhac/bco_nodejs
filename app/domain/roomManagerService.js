var utils = require('../util/utils.js');

var RoomManagerService = function() {
	this.roomsById = {};
	this.roomsByName = {};
	this.roomsByGroup = {};
	this.groups = [];
	this.gameRoomCounter = 0;
};

// module.exports = RoomManagerService;

function getInstance () {
	return module.exports.instance;
}

module.exports = {
	getInstance : getInstance,
	instance : new RoomManagerService()
}

RoomManagerService.prototype.addGroup = function(groupId) {
	this.groups.push(groupId);
};

RoomManagerService.prototype.addRoom = function(room) {
	this.roomsById[room.getId()] = room;
	this.roomsByName[room.getName()] = room;
	if (this.groups.indexOf(room.getGroupId()) < 0) {
		this.groups.push(room.getGroupId());
	}
	this.addRoomToGroup(room);
};

RoomManagerService.prototype.containsGroup = function(groupId) {
	return this.groups.indexOf(groupId) > 0;
};

RoomManagerService.prototype.getRoomById = function(id) {
	return this.roomsById[id];
};

RoomManagerService.prototype.getRoomByName = function (name) {
	return this.roomsByName[name];
};

RoomManagerService.prototype.getRoomList = function() {
	var roomList = [];
	for (var k in this.roomsById) {
		roomList.push(this.roomsById[k]);
	}
	return roomList;
};

RoomManagerService.prototype.getTotalRoomCount = function() {
	return utils.size(this.roomsById);
};

RoomManagerService.prototype.removeGroup = function(groupId) {
	if (this.containsGroup(groupId)) {
		this.groups.splice(this.groups.indexOf(groupId), 1);
	}
};

RoomManagerService.prototype.removeRoomById = function(roomId) {
	var room = this.roomsById[roomId];
	if (room) {
		this.removeRoom(room);
	}
};

RoomManagerService.prototype.removeRoomByName = function(name) {
	var room = this.roomsByName[name];
	if (room) {
		this.removeRoom(room);
	}
};

RoomManagerService.prototype.removeRoom = function(room) {
	
};

RoomManagerService.prototype.containsRoom = function(room) {
	return this.roomsById.hasOwnProperty(room.getId());
};

RoomManagerService.prototype.containsRoomName = function(name) {
	return this.roomsByName.hasOwnProperty(name);
};

RoomManagerService.prototype.addRoomToGroup = function(room) {
	var groupId = room.getGroupId();
	var roomList = this.roomsByGroup[groupId];
	if (!roomList) {
		roomList = [];
		this.roomsByGroup[groupId] = roomList;
	}
	roomList.push(room);
};

RoomManagerService.prototype.unHideAll = function() {
	for (var k in this.roomsByName) {
		this.roomsByName[k].setHidden(false);
	}
};

RoomManagerService.prototype.kickUserFromAllRoom = function(username) {
	for (var k in this.roomsByName) {
		if (this.roomsByName[k] && this.roomsByName[k].gameController) {
			this.roomsByName[k].gameController.doKickUser(username);
		}
	}
};