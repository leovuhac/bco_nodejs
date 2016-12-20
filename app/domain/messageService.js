var pomelo = require('pomelo');
var utils = require('../util/utils');
var Debug = require('../log/debug');

var exp = module.exports;

exp.pushMessageByUids = function (uids, route, msg) {
	if (utils.size(msg) === 0) {
		var nmsg = {};
		nmsg["code"] = 200;
		pomelo.app.get('channelService').pushMessageByUids(route, nmsg, uids, errHandler);
	} else {
		pomelo.app.get('channelService').pushMessageByUids(route, msg, uids, errHandler);
	}
};

exp.pushMessageToPlayer = function (uid, route, msg) {
  exp.pushMessageByUids([uid], route, msg);
};

exp.pushMessageToUser = function(user, route, msg) {
	// exp.pushMessageToPlayer(user.getUid(), route, msg);
	exp.pushMessageToSession(user.getSession(), route, msg);
}

exp.pushMessageToSession = function(session, route, msg) {
	exp.pushMessageToPlayer({uid : session.uid, sid : session.frontendId}, route, msg);
}

function errHandler(err, fails){
	if(!!err){
		Debug.error("messageService", err);
		console.log("messageService " + err.stack + " fails " + fails);
	}
}