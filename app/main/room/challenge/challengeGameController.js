var GameController = require('../gameController');
var util = require('util');
var utils = require('../../../util/utils');
var Debug = require('../../../log/debug');
var Commands = require('../../../lib/constants/commands');
var FishTurn = require('../../entity/fishTurn');
var Consts = require('../../../consts/consts');
var ParamsKey = require('../../../lib/constants/paramsKey');
var ChallengePlayer = require('./challengePlayer');
var Player = require('../player');
var UserFlag = require('../../../lib/constants/userFlag');
var Bullet = require('../../entity/bullet');
var Common = require('../../../lib/common/common');
var FishDeadDecision = require('../decision/fishDeadDecision');
var channelUtil = require('../../../util/channelUtil');
var LevelTable = require('../../../lib/constants/levelTable');
var pomelo = require('pomelo');

var ChallengeGameController = function(opts) {
    ChallengeGameController.super_.call(this, opts);
    this.setGameState(STATE.WAITING);
    this.currentFishTurn = null;
    this.lastTimeUpdateRoomInterestDb = Date.now();
    this.lastTimeGenerateFish = Date.now();
    this.totalBetMoney = 0;
    this.matchId = '';
};

module.exports = ChallengeGameController;

util.inherits(ChallengeGameController, GameController);

var prot = ChallengeGameController.prototype;

var STATE = {
    WAITING : 0, //Ko co nguoi choi phong o trang thai waiting
    PLAYING : 1,
    FINISH_MATCH : 2,
    PREPARE_NEW_MATCH : 3
};

var TIME = {
    WAIT_FINISH_MATCH : 10000,
    WAIT_PREPARE_MATCH : 5000
};

var MIN_AMOUNT_FISH = 20;
var MAX_AMOUNT_FISH = 30;

// ====================================================
// OVERRIDE METHODS
// ====================================================

prot.doLoop = function() {
    try {
        this.processRequestQueue();
        if (this.getGameState() === STATE.WAITING) {
            this.doCheckPlayerTimeOut();
        } else if (this.getGameState() === STATE.PREPARE_NEW_MATCH) {
            this.loopWhenPrepareNewMatch();
        } else if (this.getGameState() === STATE.PLAYING) {
            this.doGenerateFishTurn();
            this.doPlantFish();
            this.doCheckEntityTimeOut();
            this.doFishSwim();
            this.doCheckPlayerTimeOut();
            if (Date.now() - this.timeChangedState >= Consts.TIME_PLAY_CHALLENGE) {
                this.doFinishMatch();
            }
        } else if (this.getGameState() === STATE.FINISH_MATCH) {
            this.loopWhenFinishMatch();
        }
    } catch (e) {
        Debug.error(this.room.getName(), e);
        console.log(e.stack);
    }
};

prot.processRequestQueue = function() {
    try {
        if (this.requestQueue.length > 0) {
            var request = this.requestQueue.shift();
            var requestId = request.command;
            var params = request.params;
            var user = request.user;

            if (requestId === Commands.JOIN_ROOM) {
                this.joinRoom(params, user);
            } else if (requestId === Commands.LEAVE_ROOM) {
                this.leaveRoom(params, user, GameController.LEAVE_ROOM_REASON.USER_SEND_LEAVE);
            } else if (requestId === Commands.DISCONNECT) {
                this.leaveRoom(params, user, GameController.LEAVE_ROOM_REASON.USER_DISCONNECT);
            } else if (requestId === Commands.STAND_UP) {
                this.standUp(params, user);
            } else if (requestId === Commands.TABLE_INFO) {
                this.tableInfo(params, user);
            } else if (requestId === Commands.ENTER_GAME) {
                this.enterGame(params, user);
            } else if (requestId === Commands.FIRE) {
                this.fire(params, user);
            } else if (requestId === Commands.FIRE_HIT) {
                this.fire_hit(params, user);
            } else if (requestId === Commands.BULLET_OUT_OF_GAME) {
                this.bulletOuOfGame(params, user);
            } else if (requestId === Commands.CHANGE_GUN) {
                this.changeGun(params, user);
            }
        }
    } catch (e) {
        var reqInfo = {};
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Command ' + requestId + ' got Exception on process';
        this.sendToUser(requestId, reqInfo, user);
        Debug.error(this.room.getName(), e);
        console.log(e.stack);
    }
};

// ========================================================
// PROCESS REQUEST
// ========================================================

