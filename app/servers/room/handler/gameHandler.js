var pomelo = require('pomelo');
var RoomManagerService = require('../../../domain/roomManagerService');
var messageService = require('../../../domain/messageService');
var Debug = require('../../../log/debug');
var Commands = require('../../../lib/constants/commands');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.joinRoom = function(msg, session, next) {
    try {
        var roomName = msg.roomName;
        var password = msg.password;
        var user = session.get('user');
        if (!user) {
            var res = {code: 500, success : false, message: 'User in session not exist'};
            messageService.pushMessageToSession(session, Commands.JOIN_ROOM, res);
            Debug.game(session.uid, "JoinRoom User in session not exist");
            next(null, res);
            return;
        }
        var room = RoomManagerService.getInstance().getRoomByName(roomName);
        if (room) {
            if (room.isPasswordProtected() && password !== room.getPassword()) {
                var res = {code: 500, success : false,  message: 'Sai mật khẩu vào bàn'};
                messageService.pushMessageToSession(session, Commands.JOIN_ROOM, res);
                Debug.game(session.uid, "JoinRoom Error " + JSON.stringify(res));
                next(null, res);
                return;
            }
            room.gameController.dispatchRequest(Commands.JOIN_ROOM, msg, user);
            next(null, {code: 200, success : true,  message: 'Join Room Success'});
        } else {
            var res = {code: 500, success : false,  message: 'Room name + ' + roomName + " not exist"};
            messageService.pushMessageToSession(session, Commands.JOIN_ROOM, res);
            Debug.game(session.uid, "JoinRoom Error " + JSON.stringify(res));
            next(null, res);
        }
    } catch (e) {
        Debug.error("gameHandler JoinRoom", e);
        next(null, {code: 500, message: 'Join Room Exception'});
    }
};

handler.gameRequest = function(msg, session, next) {
    try {
        var route = msg.__route__;
        var user = session.get('user');
        if (!user) {
            next(null, {code: 500, message: 'User in session not exist'});
            return;
        }
        var requestId = msg['_cmd_'];
        var room = session.get('room');
        if (!room) {
            var roomName = user.getProperty("room_id");
            var room = RoomManagerService.getInstance().getRoomByName(roomName);
        }
        if (room) {
            //console.log(user.getName() + "===Game Request " + route + "." + requestId);
            room.gameController.dispatchRequest(requestId, msg, user);
            if (!(requestId === "fire" || requestId === 'fire_hit' || requestId === 'fire_out_of_game')) {
                Debug.game(session.uid, "gameRequest " + JSON.stringify(msg));
            }
            next(null, /*{code: 200}*/{});
        } else {
            Debug.game(session.uid, "gameRequest Room not exist");
            next(null, {code: 500, message: 'Room not exist'});
        }
    } catch (e) {
        next(null, {code: 500, message: 'gameRequest Exception'});
    }
};