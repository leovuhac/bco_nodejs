var logger = require('pomelo-logger').getLogger('game-log');

function replaceAll(source, find, rep) {
	var re = new RegExp(find, 'g');
	return source.replace(re, rep);
}

function game (playerName, message) {
	try {
		//replaceAll(message, '@', '*');
		//logger.info('@' + playerName + '@game@ ' + message);
	} catch (e) {
		//console.log(e.stack);
	}
}

function error (roomName, ex) {
	try {
		logger.error('@error@ ' + roomName + " " + ex.message + '---->' + ex.stack);
	} catch (e) {

	}
}

function error2 (roomName, ex) {
	try {
		logger.error('@error@ ' + roomName + " " + ex.message);
	} catch (e) {

	}
}

function lobby (message) {
	try {
		//replaceAll(message, '@', '*');
		//logger.info('@lobby@ ' + message);
	} catch (e) {
		//console.log(e.stack);
	}
}

function login (message) {
	try {
		//replaceAll(message, '@', '*');
		//logger.info('@login@ ' + message);
	} catch (e) {
		//console.log(e.stack);
	}
}

function admin (message) {
	try {
		replaceAll(message, '@', '*');
		logger.info('@admin@ ' + message);
	} catch (e) {

	}
}

function money (message) {
	try {
		replaceAll(message, '@', '*');
		logger.info('@money@ ' + message);
	} catch (e) {

	}
}

function request(roomName, message) {
	try {
		//replaceAll(message, '@', '*');
		//logger.info('@' + roomName + '@request@ ' + message);
	} catch (e) {
		//console.log(e.stack);
	}
}

function updateDbMoney(message, username) {
	try {
		if (username && message) {
			replaceAll(message, '@', '*');
			logger.info('@' + username + '@updateDBmoney@ ' + message);
		}
	} catch (e) {

	}
}

function logDisconnect(message) {
	try {
		//replaceAll(message, '@', '*');
		//logger.info('@disconnect@ ' + message);
	} catch (e) {

	}
}

module.exports = {
	game : game,
	error : error,
	error2 : error2,
	lobby : lobby,
	money : money,
	request : request,
	admin : admin,
	login : login,
	updateDbMoney : updateDbMoney,
	logDisconnect : logDisconnect,
	isShutdown : false,
	isLogInGame : true,
	isTraceGameActionOrigin : false
};