prot.joinRoom = function(params, user) {
    var self = this;
    var session = user.getSession();
    var reqInfo = {};
    var userMoney = user.getProperty(UserFlag.MONEY);
    if (userMoney <= 0) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Bạn không đủ tiền vào chơi !';
        self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
        return;
    }
    Debug.game(user.getName(), 'Challenge JoinRoom ' + this.room.getName());
    if (this.countPlayerPlaying() >= this.roomSetting.getMaxPlayer()) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Bàn chơi đã đầy !';
        self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
        return;
    }
    if (userMoney < this.roomSetting.getTableFee()) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Bạn không đủ tiền vào game !';
        self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
        return;
    }
    if (!self.room.containsUser(user.getName())) {
        var player = new ChallengePlayer(user);
        var addToSpectatorResult = this.addToSpectators(player);
        if (addToSpectatorResult !== false) {
            player.setState(Player.STATE_VIEWING);
            player.setSpectatorId(Number(addToSpectatorResult));
            self.roomSetting.updateNumberUser(this.roomSetting.getNumberUser() + 1);
            self.room.addUser(user);

            user.setRoom(this.room);
            user.setProperty(UserFlag.GAME_ID, Consts.GAME_TYPE.CHALLENGE);
            user.setProperty(UserFlag.ROOM_ID, this.roomSetting.getName());
            user.setProperty(UserFlag.LOCATION, Consts.GAME_LOCATION.CL_PLAY);

            this.pushSessionWhenJoinRoom(user);

            self.database.getUserStatistic(user.getName(), function(err, res) {
                if (res) {
                    player.setUsLevel(res.level);
                    player.setUsChallengeWin(res.challenge_win);
                    player.setUsChallengeLost(res.challenge_lost);
                    player.setUsChallengeMoneyWin(res.challenge_money_win);
                    player.setUsChallengeMoneyLost(res.challenge_money_lost);
                }
            });

            reqInfo[ParamsKey.SUCCESS] = true;
            reqInfo[ParamsKey.MESSAGE] = 'Join room success';
            self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
        } else {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Error when add to spectators';
            self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
        }
    } else {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User already exist in room';
        self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
    }
};

prot.leaveRoom = function(params, user, leaveReason) {
    var self = this;
    var reqInfo = {};
    var inlistPlayer = true;
    var player = this.findPlayer(user.getName());
    if (!player) {
        player = this.findSpectator(user.getName());
        inlistPlayer = false;
    }
    Debug.game(user.getName(), 'Challenge LeaveRoom ' + this.room.getName());
    if (player && this.room.containsUser(user.getName())) {
        this.database.updateUserStatisticChallenge(player.getName(), player.getUsLevel(), player.getUsChallengeWin(),
            player.getUsChallengeLost(), player.getUsChallengeMoneyWin(), player.getUsChallengeMoneyLost());
        this.roomSetting.updateNumberUser(this.roomSetting.getNumberUser() - 1);

        user.setRoom(null);
        this.room.removeUser(user);
        user.setProperty(UserFlag.GAME_ID, -1);
        user.setProperty(UserFlag.ROOM_ID, Consts.LOBBY);
        user.setProperty(UserFlag.LOCATION, Consts.GAME_LOCATION.LOBBY);

        if (inlistPlayer) {
            //User ma thuoc list players thi moi gui, thuoc spectator ko gui
            var toOtherUser = {};
            toOtherUser[ParamsKey.SEAT] = player.getSeat();
            toOtherUser[ParamsKey.NAME] = player.getName();
            this.sendToListIgnoreOne(Commands.PLAYER_LEAVE, toOtherUser, this.players, player);
            this.sendToListIgnoreOne(Commands.PLAYER_LEAVE, toOtherUser, this.spectators, player);
        }

        if (user) {
            this.resetSessionWhenLeaveRoom(user);
        }

        this.removeFromPlayers(user.getName());
        this.removeFromSpectators(user.getName());

        this.roomSetting.updateNumberPlayer(this.countPlayerPlaying());

        var leave_room_msg = 'Leave room success';
        if (leaveReason === GameController.LEAVE_ROOM_REASON.KICK_BY_ADMIN) {
            leave_room_msg = 'Bạn bị kick bởi admin';
        } else if (leaveReason === GameController.LEAVE_ROOM_REASON.NOT_ENOUGH_MONEY) {
            leave_room_msg = 'Bạn không có đủ tiền chơi';
        } else if (leaveReason === GameController.LEAVE_ROOM_REASON.REQUEST_TIME_OUT) {
            leave_room_msg = 'Bạn bị kick khỏi bàn do quá lâu không thao tác';
        }
        if (leaveReason !== GameController.LEAVE_ROOM_REASON.USER_DISCONNECT) {
            reqInfo[ParamsKey.SUCCESS] = true;
            reqInfo[ParamsKey.REASON] = leaveReason;
            reqInfo[ParamsKey.MESSAGE] = leave_room_msg;
            this.sendToUser(Commands.LEAVE_ROOM, reqInfo, user);
        }

        if (this.roomSetting.getNumberPlayer() === 0) {
            //Reset Room when empty
            this.setGameState(STATE.WAITING);
            this.currentFishTurn = null;
            this.fishQueue.splice(0, this.fishQueue.length);
        } else if (this.roomSetting.getNumberPlayer() === 1) {
            if (this.getGameState() === STATE.PLAYING) {
                //Finish Match when only 1 player playing
                self.doFinishMatch();
            } else if (this.getGameState() === STATE.PREPARE_NEW_MATCH) {
                this.setGameState(STATE.WAITING);
            }
        }
    } else {
        if (user) {
            this.resetSessionWhenLeaveRoom(user);
        }
        if (leaveReason !== GameController.LEAVE_ROOM_REASON.USER_DISCONNECT) {
            reqInfo[ParamsKey.SUCCESS] = true;
            reqInfo[ParamsKey.MESSAGE] = 'User not exist in room';
            this.sendToUser(Commands.LEAVE_ROOM, reqInfo, user);
        }
        this.removeFromPlayers(user.getName());
        this.removeFromSpectators(user.getName());
    }
};

