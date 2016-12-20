var utils = require('../../../util/utils.js');
var pomelo = require('pomelo');

var exp = module.exports;

exp.getCCU = function(args, cb) {
    var sessionService = pomelo.app.get('sessionService').service;
    var ccu = utils.size(sessionService.sessions);
    cb(null, ccu);
};

exp.kich_user = function(username, cb) {
    var sessionService = pomelo.app.get('sessionService');
    sessionService.kick(username, 'kick by admin');
};
