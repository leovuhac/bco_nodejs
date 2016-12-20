var pomelo = require('pomelo');
var util = require('util');
var Consts = require('../../consts/consts');
var utils = require('../../util/utils');
var Database = require('../../lib/database/database');
var Debug = require('../../log/debug');
var Common = require('../../lib/common/common');
var LevelTable = require('../../lib/constants/levelTable');
var messageService = require('../../domain/messageService');
var RoomManagerService = require('../../domain/roomManagerService');
var RoomSettingManager = require('../../lib/config/roomSettingManager');
var Commands = require('../../lib/constants/commands');
var UserFlag = require('../../lib/constants/userFlag');
var RequestData = require('./requestData');
var Timer = require('./timer');
var Database = require('../../lib/database/database');
var channelUtil = require('../../util/channelUtil');
var Player = require('./player');

var GameController = function(opts) {
    this.room = opts.room;
    this.gameId = opts.gameId;

    this.spectators = []; //Queue Cac player dung xem
    this.fishQueue = []; //Danh sach cac ca trong ban choi
    this.bulletsQueue = []; //Danh sach dan dang bay trong ban choi
    this.requestQueue = []; //H?ng request data c?a user g?i lên
    this.logGameBuilder = [];
    this.gameState = 0; //Tr?ng thái c?a game
    this.hostId = 0;
    this.timeChangedState = 0;
    this.currentMachineWin = 0;
    this.currentMachineLost = 0;
    this.roomSetting = RoomSettingManager.getInstance().getSetting(this.gameId, this.room.getName());
    //
    this.players = []; //Cac player choi trong ban choi
    for (var i = 0; i < this.roomSetting.getMaxPlayer(); i++) {
        this.players[i] = null;
    }
    this.database = Database.getInstance();
    this.timer = new Timer({
        gameController: this,
        interval: Consts.GAME_TIMER_INTERVAL
    });
    this.start();
};

module.exports = GameController;

var prot = GameController.prototype;

GameController.LEAVE_ROOM_REASON = {
    USER_SEND_LEAVE : 0,
    USER_DISCONNECT : 1,
    NOT_ENOUGH_MONEY : 2,
    REQUEST_TIME_OUT : 3,
    KICK_BY_ADMIN : 4,
    ROOM_OUT_OF_SEAT : 5
};

// ==============================================================
// INIT METHODS
// ==============================================================

prot.start = function() {
    this.timer.run();
};

prot.sendToList = function(command, info, players) {
    var uids = [];
    if (!info) {
        info = {};
    }
    for (var i = 0; i < players.length; i++) {
        if (players[i]) {
            uids.push(players[i].getUser().getUid());
        }
    }
    if (uids.length > 0) {
        messageService.pushMessageByUids(uids, command, info);
    }
};

prot.sendToListIgnoreOne = function(command, info, players, ignorePlayer) {
    var uids = [];
    if (!info) {
        info = {};
    }
    for (var i = 0; i < players.length; i++) {
        if (players[i] && players[i].getName() !== ignorePlayer.getName()) {
            uids.push(players[i].getUser().getUid());
        }
    }
    if (uids.length > 0) {
        messageService.pushMessageByUids(uids, command, info);
    }
};

prot.sendToPlayer = function(command, info, player) {
    var players = [];
    players.push(player);
    this.sendToList(command, info, players);
};

prot.sendToUser = function(command, info, user) {
    /*
    var uids = [];
    if (!info) {
        info = {};
    }
    if (user) {
        uids.push(user.getUid());
    }
    if (uids.length > 0) {
        messageService.pushMessageByUids(uids, command, info);
    }
    */
    if (typeof user === 'string') {
        user = pomelo.app.get('userManagerService').getUserByName(user);
    }
    if (user && user.getSession()) {
        messageService.pushMessageToUser(user, command, info);
    }
};

// ==============================================================
// PUBLIC METHODS
// ==============================================================

prot.doLoop = function() {

};

prot.processRequestQueue = function() {
};

prot.fire = function() {};

prot.doKickUser = function() {};

prot.reset = function() {};