prot.standUp = function(params, user) {
    var self = this;
    var reqInfo = {};
    var player = this.findPlayer(user.getName());
    if (player) {
        //Anounce other user player stand up
        var toOtherUser = {};
        toOtherUser[ParamsKey.SEAT] = player.getSeat();
        toOtherUser[ParamsKey.NAME] = player.getName();
        this.sendToListIgnoreOne(Commands.PLAYER_LEAVE, toOtherUser, this.players, player);
        this.sendToListIgnoreOne(Commands.PLAYER_LEAVE, toOtherUser, this.spectators, player);
        //
        player.setState(Player.STATE_VIEWING);
        player.setSeat(-1);
        this.removeFromPlayers(user.getName());
        this.addToSpectators(player);
        this.roomSetting.updateNumberPlayer(this.roomSetting.getNumberPlayer() - 1);

        if (this.roomSetting.getNumberPlayer() === 0) {
            //Reset Room when empty
            this.setGameState(STATE.WAITING);
            this.currentFishTurn = null;
            this.fishQueue.splice(0, this.fishQueue.length);
        } else {
            if (this.countPlayerStatePlaying() === 1) {
                if (this.getGameState() === STATE.PLAYING) {
                    //Finish Match when only 1 player playing
                    self.doFinishMatch();
                } else if (this.getGameState() === STATE.PREPARE_NEW_MATCH) {
                    this.setGameState(STATE.WAITING);
                }
            }
        }
        //Send to user
        reqInfo[ParamsKey.SUCCESS] = true;
        reqInfo[ParamsKey.MESSAGE] = 'Stand up success';
        this.sendToUser(Commands.STAND_UP, reqInfo, user);

    } else {
        //reqInfo[ParamsKey.SUCCESS] = false;
        //reqInfo[ParamsKey.MESSAGE] = 'User not in list players';
        //this.sendToUser(Commands.STAND_UP, reqInfo, user);
        self.leaveRoom(null, user, GameController.LEAVE_ROOM_REASON.USER_SEND_LEAVE);
    }
};

prot.enterGame = function(params, user) {
    var seatUserChoose = params[ParamsKey.SEAT];
    var player = this.findSpectator(user.getName());
    var reqInfo = {};
    if (player) {
        if (player.getMoney() >= this.roomSetting.getTableFee()) {
            var emptySeat = -1;
            if (!seatUserChoose) {
                for (var i = 0; i < this.players.length; i++) {
                    if (!this.players[i]) {
                        emptySeat = i;
                        break;
                    }
                }
            } else {
                if (seatUserChoose >= 0 && seatUserChoose <= this.roomSetting.getMaxPlayer() - 1) {
                    if (!this.players[seatUserChoose]) {
                        emptySeat = seatUserChoose;
                    }
                }
            }
            if (emptySeat >= 0) {
                var betMoney = this.roomSetting.getTableFee();
                this.players[emptySeat] = player;
                player.setSeat(emptySeat);
                this.removeFromSpectators(user.getName());
                this.roomSetting.updateNumberPlayer(this.roomSetting.getNumberPlayer() + 1);

                if (this.getGameState() === STATE.WAITING) {
                    //Chuyen trang thai game thanh PREPARE_NEW_MATCH
                    player.setState(Player.STATE_WAITING_PLAY);
                    if (this.roomSetting.getNumberPlayer() >= 2) {
                        this.setGameState(STATE.PREPARE_NEW_MATCH);
                        var nReqInfo = {};
                        nReqInfo[ParamsKey.TIME] = TIME.WAIT_PREPARE_MATCH;
                        this.sendToList(Commands.PREPARE_NEW_MATCH, nReqInfo, this.players);
                        this.sendToList(Commands.PREPARE_NEW_MATCH, nReqInfo, this.spectators);
                    }
                } else if (this.getGameState() === STATE.PLAYING) {
                    player.setState(Player.STATE_VIEWING);
                } else if (this.getGameState() === STATE.PREPARE_NEW_MATCH) {
                    player.setState(Player.STATE_WAITING_PLAY);
                } else if (this.getGameState() === STATE.FINISH_MATCH) {
                    player.setState(Player.STATE_WAITING_PLAY);
                }
                //Send to Player goi tin ENTER_GAME
                reqInfo[ParamsKey.SEAT] = emptySeat;
                reqInfo[ParamsKey.GUN_ID] = player.getCurrentGun();
                reqInfo[ParamsKey.BET_MONEY] = betMoney;
                reqInfo[ParamsKey.CL_MONEY] = 0;
                reqInfo[ParamsKey.CL_AMOUNT_BULLET] = this.roomSetting.getInitBullet();
                reqInfo[ParamsKey.PLAYER_STATE] = player.getState();
                this.sendToUser(Commands.ENTER_GAME, reqInfo, user);
                //Send to other Players
                reqInfo = {};
                reqInfo[ParamsKey.SEAT] = emptySeat;
                reqInfo[ParamsKey.PLAYER] = player.toObj();
                this.sendToListIgnoreOne(Commands.NEW_PLAYER_ENTER, reqInfo, this.players, player);
                this.sendToListIgnoreOne(Commands.NEW_PLAYER_ENTER, reqInfo, this.spectators, player);
            } else {
                reqInfo[ParamsKey.SUCCESS] = false;
                reqInfo[ParamsKey.MESSAGE] = 'Chỗ đã có người ngồi hoặc máy hết chỗ';
                this.sendToUser(Commands.ENTER_GAME, reqInfo, user);
            }
        } else {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Bạn không đủ tiền vào game';
            this.sendToUser(Commands.ENTER_GAME, reqInfo, user);
        }
    } else {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User not exist on list spectators';
        this.sendToUser(Commands.ENTER_GAME, reqInfo, user);
    }
};

