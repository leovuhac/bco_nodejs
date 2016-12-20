var SCOPE = {PRIVATE : 1, ROOM : 2, LOBBY : 3};
var channelUtil = require('../../../util/channelUtil.js');
var utils = require('../../../util/utils.js');
var pomelo = require('pomelo');
var WordFilter = require('../../../util/wordFilter');

var OK = 200;
var ERROR = 500;

module.exports = function(app) {
	return new ChannelHandler(app, app.get('chatService'));
}

var ChannelHandler = function(app, chatService) {
	this.app = app;
	this.chatService = chatService;
	WordFilter.seed('../../config/' + 'profanity');
	WordFilter.setReplacementMethod('stars');
}

function setContent(str) {
  str = str.replace(/<\/?[^>]*>/g,'');
  str = str.replace(/[ | ]*\n/g,'\n');
	str = WordFilter.clean(str);
  return str.replace(/\n[\s| | ]*\r/g,'\n');
}

var getChannelName = function(msg) {
	var scope = msg.scope;
	if (scope === SCOPE.ROOM) {
		return channelUtil.getRoomChannelName(msg.roomId);
	}
	return channelUtil.getLobbyChannelName();
};

ChannelHandler.prototype.send = function(msg, session, next) {
	var scope, content,  channelName, uid, code;
	uid = msg.id;
	scope = msg.scope;
	msg.content = setContent(msg.content);
	channelName = getChannelName(msg);
	content = {userId : uid, content : msg.content, scope : scope, kind : msg.kind || 0, from : msg.from};
	if (scope != SCOPE.PRIVATE) {
		this.chatService.pushByChannel(channelName, content, function(err, res) {
			if (err) {
				code = ERROR;
			} else if (res) {
				code = res;
			} else {
				code = OK;
			}
			next(null, {code : code});
		});
	} else {
		this.chatService.pushByPlayerName(msg.toName, content, function(err, res) {
			if (err) {
				code = ERROR;
			} else if(res) {
				code = res;
			} else {
				code = OK;
			}
			next(null, {code : code});
		});
	}
};