prot.dispatchRequest = function (requestId, msg, user) {
    if (!user) {
        return;
    }
    if (typeof user === 'string') {
        user = pomelo.app.get('userManagerService').getUserByName(user);
    }
    if (requestId === Commands.FIRE) {
        this.fire(msg, user);
    } else {
        var request = new RequestData(requestId, msg, user);
        this.requestQueue.push(request);
    }
    var player = this.findPlayer(user.getName());
    if (player) {
        //
        player.lastTimeSendRequest = Date.now();
    }
};

// ==============================================================
// PRIVATE METHODS
// ==============================================================

prot.resetSessionWhenLeaveRoom = function(user) {
    var session = user.getSession();
    session.set('roomName', Consts.LOBBY);
    session.set('gameId', -1);
    session.set('room', Consts.LOBBY);
    session.set('user', user.getName());
    session.pushAll(function (err) {
        pomelo.app.rpc.chat.chatRemote.kick(session, session.uid, null);
    });
    Debug.game(user.getName(), 'GameController resetSessionWhenLeaveRoom');
};

prot.pushSessionWhenJoinRoom = function(user) {
    var session = user.getSession();
    session.set('user', session.uid);
    session.set('roomName', this.roomSetting.getName());
    pomelo.app.rpc.chat.chatRemote.add(session, session.uid, session.uid, channelUtil.getRoomChannelName(this.room.getName()), null);
    session.pushAll();
    Debug.game(user.getName(), 'GameController pushSessionWhenJoinRoom');
};

prot.findPlayer = function(username) {
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i] && this.players[i].getName() === username) {
            return this.players[i];
        }
    }
    return null;
};

prot.findSpectator = function(username) {
    for (var i = 0; i < this.spectators.length; i++) {
        if (this.spectators[i]) {
            if (this.spectators[i].getName() === username) {
                return this.spectators[i];
            }
        }
    }
    return null;
};

prot.seatInListPlayer = function(username) {
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i] && this.players[i].getName() === username) {
            return i;
        }
    }
    return -1;
};

prot.countPlayerPlaying = function() {
    var count = 0;
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i]) {
            count++;
        }
    }
    return count;
};

prot.indexInListSpectator = function(username) {
    for (var i = 0; i < this.spectators.length; i++) {
        if (this.spectators[i]) {
            if (this.spectators[i].getName() === username) {
                return i;
            }
        }
    }
    return -1;
};

prot.removeFromPlayers = function(username) {
    if (!username) {
        return false;
    }
    var seat = this.seatInListPlayer(username);
    if (seat >= 0) {
        //Neu tim dc ghe thi moi remove
        this.players[seat] = null;
    } else {
        return false;
    }
    return true;
};

prot.countSpectatorInRoom = function() {
    var count = 0;
    for (var i = 0; i < this.spectators.length; i++) {
        if (this.spectators[i]) {
            count++;
        }
    }
    return count;
};

prot.addToSpectators = function(player) {
    if (this.countSpectatorInRoom() >= Consts.MAX_SPECTATORS_IN_GAME) {
        return false;
    }
    if (!player) {
        return false;
    }
    if (this.indexInListSpectator(player.getName()) < 0) {
        this.spectators.push(player);
        return this.spectators.length - 1;
    } else {
        return false;
    }
};

prot.removeFromSpectators = function(username) {
    if (!username) {
        return false;
    }
    var index = this.indexInListSpectator(username);
    if (index >= 0) {
        this.spectators.splice(index, 1);
        return true;
    } else {
        return false;
    }
};

prot.addBullet = function(bullet) {
     if (!bullet) {
         return false;
     }
    var bulletAlreadyInList = false;
    for (var i = 0; i < this.bulletsQueue.length; i++) {
        if (this.bulletsQueue[i].uid === bullet.uid) {
            bulletAlreadyInList = true;
            break;
        }
    }
    if (!bulletAlreadyInList) {
        this.bulletsQueue.push(bullet);
    }
    return true;
};

prot.findBullet = function(uid) {
    for (var i = 0; i < this.bulletsQueue.length; i++) {
        if (this.bulletsQueue[i].uid === uid) {
            return this.bulletsQueue[i];
        }
    }
    return null;
}