prot.tableInfo = function(params, user) {
    //Gui danh sach nguoi choi
    var self = this;
    var reqInfo = {};
    var playersInfo = [];
    var fishInfo = [];
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i]) {
            var obj_player = this.players[i].toObj();
            playersInfo.push(obj_player);
        }
    }
    reqInfo[ParamsKey.PLAYERS] = playersInfo;
    //Gui danh sach ca (Co vi tri la id cua quy dao va index point cua quy dao)
    for (var i = 0; i < this.fishQueue.length; i++) {
        if (this.fishQueue[i]) {
            var obj_fish = this.fishQueue[i].toObj();
            fishInfo.push(obj_fish);
        }
    }
    reqInfo[ParamsKey.FISH_LIST] = fishInfo;
    reqInfo[ParamsKey.TIMESTAMP] = Date.now();
    reqInfo[ParamsKey.TABLE_FEE] = this.roomSetting.getTableFee();
    reqInfo[ParamsKey.ROOM_STATE] = this.getGameState();
    if (this.getGameState() === STATE.PLAYING) {
        reqInfo[ParamsKey.TIME] = Consts.TIME_PLAY_CHALLENGE - (Date.now() - this.timeChangedState);
    }
    //Gui
    this.sendToUser(Commands.TABLE_INFO, reqInfo, user);
};

prot.changeGun = function(params, user) {
    var self = this;
    var reqInfo = {};
    var changeId = params[ParamsKey.GUN_ID];
    if (changeId >= 1 && changeId <= 6) {
        var player = this.findPlayer(user.getName());
        if (player) {
            player.setCurrentGun(changeId);
            reqInfo[ParamsKey.SUCCESS] = true;
            reqInfo[ParamsKey.GUN_ID] = changeId;
            reqInfo[ParamsKey.NAME] = player.getName();
            reqInfo[ParamsKey.SEAT] = player.getSeat();
            this.sendToList(Commands.CHANGE_GUN, reqInfo, this.players);
            this.sendToList(Commands.CHANGE_GUN, reqInfo, this.spectators);
        } else {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'User not in list player';
            this.sendToUser(Commands.CHANGE_GUN, reqInfo, user);
        }
    } else {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Gun Id not valid';
        this.sendToUser(Commands.CHANGE_GUN, reqInfo, user);
    }
};

prot.fire = function(params, user) {
    var self = this;
    var vx = params[ParamsKey.VX];
    var vy = params[ParamsKey.VY];
    var reqInfo = {};
    var player = this.findPlayer(user.getName());
    if (player) {
        if (player.getState() !== Player.STATE_PLAYING) {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Vui lòng đợi ván mới diễn ra';
            this.sendToPlayer(Commands.FIRE, reqInfo, player);
            return;
        }
        var bulletCoin = Consts.GUN.TYPE[player.getCurrentGun()].coin;
        if (player.getInitBullet() >= bulletCoin) {

            player.addInitBullet(-bulletCoin);
            //
            //var bulletId = user.getName() + '-' + Date.now() + '-' + bulletCoin;
            var bulletId = user.getSession().id + '-' + this.bulletsQueue.length;
            var opts = {uid: bulletId, speed: {vx: vx, vy: vy}, coin: bulletCoin, owner: user.getName()};
            var bullet = new Bullet(opts);
            this.addBullet(bullet);
            reqInfo[ParamsKey.BULLET_ID] = bulletId;
            reqInfo[ParamsKey.SEAT] = player.getSeat();
            reqInfo[ParamsKey.MONEY] = player.getMoney();
            reqInfo[ParamsKey.CL_MONEY] = player.getChallengeMoney();
            reqInfo[ParamsKey.CL_AMOUNT_BULLET] = player.getInitBullet();
            reqInfo[ParamsKey.SPEED] = {vx: vx, vy: vy};
            reqInfo[ParamsKey.COIN] = bulletCoin;
            reqInfo[ParamsKey.PLAYER] = user.getName();
            reqInfo[ParamsKey.GUN_ID] = player.getCurrentGun();

            this.sendToPlayer(Commands.FIRE, reqInfo, player);
            this.sendToListIgnoreOne(Commands.PLAYER_FIRE, reqInfo, this.players, player);
            this.sendToList(Commands.PLAYER_FIRE, reqInfo, this.spectators);
        } else {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Số tiền còn lại không đủ để sử dung loại súng này';
            this.sendToPlayer(Commands.FIRE, reqInfo, player);
        }
    } else {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User not in list player';
        this.sendToUser(Commands.FIRE, reqInfo, user);
    }
};

