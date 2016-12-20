var pomelo = require('pomelo');
var utils = require('../../../util/utils.js');
var channelUtil  = require('../../../util/channelUtil.js');
var RoomManagerService = require('../../../domain/roomManagerService');
var Commands = require('../../../lib/constants/commands');

var exp = module.exports;

/**
 * Player exits. It wil persistent player's state in the database
 */
exp.playerLeave = function(args, cb) {
    var userId = args.userId;
    var roomName = args.roomId;
    var sessionId = args.sessionId;
    var room = RoomManagerService.getInstance().getRoomByName(roomName);
    var userManagerService = pomelo.app.get('userManagerService');
    var user = userManagerService.getUserByName(userId);
    try {
        if (!!room) {
            room.gameController.dispatchRequest(Commands.DISCONNECT, {}, user);
        }
    } catch (e) {
        console.log("PlayerRemote Error : " + e.stack);
    }
    if (user) {
        if (user.getSessionId() === sessionId) {
            userManagerService.removeUser(user);
        }
    }
    utils.invokeCallback(cb);
};