prot.removeBullet = function(bulletId) {
    if (!bulletId) {
        return false;
    }
    for (var i = 0; i < this.bulletsQueue.length; i++) {
        if (this.bulletsQueue[i].uid === bulletId) {
            this.bulletsQueue.splice(i, 1);
            i--;
        }
    }
    return true;
};

prot.addFish = function(fish) {
    if (!fish) {
        return false;
    }
    var fishAlreadyInList = false;
    for (var i = 0; i < this.fishQueue.length; i++) {
        if (this.fishQueue[i] && this.fishQueue[i].uid === fish.uid) {
            fishAlreadyInList = true;
            break;
        }
    }
    if (!fishAlreadyInList) {
        this.fishQueue.push(fish);
    }
    return true;
};

prot.findFish = function(uid) {
    for (var i = 0; i < this.fishQueue.length; i++) {
        if (this.fishQueue[i].uid === uid) {
            return this.fishQueue[i];
        }
    }
    return null;
};

prot.removeFish = function(fishId) {
    if (!fishId) {
        return false;
    }
    for (var i = 0; i < this.fishQueue.length; i++) {
        if (this.fishQueue[i].uid === fishId) {
            this.fishQueue.splice(i, 1);
            i--;
        }
    }
    return true;
};

prot.validSameLevelMoney = function(money) {
    var bl = true;
    var MIN_MONEY_LIMIT = 0;
    //for (var i = 0; i < this.players.length; i++) {
    //    var player = this.players[i];
    //    if (player) {
    //        var minMoney = this.roomSetting.minJoinRoom;
    //        var maxMoney = this.roomSetting.maxMoneyJoinRoom;
    //        if (maxMoney > minMoney && minMoney > MIN_MONEY_LIMIT) {
    //            if (minMoney <= player.getMoney() && player.getMoney() <= maxMoney) {
    //                return true;
    //            }
    //        } else {
    //            if (minMoney > MIN_MONEY_LIMIT && minMoney <= player.getMoney()) {
    //                return true;
    //            }
    //        }
    //    }
    //}
    var countPlayer = this.countPlayerPlaying();
    if (countPlayer == 0) {
        var minMoney = this.roomSetting.minJoinRoom;
        var maxMoney = this.roomSetting.maxMoneyJoinRoom;
        if (maxMoney > minMoney && minMoney > MIN_MONEY_LIMIT) {
            if (minMoney <= money && money <= maxMoney) {
                return true;
            }
        } else {
            if (minMoney > MIN_MONEY_LIMIT && minMoney <= money) {
                return true;
            }
        }
    } else {
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            if (player) {
                if (Math.abs(player.getMoney() - money) > Consts.DIFF_PLAYER_MONEY_MATCH) {
                    bl = false;
                    break;
                }
            }
        }
    }
    return bl
};

prot.containBot = function() {
    var bl = false;
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player && player.isBot()) {
            bl = true;
            break;
        }
    }
    return bl;
};

// ==============================================================
// GETTERS && SETTERS
// ==============================================================

prot.getGameState = function() {
    return this.gameState;
};

prot.setGameState = function(state) {
    if (state !== this.gameState) {
        this.timeChangedState = Date.now();
        this.gameState = state;
        this.database.updateQuickRoom(this.room.getName(), 'play_state', this.gameState);
    }
};

prot.setHostId = function(hostId) {
    this.hostId = hostId;
};

prot.addCurrentMachineWin = function(m) {
    this.currentMachineWin += m;
};

prot.addCurrentMachineLost = function(m) {
    this.currentMachineLost += m;
};

prot.resetCurrentMachineWinLost = function(m) {
    this.currentMachineLost = 0;
    this.currentMachineWin = 0;
};

prot.playersToString = function() {
    var pArr = [];
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i] && this.players[i].getState() === Player.STATE_PLAYING) {
            var n = this.players[i].getName();
            var t = this.players[i].getTitle();
            var m = this.players[i].getMoney();
            pArr.push({name: n, title: t, money: m});
        }
    }
    return JSON.stringify(pArr);
};

prot.fishQueueToString = function() {
    var fArr = [];
    for (var i = 0; i < this.fishQueue.length; i++) {
        if (this.fishQueue[i]) {
            fArr.push(this.fishQueue[i].uid);
        } else {
            fArr.push('null');
        }
    }
    return JSON.stringify(fArr);
};