prot.fire_hit = function(params, user) {
    var self = this;
    var reqInfo = {};
    var bulletId = params[ParamsKey.BULLET_ID];
    var fishId = params[ParamsKey.FISH_ID];
    var clientSign = params[ParamsKey.SIGN];
    var serverSign = Common.MD5(bulletId + fishId + user.getProperty(UserFlag.SECRET_KEY));
    var player = this.findPlayer(user.getName());
    if (!player) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User not in list player';
        this.sendToUser(Commands.FIRE_HIT, reqInfo, user);
        return;
    }
    if (serverSign !== clientSign) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Server sign and client sign not match';
        this.sendToUser(Commands.FIRE_HIT, reqInfo, user);
        return;
    }
    var bullet = this.findBullet(bulletId);
    var fish = this.findFish(fishId);
    if (!bullet || !fish) {
        reqInfo[ParamsKey.SUCCESS] = false;
        if (!bullet) {
            reqInfo[ParamsKey.MESSAGE] = 'Bullet id not exist on game';
        }
        if (!fish) {
            reqInfo[ParamsKey.MESSAGE] = 'Fish id not exist on game';
        }
        this.sendToUser(Commands.FIRE_HIT, reqInfo, user);
        return;
    }
    if(bullet.owner !== user.getName()) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Bullet owner ' + bullet.owner + ' invalid';
        this.sendToUser(Commands.FIRE_HIT, reqInfo, user);
        return;
    }
    fish.addHp(-bullet.coin);

    var fishDeadDecision = new FishDeadDecision();
    var extrasInfo = {};
    extrasInfo.use_machine_win_lost_rule = false;
    extrasInfo.game_type = Consts.GAME_TYPE.CHALLENGE;

    var validateResult = fishDeadDecision.validateFishDead(fish, bullet, player, extrasInfo);
    if (validateResult.dead) {
        //Xoa ca va dan khoi queue
        this.removeFish(fishId);
        //Update tien
        var fishMoney = validateResult.money;

        player.addChallengeMoney(fishMoney);
        player.setUsFishDead(player.getUsFishDead() + 1);
        //var newLevel = LevelTable.findLevel(player.getUsFishDead());
        //if (newLevel > 0 && newLevel !== player.getUsLevel()) {
        //    var reqInfoLevel = {};
        //    reqInfoLevel[ParamsKey.LEVEL] = newLevel;
        //    reqInfoLevel[ParamsKey.NAME] = player.getName();
        //    reqInfoLevel[ParamsKey.SEAT] = player.getSeat();
        //    this.sendToList(Commands.LEVEL_UP, reqInfoLevel, this.players);
        //    player.setUsLevel(newLevel);
        //}
        //
        reqInfo[ParamsKey.FISD_DEAD] = true;
        reqInfo[ParamsKey.FISH_ID] = fishId;
        reqInfo[ParamsKey.BULLET_ID] = bulletId;
        reqInfo[ParamsKey.DELTA_MONEY] = fishMoney;
        reqInfo[ParamsKey.MONEY] = player.getMoney();
        reqInfo[ParamsKey.CL_MONEY] = player.getChallengeMoney();
        reqInfo[ParamsKey.CL_AMOUNT_BULLET] = player.getInitBullet();
        reqInfo[ParamsKey.NAME] = player.getName();
        reqInfo[ParamsKey.SEAT] = player.getSeat();

        //
        this.sendToList(Commands.FISH_DEAD, reqInfo, this.players);
        this.sendToList(Commands.FISH_DEAD, reqInfo, this.spectators);

        //
        this.plantFishWhenOtherFishDied();
    }
    this.removeBullet(bulletId);
};

prot.bulletOuOfGame = function(params, user) {
    var bulletId = params[ParamsKey.BULLET_ID];
    this.removeBullet(bulletId);
};

// ===============================================================
// UPDATE GAME LOGIC
// ===============================================================

prot.loopWhenWaiting = function() {

};

prot.loopWhenPrepareNewMatch = function() {
    if (Date.now() - this.timeChangedState > TIME.WAIT_PREPARE_MATCH) {
        if (this.countPlayerPlaying() >= 2) {
            this.doAllPlayerBetMoney();
            this.doStartGame();
        } else {
            this.setGameState(STATE.WAITING);
        }
    }
};

prot.loopWhenFinishMatch = function() {
    if (Date.now() - this.timeChangedState > TIME.WAIT_FINISH_MATCH) {
        //
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            if (player) {
                player.setState(Player.STATE_WAITING_PLAY);
            }
        }
        //
        this.doKickUserNotEnoughMoney();
        //
        if (this.countPlayerPlaying() >= 2) {
            this.setGameState(STATE.PREPARE_NEW_MATCH);
            var reqInfo = {};
            reqInfo[ParamsKey.TIME] = TIME.WAIT_PREPARE_MATCH;
            this.sendToList(Commands.PREPARE_NEW_MATCH, reqInfo, this.players);
            this.sendToList(Commands.PREPARE_NEW_MATCH, reqInfo, this.spectators);
        } else {
            this.setGameState(STATE.WAITING);
        }
    }
};

