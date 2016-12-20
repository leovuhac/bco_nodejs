var Consts = require('../../../consts/consts');
var Commands = require('../../../lib/constants/commands');
var UserFlag = require('../../../lib/constants/userFlag');
var ParamsKey = require('../../../lib/constants/paramsKey');
var RoomManagerService = require('../../../domain/roomManagerService');
var messageService = require('../../../domain/messageService');
var pomelo = require('pomelo');
var User = require('../../../domain/user');
var Debug = require('../../../log/debug');

module.exports = function() {
    return new Filter();
};

var Filter = function() {

};

Filter.prototype.before = function(msg, session, next) {
    var route = msg.__route__;
    var uid = session.uid;
    if (!uid) {
        next();
        return;
    }
    //Cac request cua Admin voi he thong thi ko can filter
    if (route.indexOf('adminHandler') >= 0) {
        next();
        return;
    }
    var roomName = session.get('roomName');
    var userManagerService = pomelo.app.get('userManagerService');
    var user = userManagerService.getUserByName(uid);
    if (!user) {
        if (route.indexOf('lobbyHandler.user_info') >= 0) {
            user = new User(session, session.uid);
            userManagerService.addUser(user);
            Debug.game(uid, "=== playerFilter.before add to userManagerService");
        } else {
            Debug.game(uid, uid + " User not exist with msg " + JSON.stringify(msg));
            next(new Error(uid + " User not exist with msg " + JSON.stringify(msg)));
            return;
        }
    } else {
        user.setSession(session);
    }
    session.set('user', user);
    if (!roomName) {
        roomName = user.getProperty(UserFlag.ROOM_ID);
    }
    //kick user khoi room dang choi (vi bi disconnect) khi user join lai vao Lobby
    if ((route.indexOf('lobbyHandler') >= 0 && route.indexOf('user_info') >= 0) || route.indexOf('joinRoom') >= 0) {
        var username = session.uid;
        try {
            RoomManagerService.getInstance().kickUserFromAllRoom(username);
        } catch (ex) {
        }
    }
    //Check Room
    if (route.indexOf(Commands.JOIN_ROOM) >= 0 || route.indexOf('joinRoom') >= 0 || route.indexOf('lobbyHandler') >= 0 || roomName === Consts.LOBBY) {
        next();
        return;
    }
    var room = RoomManagerService.getInstance().getRoomByName(roomName);
    if (!room) {
        var strError = msg.toString();
        try {
            strError = JSON.stringify(msg);
        } catch (e) {}
        Debug.game(uid, uid + ' No room exist ! ' + roomName + " with msg " + strError);
        if (route.indexOf(Commands.LEAVE_ROOM) >= 0 || route.indexOf(Commands.STAND_UP) >= 0) {
            var reqInfo = {};
            reqInfo[ParamsKey.SUCCESS] = true;
            reqInfo[ParamsKey.REASON] = 0;
            reqInfo[ParamsKey.MESSAGE] = 'Leave Room Success';
            messageService.pushMessageToSession(session, Commands.LEAVE_ROOM, reqInfo);
        }
        next(new Error(uid + ' No room exist ! ' + roomName + " with msg " + strError));
        return;
    } else {
        session.set('room', room);
        next();
        return;
    }
}
