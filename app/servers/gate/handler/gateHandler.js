var dispatcher = require('../../../util/dispatcher');
var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.queryEntry = function(msg, session, next) {
    var uid = msg.uid;
    //if(!uid) {
    //	next(null, {
    //		code: 500
    //	});
    //	return;
    //}
    // get all connectors
    var connectors = this.app.getServersByType('connector');
    if(!connectors || connectors.length === 0) {
        next(null, {
            code: 500
        });
        return;
    }
    try {
        if (!uid || uid.length === 0) {
            var sessionService = pomelo.app.get('sessionService').service;
            var ipAddress = sessionService.getClientAddressBySessionId(session.id).ip;
            uid = ipAddress;
        }
    } catch (e) {
        console.log(e.stack);
    }
    // select connector
    var res = dispatcher.dispatch(uid, connectors);
    next(null, {
        code: 200,
        host: res.clientHost,
        port: res.clientPort
    });
};

/**
 * Get app config
 */
handler.get_config = function(msg, session, next) {
  next(null, {code : 200});
};