prot.doFinishMatch = function() {
    var totalServerFee = 0;
    this.setGameState(STATE.FINISH_MATCH);
    //Reset Room when empty
    this.currentFishTurn = null;
    this.fishQueue.splice(0, this.fishQueue.length);
    var reqInfo = {};
    var reqInfoRanks = [];
    var reqInfoWin = [];
    var reqInfoPlayers = [];
    //Sap xep thu tu player theo challenge_money
    var playersSorted = [];
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player && player.getState() === Player.STATE_PLAYING) {
            playersSorted.push(player);
        }
    }
    if (playersSorted.length >= 1) {
        var flag = true;   // set flag to true to begin first pass
        var temp;   //holding variable
        while (flag) {
            flag= false;    //set flag to false awaiting a possible swap
            for(var j=0; j < playersSorted.length -1; j++ ) {
                if (playersSorted[j].getChallengeMoney() < playersSorted[j+1].getChallengeMoney()) {
                    temp = playersSorted[ j ];                //swap elements
                    playersSorted[ j ] = playersSorted[ j+1 ];
                    playersSorted[ j+1 ] = temp;
                    flag = true;              //shows a swap occurred
                }
            }
        }
    } else {
        return;
    }
    //Tinh tien cho user thang
    var countPlayerWin = 0;
    var challengeMoneyMax = playersSorted[0].getChallengeMoney();
    var playersWon = [];
    for (var i = 0; i < playersSorted.length; i++) {
        if (playersSorted[i].getChallengeMoney() === challengeMoneyMax) {
            countPlayerWin++;
            playersWon.push(playersSorted[i]);
        } else {
            playersSorted[i].setUsChallengeLost(playersSorted[i].getUsChallengeLost() + 1);
        }
        var obj = {};
        obj[ParamsKey.NAME] = playersSorted[i].getName();
        obj[ParamsKey.SEAT] = playersSorted[i].getSeat();
        obj[ParamsKey.INDEX] = i + 1;
        obj[ParamsKey.CL_MONEY] = playersSorted[i].getChallengeMoney();
        reqInfoRanks.push(obj);
    }
    var moneyWin = Math.floor(this.totalBetMoney / countPlayerWin);
    //Log tien phe, log tien user money trace
    for (var i = 0; i < playersWon.length; i++) {
        var player = playersWon[i];
        var serverFee = this.calculateServerFee(moneyWin);
        totalServerFee += serverFee;
        var moneyPlayerChange = moneyWin - serverFee;
        player.addMoney(moneyPlayerChange, 'challenge win');
        this.addUserMoneyToDb(player, moneyPlayerChange, 'money challenge win', serverFee);
        if (!player.isBot()) {
            this.database.insertChallengeFeeLog(this.gameId, player.getName(), serverFee, player.getPartner());
        } else {
            this.database.insertChallengeFeeBotLog(this.gameId, player.getName(), serverFee, player.getPartner());
        }
        player.setUsChallengeWin(player.getUsChallengeWin() + 1);
        player.setUsChallengeMoneyWin(player.getUsChallengeMoneyWin() + moneyPlayerChange);
        var obj = {};
        obj[ParamsKey.NAME] = player.getName();
        obj[ParamsKey.SEAT] = player.getSeat();
        obj[ParamsKey.MONEY_CHANGE] = moneyPlayerChange;
        obj[ParamsKey.MONEY] = player.getMoney();
        reqInfoWin.push(obj);
    }
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player) {
            var obj = {};
            obj[ParamsKey.NAME] = player.getName();
            obj[ParamsKey.SEAT] = player.getSeat();
            obj[ParamsKey.MONEY] = player.getMoney();
            reqInfoPlayers.push(obj);
        }
    }
    //Gui du lieu ve client
    reqInfo[ParamsKey.RANK] = reqInfoRanks;
    reqInfo[ParamsKey.DELTA_MONEY] = reqInfoWin;
    reqInfo[ParamsKey.PLAYERS] = reqInfoPlayers;
    reqInfo[ParamsKey.TIME] = TIME.WAIT_FINISH_MATCH;

    this.sendToList(Commands.CL_FINISH_MATCH, reqInfo, this.players);
    this.sendToList(Commands.CL_FINISH_MATCH, reqInfo, this.spectators);
    //Update
    this.database.updateMatchId(this.matchId, totalServerFee, Common.fomatDate(new Date(Date.now())));
    //Chuyen trang thai user sang trang thai WAITING_FINISH_MATCH
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player && player.getState() === Player.STATE_PLAYING) {
            player.setState(Player.STATE_WAITING_FINISH_MATCH);
        }
    }
    this.totalBetMoney = 0;
};

prot.doStartGame = function() {
    if (this.countPlayerPlaying() < 2) {
        this.setGameState(STATE.WAITING);
        return;
    }
    var reqInfo = {};
    reqInfo[ParamsKey.TIME] = Consts.TIME_PLAY_CHALLENGE;
    this.sendToList(Commands.START, reqInfo, this.players);
    this.sendToList(Commands.START, reqInfo, this.spectators);
    //Chuyen het state user sang trang thai PLAYING
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player) {
            player.setState(Player.STATE_PLAYING);
            player.lastTimeSendRequest = Date.now();
        }
    }
    this.matchId = this.roomSetting.getName() + '_' + Date.now();
    this.insertMatchId();
    this.setGameState(STATE.PLAYING);
};

