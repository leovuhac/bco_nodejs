var exp = module.exports;
var dispatcher = require('./dispatcher');

exp.room = function(session, msg, app, cb) {
	var roomServers = app.getServersByType('room');

	if(!roomServers || roomServers.length === 0) {
		cb(new Error('can not find room servers.'));
		return;
	}
	var serverId = 'room';
	var res = dispatcher.dispatch(session.uid, roomServers);
	if (res.id) {
		serverId = res.id;
	}
	cb(null, serverId);
};

exp.connector = function(session, msg, app, cb) {
	if(!session) {
		cb(new Error('fail to route to connector server for session is empty'));
		return;
	}

	if(!session.frontendId) {
		cb(new Error('fail to find frontend id in session'));
		return;
	}

	cb(null, session.frontendId);
};
