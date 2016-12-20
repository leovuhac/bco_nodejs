var ChannelUtil = module.exports;

var LOBBY_CHANNEL_NAME = "lobby";
var ROOM_CHANNEL_PREFIX = "room";

ChannelUtil.getLobbyChannelName = function() {
	return LOBBY_CHANNEL_NAME;
}

ChannelUtil.getRoomChannelName = function(roomId) {
	return ROOM_CHANNEL_PREFIX + roomId;
}