prot.doKickUserNotEnoughMoney = function() {
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player && player.getMoney() < this.roomSetting.getTableFee()) {
            this.leaveRoom(null, player.getUser(), GameController.LEAVE_ROOM_REASON.NOT_ENOUGH_MONEY);
        }
        //if (this.getGameState() === STATE.PLAYING) {
        //    if (player && player.isTimeOutRequest() && player.getState() === Player.STATE_PLAYING) {
        //        this.leaveRoom(null, player.getUser(), GameController.LEAVE_ROOM_REASON.REQUEST_TIME_OUT);
        //    }
        //}
    }
};

prot.plantFishWhenOtherFishDied = function() {
    var listFishPlant = [];
    var fish = this.currentFishTurn.plantFish();
    this.addFish(fish);
    listFishPlant.push(fish);
    if (listFishPlant.length > 0) {
        var reqInfo = {};
        var list_fish_obj = [];
        for (var i = 0; i < listFishPlant.length; i++) {
            if (listFishPlant[i]) {
                list_fish_obj.push(listFishPlant[i].toObj());
            }
        }
        reqInfo[ParamsKey.FISH_LIST] = list_fish_obj;
        reqInfo['current_fish_queue_size'] = this.fishQueue.length;
        this.sendToList(Commands.NEW_FISH_ENTER, reqInfo, this.players);
        this.sendToList(Commands.NEW_FISH_ENTER, reqInfo, this.spectators);
    }
};

// Sinh turn ca. Kiem tra xem neu cac turn da het thi phai sinh turn moi
prot.doGenerateFishTurn = function() {
    if (!this.currentFishTurn || this.currentFishTurn.isOutOfFish()) {
        var maxFish = utils.randomBetween(2, 5) * 100;
        var opts = {type : Consts.FISH_TURN.TYPE.NORMAL, maxFish : maxFish};
        this.currentFishTurn = new FishTurn(opts);
        this.currentFishTurn.generateFish({game_id : Consts.GAME_TYPE.CHALLENGE});
    }
};

// Kiem tra tinh trang ca hien gio trong game de tha them ca ra
prot.doPlantFish = function() {
    var listFishPlant = [];
    if (this.fishQueue.length === 0) {
        //Tha 1 loat max ca
        while (this.fishQueue.length < MIN_AMOUNT_FISH) {
            if (this.currentFishTurn.isOutOfFish()) {
                break;
            } else {
                var fish = this.currentFishTurn.plantFish();
                this.addFish(fish);
                listFishPlant.push(fish);
            }
        }
    } else if (this.fishQueue.length < MIN_AMOUNT_FISH) {
        while (this.fishQueue.length < MIN_AMOUNT_FISH) {
            if (this.currentFishTurn.isOutOfFish()) {
                break;
            } else {
                var fish = this.currentFishTurn.plantFish();
                this.addFish(fish);
                listFishPlant.push(fish);
            }
        }
    } else if (this.fishQueue.length < MAX_AMOUNT_FISH) {
        if (Date.now() - this.lastTimeGenerateFish >= 1000) {
            var t = utils.random(2);
            if (t === 1) {
                var number = this.countPlayerPlaying();
                for (var i = 0; i < number; i++) {
                    var fish = this.currentFishTurn.plantFish();
                    this.addFish(fish);
                    listFishPlant.push(fish);
                }
            }
            this.lastTimeGenerateFish = Date.now();
        }
    }
    if (listFishPlant.length > 0) {
        var reqInfo = {};
        var list_fish_obj = [];
        for (var i = 0; i < listFishPlant.length; i++) {
            if (listFishPlant[i]) {
                list_fish_obj.push(listFishPlant[i].toObj());
            }
        }
        reqInfo[ParamsKey.FISH_LIST] = list_fish_obj;
        reqInfo['current_fish_queue_size'] = this.fishQueue.length;
        this.sendToList(Commands.NEW_FISH_ENTER, reqInfo, this.players);
        this.sendToList(Commands.NEW_FISH_ENTER, reqInfo, this.spectators);
    }
};

//Kiem tra nguoi choi nao lau qua ko thao tac gi
prot.doCheckPlayerTimeOut = function() {
    var userManagerService = pomelo.app.get('userManagerService');
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player) {
            if (player.isTimeOutRequest()) {
                this.leaveRoom(null, player.getUser(), GameController.LEAVE_ROOM_REASON.REQUEST_TIME_OUT);
                this.players[i] = null;
            } else if (!userManagerService.getUserByName(player.getName())) {
                this.leaveRoom(null, player.getUser(), GameController.LEAVE_ROOM_REASON.USER_DISCONNECT);
                this.players[i] = null;
            } else if (!this.room.containsUser(player.getName())) {
                this.leaveRoom(null, player.getUser(), GameController.LEAVE_ROOM_REASON.USER_DISCONNECT);
                this.players[i] = null;
            } else if (!player.getUser()) {
                this.leaveRoom(null, player.getUser(), GameController.LEAVE_ROOM_REASON.USER_DISCONNECT);
                this.players[i] = null;
            }
        }
    }
    for (var i = 0; i < this.spectators.length; i++) {
        var player = this.spectators[i];
        if (player && player.isTimeOutRequest()) {
            this.leaveRoom(null, player.getUser(), GameController.LEAVE_ROOM_REASON.REQUEST_TIME_OUT);
        }
    }
};

// Kiem tra ca hoac dan bi timeout
prot.doCheckEntityTimeOut = function() {
    for (var i = this.fishQueue.length - 1; i > 0; i--) {
        var fish = this.fishQueue[i];
        if (!fish || fish.isTimeOut() || fish.isEndOrbit()) {
            this.fishQueue.splice(i, 1);
        }
    }
    for (var i = this.bulletsQueue.length - 1; i > 0; i--) {
        var bullet = this.bulletsQueue[i];
        if (!bullet || bullet.isTimeOut()) {
            this.bulletsQueue.splice(i, 1);
        }
    }
};

// Vong lap cho ca boi
prot.doFishSwim = function() {
    for (var i = 0; i < this.fishQueue.length; i++) {
        var fish = this.fishQueue[i];
        if (fish) {
            fish.move();
        }
    }
};

prot.doAllPlayerBetMoney = function() {
    var betMoney = this.roomSetting.getTableFee();
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player) {
            player.addMoney(-betMoney, 'challenge bet money');
            this.addUserMoneyToDb(player, -betMoney, 'challenge bet resetgame', 0);
            player.setUsChallengeMoneyLost(player.getUsChallengeMoneyLost() + betMoney);
            player.setChallengeMoney(0);
            player.setInitBullet(this.roomSetting.getInitBullet());
            this.totalBetMoney += betMoney;
            //
            var reqInfo = {};
            reqInfo[ParamsKey.NAME] = player.getName();
            reqInfo[ParamsKey.SEAT] = player.getSeat();
            reqInfo[ParamsKey.BET_MONEY] = betMoney;
            this.sendToPlayer(Commands.CL_BET, reqInfo, player);
        }
    }
};

prot.doKickUser = function(username) {
    var player = this.findPlayer(username);
    if (!player) {
        player = this.findSpectator(username);
    }
    if (player) {
        this.leaveRoom(null, player.getUser(), GameController.LEAVE_ROOM_REASON.KICK_BY_ADMIN);
    }
};

prot.reset = function() {
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i]) {
            this.leaveRoom(null, this.players[i].getUser(), GameController.LEAVE_ROOM_REASON.KICK_BY_ADMIN);
        }
    }
    for (var i = 0; i < this.spectators.length; i++) {
        if (this.spectators[i]) {
            this.leaveRoom(null, this.spectators[i].getUser(), GameController.LEAVE_ROOM_REASON.KICK_BY_ADMIN);
        }
    }
    this.setGameState(STATE.WAITING);
    this.currentFishTurn = null;
    this.lastTimeUpdateRoomInterestDb = Date.now();
    this.lastTimeGenerateFish = Date.now();
    this.totalBetMoney = 0;
    this.matchId = '';
    this.spectators = []; //Queue Cac player dung xem
    this.fishQueue = []; //Danh sach cac ca trong ban choi
    this.bulletsQueue = []; //Danh sach dan dang bay trong ban choi
    this.requestQueue = []; //H?ng request data c?a user g?i lên
    this.logGameBuilder = [];
    this.hostId = 0;
    this.timeChangedState = 0;
    this.currentMachineWin = 0;
    this.currentMachineLost = 0;
    //
    this.players = []; //Cac player choi trong ban choi
    for (var i = 0; i < this.roomSetting.getMaxPlayer(); i++) {
        this.players[i] = null;
    }
};

// ===============================================================
// SUPPORT METHODS
// ===============================================================

prot.addUserMoneyToDb = function(player, change, reason, server_fee) {
    var self = this;
    if (!server_fee) {
        server_fee = 0;
    }
    self.traceUserMoney(player.getName(), player.getTitle(), player.getMoney() - change, player.getMoney(),
        change, player.getPartner(), server_fee);
    this.database.addUserMoney(player.getName(), change, reason);
    player.setCurrentMoneyChange(0);
};

prot.updateUserMoneyToDb = function(player, newMoney, reason) {
    this.database.updateUserMoney(player.getName(), newMoney, reason);
    player.setCurrentMoneyChange(0);
};

prot.traceUserMoney = function(user_name, user_title, money_before, money_after, money_change, partner, server_fee) {
    this.database.insertUserMoneyTrace(user_name, user_title, Consts.GAME_TYPE.CHALLENGE, this.room.getName(),
        this.playersToString(), this.roomSetting.getTableFee(), money_before, money_after, money_change, server_fee, partner, this.matchId);
};

prot.calculateServerFee = function(moneyWin) {
    if (moneyWin <= 0) {
        return 0;
    }
    var fee = Math.ceil(Consts.SERVER_FEE_PERCENT * moneyWin / 100);
    return fee;
};

prot.insertMatchId = function() {
    this.database.insertMatchId(this.matchId, Consts.GAME_TYPE.CHALLENGE, 0, this.playersToString(), this.roomSetting.getTableFee(),
        Common.fomatDate(new Date(Date.now())), this.roomSetting.getName());
};

prot.countPlayerStatePlaying = function() {
    var count = 0;
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player && player.getState() === Player.STATE_PLAYING) {
            count++;
        }
    }
    return count;
};