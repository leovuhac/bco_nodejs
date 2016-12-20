var GameController = require('../gameController');
var util = require('util');
var utils = require('../../../util/utils');
var Debug = require('../../../log/debug');
var Commands = require('../../../lib/constants/commands');
var FishTurn = require('../../entity/fishTurn');
var Consts = require('../../../consts/consts');
var ParamsKey = require('../../../lib/constants/paramsKey');
var FreeplayPlayer = require('./freeplayPlayer');
var Player = require('../player');
var UserFlag = require('../../../lib/constants/userFlag');
var Bullet = require('../../entity/bullet');
var Common = require('../../../lib/common/common');
var FishDeadDecision = require('../decision/fishDeadDecision');
var channelUtil = require('../../../util/channelUtil');
var LevelTable = require('../../../lib/constants/levelTable');
var ItemGenerator = require('../../entity/itemGenerator');
var ItemConfig = require('../../entity/itemConfig');
var Item = require('../../entity/item');
var pomelo = require('pomelo');

var FreeplayGameController = function(opts) {
    FreeplayGameController.super_.call(this, opts);
    this.setGameState(STATE.WAITING);
    this.currentFishTurn = null;
    this.lastTimeUpdateRoomInterestDb = Date.now();
    this.playerInfoMap = {};
    this.lastTimeGenerateFish = Date.now();
    this.roomInterestBefore = 0;
    this.itemsInUsed = [];
    this.timeItemState = Date.now();
    this.itemState = ITEM_STATE.NON_ITEM;
    this.timeItemStateEffect = 0;
    this.countTurnNormalBeforeSpecial = 0;
    this.waitTimeLog = 0;
};

module.exports = FreeplayGameController;

util.inherits(FreeplayGameController, GameController);

var prot = FreeplayGameController.prototype;

var STATE = {
    WAITING : 0, //Ko co nguoi choi phong o trang thai waiting
    PLAYING : 1
};

var ITEM_STATE = {
    NON_ITEM : 0,
    FROZEN : 1,
};

// ====================================================
// OVERRIDE METHODS
// ====================================================

prot.doLoop = function() {
    try {
        this.processRequestQueue();
        if (this.getGameState() === STATE.WAITING) {
            this.doCheckPlayerTimeOut();
            this.doCheckItemTimeOut();
            this.doCheckEntityTimeOut();
        } else if (this.getGameState() === STATE.PLAYING) {
            this.doGenerateFishTurn();
            this.doPlantFish();
            this.doCheckEntityTimeOut();
            this.doFishSwim();

            this.doCheckPlayerTimeOut();
            this.doCheckItemTimeOut();
            this.doUpdateDatabase();
        }
    } catch (e) {
        Debug.error(this.roomSetting.getName(), e);
        console.log(e.stack);
    }
};

prot.processRequestQueue = function() {
    while (this.requestQueue.length > 0) {
        var request = this.requestQueue.shift();
        var requestId = request.command;
        var params = request.params;
        var user = request.user;
        try {
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
            } else if (requestId === Commands.USE_ITEM) {
                this.useItem(params, user);
            } else if (requestId === Commands.CHANGE_GUN) {
                this.changeGun(params, user);
            } else if (requestId === Commands.FIRE_HIT_ITEM) {
                this.fireHitItem(params, user);
            } else if (requestId === Commands.CONFIRM_ITEM_TIME_OUT) {
                this.confirmItemTimeOut(params, user);
            }
        } catch (e) {
            var reqInfo = {};
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Command ' + requestId + ' got Exception on process';
            this.sendToUser(requestId, reqInfo, user);
            Debug.error(this.roomSetting.getName(), e);
            console.log(e.stack);
        }
    }
};

// ========================================================
// PROCESS REQUEST
// ========================================================

prot.joinRoom = function(params, user) {
    var self = this;
    var session = user.getSession();
    var reqInfo = {};
    var userGold = user.getProperty(UserFlag.GOLD);
    Debug.game(user.getName(), 'FreePlay JoinRoom ' + this.room.getName());
    if (userGold <= 0) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Bạn không đủ gold vào chơi !';
        self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
        return;
    }
    if (this.countPlayerPlaying() >= this.roomSetting.getMaxPlayer()) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Bàn chơi đã đầy !';
        self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
        return;
    }
    //console.log("=== User join room : " + user.getName() + ", " + user.getProperty(UserFlag.TITLE));
    if (!self.room.containsUser(user.getName())) {
        var player = new FreeplayPlayer(user);
        var addToSpectatorResult = this.addToSpectators(player);
        if (addToSpectatorResult !== false) {
            player.setState(Player.STATE_VIEWING);
            player.setSpectatorId(Number(addToSpectatorResult));
            self.roomSetting.updateNumberUser(this.roomSetting.getNumberUser() + 1);
            self.room.addUser(user);

            user.setRoom(this.room);
            user.setProperty(UserFlag.GAME_ID, Consts.GAME_TYPE.FREE_PLAY);
            user.setProperty(UserFlag.ROOM_ID, this.roomSetting.getName());
            user.setProperty(UserFlag.LOCATION, Consts.GAME_LOCATION.FREE_PLAY);

            this.pushSessionWhenJoinRoom(user);

            self.database.getUserStatistic(user.getName(), function(err, res) {
                if (res) {
                    player.setUsLevel(res.level);
                }
            });

            reqInfo[ParamsKey.SUCCESS] = true;
            reqInfo[ParamsKey.MESSAGE] = 'Join room success';
            self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
            //console.log("=== User join room SUCCESS : " + user.getName() + ", " + user.getProperty(UserFlag.TITLE));
        } else {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Error when add to spectators';
            self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
        }
    } else {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User ' + user.getName() + ', title : ' + user.getProperty(UserFlag.TITLE) + ' already exist in room';
        self.sendToUser(Commands.JOIN_ROOM, reqInfo, user);
        //console.log("=== User join room ERROR : " + user.getName() + ", " + user.getProperty(UserFlag.TITLE));
    }
};

prot.leaveRoom = function(params, user, leaveReason) {
    var self = this;
    var reqInfo = {};
    var player = this.findPlayer(user.getName());
    if (!player) {
        player = this.findSpectator(user.getName());
    }
    Debug.game(user.getName(), 'FreePlay LeaveRoom ' + leaveReason + " " +  + this.room.getName());
    if (player && this.room.containsUser(user.getName())) {
        this.addUserGoldToDb(player, player.getCurrentGoldChange(), 'update gold when leave room');
        this.roomSetting.updateNumberUser(this.roomSetting.getNumberUser() - 1);

        player.clearItem();
        this.removeItemsInUsedOfPlayer(user.getName());

        user.setRoom(null);
        this.room.removeUser(user);
        user.setProperty(UserFlag.GAME_ID, -1);
        user.setProperty(UserFlag.ROOM_ID, Consts.LOBBY);
        user.setProperty(UserFlag.LOCATION, Consts.GAME_LOCATION.LOBBY);

        if (player.getState() === Player.STATE_PLAYING) {
            var toOtherUser = {};
            toOtherUser[ParamsKey.SEAT] = player.getSeat();
            toOtherUser[ParamsKey.NAME] = player.getName();
            this.sendToListIgnoreOne(Commands.PLAYER_LEAVE, toOtherUser, this.players, player);
            this.sendToListIgnoreOne(Commands.PLAYER_LEAVE, toOtherUser, this.spectators, player);
        }

        if (this.playerInfoMap.hasOwnProperty(player.getName())) {
            delete this.playerInfoMap[player.getName()];
        }

        if (user) {
            this.resetSessionWhenLeaveRoom(user);
        }

        this.removeFromPlayers(user.getName());
        this.removeFromSpectators(user.getName());

        this.roomSetting.updateNumberPlayer(this.countPlayerPlaying());
        if (this.roomSetting.getNumberPlayer() === 0) {
            //Reset Room when empty
            this.setGameState(STATE.WAITING);
            this.setItemState(ITEM_STATE.NON_ITEM);
            this.currentFishTurn = null;
            this.fishQueue.splice(0, this.fishQueue.length);
        }

        var leave_room_msg = 'Leave room success';
        if (leaveReason === GameController.LEAVE_ROOM_REASON.KICK_BY_ADMIN) {
            leave_room_msg = 'Bạn bị kick bởi admin';
        } else if (leaveReason === GameController.LEAVE_ROOM_REASON.NOT_ENOUGH_MONEY) {
            leave_room_msg = 'Bạn không còn đủ gold chơi';
        } else if (leaveReason === GameController.LEAVE_ROOM_REASON.REQUEST_TIME_OUT) {
            leave_room_msg = 'Bạn bị kick khỏi bàn do quá lâu không thao tác';
        } else if (leaveReason === GameController.LEAVE_ROOM_REASON.ROOM_OUT_OF_SEAT) {
            leave_room_msg = 'Vui lòng thử lại';
        }
        if (leaveReason !== GameController.LEAVE_ROOM_REASON.USER_DISCONNECT) {
            reqInfo[ParamsKey.SUCCESS] = true;
            reqInfo[ParamsKey.REASON] = leaveReason;
            reqInfo[ParamsKey.MESSAGE] = leave_room_msg;
            this.sendToUser(Commands.LEAVE_ROOM, reqInfo, user);
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
        player.clearItem();
        this.removeItemsInUsedOfPlayer(user.getName());
        this.removeFromPlayers(user.getName());
        this.addToSpectators(player);
        this.roomSetting.updateNumberPlayer(this.roomSetting.getNumberPlayer() - 1);
        if (this.roomSetting.getNumberPlayer() === 0) {
            this.setGameState(STATE.WAITING);
            this.setItemState(ITEM_STATE.NON_ITEM);
            this.currentFishTurn = null;
            this.fishQueue.splice(0, this.fishQueue.length);
        }
        if (this.playerInfoMap.hasOwnProperty(player.getName())) {
            delete this.playerInfoMap[player.getName()];
        }
        //Gui tong ket cua user ve
        var finishMatch = {};
        finishMatch[ParamsKey.GOLD] = player.getGold();
        finishMatch[ParamsKey.GOLD_CHANGE] = player.getGoldChange();
        finishMatch[ParamsKey.GOLD_FISH] = player.goldFish;
        finishMatch[ParamsKey.GOLD_BULLET] = player.goldBullet;
        this.sendToUser(Commands.FL_TOTAL_RESULT, finishMatch, user);
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

prot.tableInfo = function(params, user) {
    //Gui danh sach nguoi choi
    var self = this;
    var reqInfo = {};
    var playersInfo = [];
    var fishInfo = [];
    //User la khach ma lay tableInfo khi ban da full thi cho quit
    var playerSpec = this.findSpectator(user.getName());
    if (playerSpec && this.countPlayerPlaying() >= this.roomSetting.getMaxPlayer()) {
        self.leaveRoom({}, user, GameController.LEAVE_ROOM_REASON.ROOM_OUT_OF_SEAT);
        return;
    }
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
    //Gui danh sach dan (Co vi tri, goc ban)
    this.sendToUser(Commands.TABLE_INFO, reqInfo, user);
};

prot.enterGame = function(params, user) {
    var player = this.findSpectator(user.getName());
    var reqInfo = {};
    if (player) {
        if (player.getGold() > 0) {
            var emptySeat = -1;
            for (var i = 0; i < this.players.length; i++) {
                if (!this.players[i]) {
                    emptySeat = i;
                    break;
                }
            }
            if (emptySeat >= 0) {
                this.players[emptySeat] = player;
                player.setState(Player.STATE_PLAYING);
                player.setSeat(emptySeat);
                this.removeFromSpectators(user.getName());
                this.roomSetting.updateNumberPlayer(this.roomSetting.getNumberPlayer() + 1);
                if (!this.playerInfoMap.hasOwnProperty(player.getName())) {
                    this.playerInfoMap[player.getName()] = {
                        playerTitle : player.getTitle(),
                        playerPartner : player.getPartner(),
                        roomInterest : 0,
                        playerMoneyStart : player.getGold(),
                        playerMoneyEnd : player.getGold(),
                        playerMoneyChange : 0,
                        timeStartUpdated : Date.now()
                    };
                }
                this.database.addUserStatistic(user.getName(), 1, 'freeplay_match');
                //Start Game
                if (this.getGameState() === STATE.WAITING) {
                    this.setGameState(STATE.PLAYING)
                }
                //Send to Player
                reqInfo[ParamsKey.SEAT] = emptySeat;
                reqInfo[ParamsKey.GUN_ID] = player.getCurrentGun();
                this.sendToUser(Commands.ENTER_GAME, reqInfo, user);
                //Send to other Players
                reqInfo[ParamsKey.SEAT] = emptySeat;
                reqInfo[ParamsKey.PLAYER] = player.toObj();
                this.sendToListIgnoreOne(Commands.NEW_PLAYER_ENTER, reqInfo, this.players, player);
                this.sendToListIgnoreOne(Commands.NEW_PLAYER_ENTER, reqInfo, this.spectators, player);
            } else {
                reqInfo[ParamsKey.SUCCESS] = false;
                reqInfo[ParamsKey.MESSAGE] = 'Máy đã hết chỗ ngồi';
                this.sendToUser(Commands.ENTER_GAME, reqInfo, user);
            }
        } else {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Bạn không đủ gold vào vào game';
            this.sendToUser(Commands.ENTER_GAME, reqInfo, user);
        }
    } else {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User not exist on list spectators';
        this.sendToUser(Commands.ENTER_GAME, reqInfo, user);
    }
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
    var fireDataExtras = params[ParamsKey.EXTRAS];
    var reqInfo = {};
    var player = this.findPlayer(user.getName());
    if (player) {
        var bulletCoin = Consts.GUN.TYPE[player.getCurrentGun()].coin;
        if (player.getGold() >= bulletCoin) {
            //
            this.addCurrentMachineWin(bulletCoin);

            player.addGold(-bulletCoin);
            player.goldBullet += bulletCoin;
            //
            this.playerInfoMap[player.getName()].roomInterest += bulletCoin;
            this.playerInfoMap[player.getName()].playerMoneyEnd = player.getGold();
            this.playerInfoMap[player.getName()].playerMoneyChange += (-bulletCoin);
            //
            //var bulletId = user.getName() + '-' + Date.now() + '-' + bulletCoin;
            var bulletId = user.getSession().id + '-' + this.bulletsQueue.length;
            var opts = {uid: bulletId, speed: {vx: vx, vy: vy}, coin: bulletCoin, owner: user.getName(), bonusCoin : player.getPercentBonusCoin()};
            var bullet = new Bullet(opts);
            this.addBullet(bullet);
            reqInfo[ParamsKey.BULLET_ID] = bulletId;
            reqInfo[ParamsKey.SEAT] = player.getSeat();
            //reqInfo[ParamsKey.MONEY] = player.getMoney();
            reqInfo[ParamsKey.GOLD] = player.getGold();
            reqInfo[ParamsKey.SPEED] = {vx: vx, vy: vy};
            reqInfo[ParamsKey.COIN] = bulletCoin;
            reqInfo[ParamsKey.PLAYER] = user.getName();
            reqInfo[ParamsKey.GUN_ID] = player.getCurrentGun();
            if (fireDataExtras) {
                reqInfo[ParamsKey.EXTRAS] = fireDataExtras;
            }

            this.sendToPlayer(Commands.FIRE, reqInfo, player);
            this.sendToListIgnoreOne(Commands.PLAYER_FIRE, reqInfo, this.players, player);
            this.sendToList(Commands.PLAYER_FIRE, reqInfo, this.spectators);
        } else {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'User not enough gold';
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
        this.sendToUser(Commands.FIRE, reqInfo, user);
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
    var t = utils.random(Consts.RATIO_BULLET_HIT_FISH);
    if (t === 0) {
        //Random ban trung ca
        fish.addHp(-bullet.coin);
    }

    var fishDeadDecision = new FishDeadDecision();
    var extrasInfo = {};
    extrasInfo.machine_win_ratio = this.roomSetting.machineWinRatio;
    extrasInfo.machine_lost_ratio = this.roomSetting.machineLostRatio;
    extrasInfo.machine_win_money = this.currentMachineWin;
    extrasInfo.machine_lost_money = this.currentMachineLost;
    extrasInfo.game_type = Consts.GAME_TYPE.FREE_PLAY;

    var validateResult = fishDeadDecision.validateFishDead(fish, bullet, player, extrasInfo);
    if (validateResult.dead) {
        //Xoa ca va dan khoi queue
        this.removeBullet(bulletId);
        this.removeFish(fishId);
        //Update tien
        var fishMoney = validateResult.money;

        this.addCurrentMachineLost(fishMoney);

        player.addGold(fishMoney);
        player.goldFish += fishMoney;
        //
        this.playerInfoMap[player.getName()].roomInterest += (-fishMoney);
        this.playerInfoMap[player.getName()].playerMoneyEnd = player.getGold();
        this.playerInfoMap[player.getName()].playerMoneyChange += fishMoney;

        //this.addUserGoldToDb(player, player.getCurrentGoldChange(), 'fire hit');
        //
        reqInfo[ParamsKey.FISD_DEAD] = true;
        reqInfo[ParamsKey.FISH_ID] = fishId;
        reqInfo[ParamsKey.BULLET_ID] = bulletId;
        //reqInfo[ParamsKey.DELTA_MONEY] = fishMoney;
        //reqInfo[ParamsKey.MONEY] = player.getMoney();
        reqInfo[ParamsKey.DELTA_GOLD] = fishMoney;
        reqInfo[ParamsKey.GOLD] = player.getGold();
        reqInfo[ParamsKey.NAME] = player.getName();
        reqInfo[ParamsKey.SEAT] = player.getSeat();
        //
        this.sendToList(Commands.FISH_DEAD, reqInfo, this.players);
        this.sendToList(Commands.FISH_DEAD, reqInfo, this.spectators);
        //Random An Item
        if (this.currentFishTurn.type === Consts.FISH_TURN.TYPE.NORMAL) {
            var genItemResult = ItemGenerator.getInstance().genItemWhenFishDead(fish, player, {maxRandomGenItem: 60});
            if (genItemResult.has_item) {
                var item_id = genItemResult.item_id;
                var itemUid = user.getName() + '-' + Date.now() + '-' + item_id;
                var itemDataConfig = ItemConfig.getInstance().getItemData(item_id);
                var opts = {
                    uid: itemUid,
                    item_id: item_id,
                    name: itemDataConfig.name,
                    percent_appear: itemDataConfig.percent_appear,
                    time_sec_effect: itemDataConfig.time_sec_effect,
                    owner: user.getName()
                };
                var item = new Item(opts);

                player.addItems(item);

                var itemPickupInfo = {};
                itemPickupInfo[ParamsKey.ITEM_ID] = itemUid;
                itemPickupInfo[ParamsKey.FISH_ID] = fishId;
                itemPickupInfo[ParamsKey.ITEM_TYPE] = item_id;
                itemPickupInfo[ParamsKey.NAME] = player.getName();
                itemPickupInfo[ParamsKey.SEAT] = player.getSeat();
                //
                this.sendToList(Commands.PICK_UP_ITEM, itemPickupInfo, this.players);
                this.sendToList(Commands.PICK_UP_ITEM, itemPickupInfo, this.spectators);
            }
        }
        //
        this.plantFishWhenOtherFishDied();
    }
};

prot.bulletOuOfGame = function(params, user) {
    var bulletId = params[ParamsKey.BULLET_ID];
    this.removeBullet(bulletId);
};

prot.useItem = function(params, user) {
    var self = this;
    var reqInfo = {};
    var itemUid = params[ParamsKey.ITEM_ID];
    var extrasInfo = params[ParamsKey.EXTRAS];
    var clientSign = params[ParamsKey.SIGN];
    var serverSign = Common.MD5(itemUid + user.getProperty(UserFlag.SECRET_KEY));
    var player = this.findPlayer(user.getName());
    if (!player) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User not in list player';
        this.sendToUser(Commands.USE_ITEM, reqInfo, user);
        return;
    }
    if (serverSign !== clientSign) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Server sign and client sign not match';
        this.sendToUser(Commands.USE_ITEM, reqInfo, user);
        return;
    }
    var item = player.getItem(itemUid);
    if (!item) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Người chơi không sở hữu item';
        this.sendToUser(Commands.USE_ITEM, reqInfo, user);
        return;
    }
    for (var i = 0; i < this.itemsInUsed.length; i++) {
        var inUsedItem = this.itemsInUsed[i];
        if (inUsedItem.owner === player.getName()) {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Người chơi đang sử dụng 1 item khác';
            this.sendToUser(Commands.USE_ITEM, reqInfo, user);
            return;
        }
    }
    for (var i = 0; i < this.itemsInUsed.length; i++) {
        var inUsedItem = this.itemsInUsed[i];
        if (inUsedItem.type === item.type && inUsedItem.owner === player.getName()) {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Người chơi đang sử dụng 1 item tương tự';
            this.sendToUser(Commands.USE_ITEM, reqInfo, user);
            return;
        }
        if (item.type === Consts.ITEM.TYPE.X2_GOLD || item.type === Consts.ITEM.X3_GOLD) {
            if ((inUsedItem.type === Consts.ITEM.TYPE.X2_GOLD || inUsedItem.type === Consts.ITEM.TYPE.X3_GOLD)
                && inUsedItem.owner === player.getName()) {
                reqInfo[ParamsKey.SUCCESS] = false;
                reqInfo[ParamsKey.MESSAGE] = 'Người chơi đang sử dụng 1 item tương tự';
                this.sendToUser(Commands.USE_ITEM, reqInfo, user);
                return;
            }
        }
        if (item.type === Consts.ITEM.TYPE.FROZEN && this.itemState === ITEM_STATE.FROZEN) {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Người chơi đang sử dụng 1 item tương tự';
            this.sendToUser(Commands.USE_ITEM, reqInfo, user);
            return;
        }
    }

    item.avtivate();
    this.itemsInUsed.push(item);

    this.playerUseItem(player, item);

    player.removeItem(itemUid);
    reqInfo[ParamsKey.SUCCESS] = true;
    reqInfo[ParamsKey.ITEM_ID] = itemUid;
    reqInfo[ParamsKey.ITEM_TYPE] = item.type;
    reqInfo[ParamsKey.ITEM_TIME_EFFECT] = item.time_sec_effect;
    if (extrasInfo) {
        reqInfo[ParamsKey.EXTRAS] = extrasInfo;
    }
    reqInfo[ParamsKey.NAME] = player.getName();
    reqInfo[ParamsKey.SEAT] = player.getSeat();
    this.sendToList(Commands.USE_ITEM, reqInfo, this.players);
    this.sendToList(Commands.USE_ITEM, reqInfo, this.spectators);
};

prot.fireHitItem = function(params, user) {
    var self = this;
    var reqInfo = {};
    var itemUid = params[ParamsKey.ITEM_ID];
    var fishUidArr = params[ParamsKey.FISH_LIST];
    var clientSign = params[ParamsKey.SIGN];
    var serverSign = Common.MD5(itemUid + user.getProperty(UserFlag.SECRET_KEY));
    var player = this.findPlayer(user.getName());
    if (!player) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User not in list player';
        this.sendToUser(Commands.FIRE_HIT_ITEM, reqInfo, user);
        return;
    }
    if (serverSign !== clientSign) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Server sign and client sign not match';
        this.sendToUser(Commands.FIRE_HIT_ITEM, reqInfo, user);
        return;
    }
    var item = null;
    for (var i = 0; i < this.itemsInUsed.length; i++) {
        if (this.itemsInUsed[i] && this.itemsInUsed[i].uid === itemUid) {
            item = this.itemsInUsed[i];
        }
    }
    if (!item) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Item không tồn tại trong màn chơi';
        this.sendToUser(Commands.FIRE_HIT_ITEM, reqInfo, user);
        return;
    }
    var fishes = [];
    for (var i = 0; i < fishUidArr.length; i++) {
        var aFish = this.getFishInQueueFromUid(fishUidArr[i]);
        if (aFish) {
            fishes.push(aFish);
        }
    }
    var fisdDeadDecision = new FishDeadDecision();
    var extrasInfo = {};
    extrasInfo.machine_win_ratio = this.roomSetting.machineWinRatio;
    extrasInfo.machine_lost_ratio = this.roomSetting.machineLostRatio;
    extrasInfo.machine_win_money = this.currentMachineWin;
    extrasInfo.machine_lost_money = this.currentMachineLost;
    var result = fisdDeadDecision.validateFishDeadByItem(fishes, item, player, extrasInfo);
    var totalMoneyFishDead = result.money;
    var fishListDead = result.fish_list;

    //Xoa ca va dan khoi queue
    for (var i = 0; i < fishListDead.length; i++) {
        this.removeFish(fishListDead[i].fish_id);
    }
    //Update tien
    this.addCurrentMachineLost(totalMoneyFishDead);

    player.addGold(totalMoneyFishDead);
    player.goldFish += totalMoneyFishDead;
    //
    this.playerInfoMap[player.getName()].roomInterest += (-totalMoneyFishDead);
    this.playerInfoMap[player.getName()].playerMoneyEnd = player.getGold();
    this.playerInfoMap[player.getName()].playerMoneyChange += totalMoneyFishDead;

    //this.addUserGoldToDb(player, player.getCurrentGoldChange(), 'fire hit');

    reqInfo[ParamsKey.FISH_LIST] = result.fish_list;
    reqInfo[ParamsKey.ITEM_ID] = itemUid;
    //reqInfo[ParamsKey.DELTA_MONEY] = totalMoneyFishDead;
    //reqInfo[ParamsKey.MONEY] = player.getMoney();
    reqInfo[ParamsKey.DELTA_GOLD] = totalMoneyFishDead;
    reqInfo[ParamsKey.GOLD] = player.getGold();
    reqInfo[ParamsKey.NAME] = player.getName();
    reqInfo[ParamsKey.SEAT] = player.getSeat();

    this.sendToList(Commands.FISH_DEAD_ITEM, reqInfo, this.players);
    this.sendToList(Commands.FISH_DEAD_ITEM, reqInfo, this.spectators);

    for (var i = 0; i < fishListDead.length; i++) {
        this.plantFishWhenOtherFishDied();
    }
};

prot.confirmItemTimeOut = function(params, user) {
    var itemUid = params[ParamsKey.ITEM_ID];
    var item = null;
    for (var i = 0; i < this.itemsInUsed.length; i++) {
        if (this.itemsInUsed[i].uid === itemUid) {
            item = this.itemsInUsed[i];
            break;
        }
    }
    var reqInfo = {};
    if (!item) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Item not found';
        this.sendToUser(Commands.CONFIRM_ITEM_TIME_OUT, reqInfo, user);
        return;
    }
    //var player = this.findPlayer(user.getName());
    var player = this.findPlayer(item.owner);
    if (!player) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User not in list player';
        this.sendToUser(Commands.CONFIRM_ITEM_TIME_OUT, reqInfo, user);
        return;
    }
    if (item.owner !== user.getName()) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'User ' + user.getName() + ' không sở hữu vật phẩm này';
        this.sendToUser(Commands.CONFIRM_ITEM_TIME_OUT, reqInfo, user);
        return;
    }

    if (item) {
        var extrasReqInfo = {};
        reqInfo[ParamsKey.ITEM_ID] = item.uid;
        reqInfo[ParamsKey.ITEM_TYPE] = item.type;
        reqInfo[ParamsKey.NAME] = player.getName();
        reqInfo[ParamsKey.SEAT] = player.getSeat();
        this.sendToList(Commands.ITEM_TIME_OUT, reqInfo, this.players);
        this.sendToList(Commands.ITEM_TIME_OUT, reqInfo, this.spectators);
        for (var i = 0; i < this.itemsInUsed.length; i++) {
            if (this.itemsInUsed[i].uid === itemUid) {
                this.itemsInUsed.splice(i, 1);
                break;
            }
        }
    }
};

// ===============================================================
// UPDATE GAME LOGIC
// ===============================================================

prot.plantFishWhenOtherFishDied = function(count) {
    if (this.itemState === ITEM_STATE.FROZEN) {
        return;
    }
    if (this.currentFishTurn.type === Consts.FISH_TURN.TYPE.SPECIAL) {
        return;
    }
    var numberFish = count || 1;
    var listFishPlant = [];
    for (var i = 0; i < numberFish; i++) {
        var fish = this.currentFishTurn.plantFish();
        this.addFish(fish);
        listFishPlant.push(fish);
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

// Sinh turn ca. Kiem tra xem neu cac turn da het thi phai sinh turn moi
prot.doGenerateFishTurn = function() {
    if (!this.currentFishTurn) {
        this.createTurn();
    } else {
        if (this.currentFishTurn.type === Consts.FISH_TURN.TYPE.NORMAL) {
            if (this.currentFishTurn.isOutOfFish()) {
                this.createTurn();
            }
        } else if (this.currentFishTurn.type === Consts.FISH_TURN.TYPE.SPECIAL) {
            if (this.fishQueue.length === 0 && this.currentFishTurn.isPlantAllFish) {
                //Chi sinh turn binh thuong
                this.createTurn(Consts.FISH_TURN.TYPE.NORMAL);
            }
        }
    }
};

// Kiem tra tinh trang ca hien gio trong game de tha them ca ra
prot.doPlantFish = function() {
    if (this.itemState === ITEM_STATE.FROZEN) {
        return;
    }
    var listFishPlant = [];
    if (this.currentFishTurn.type === Consts.FISH_TURN.TYPE.NORMAL) {
        if (this.fishQueue.length === 0) {
            //Tha 1 loat max ca
            while (this.fishQueue.length < this.roomSetting.getMinAmountFish()) {
                if (this.currentFishTurn.isOutOfFish()) {
                    break;
                } else {
                    var fish = this.currentFishTurn.plantFish();
                    this.addFish(fish);
                    listFishPlant.push(fish);
                }
            }
        } else if (this.fishQueue.length < this.roomSetting.getMinAmountFish()) {
            while (this.fishQueue.length < this.roomSetting.getMinAmountFish()) {
                if (this.currentFishTurn.isOutOfFish()) {
                    break;
                } else {
                    var fish = this.currentFishTurn.plantFish();
                    this.addFish(fish);
                    listFishPlant.push(fish);
                }
            }
        } else if (this.fishQueue.length < this.roomSetting.getMaxAmountFish()) {
            if (Date.now() - this.lastTimeGenerateFish >= 500) {
                var t = utils.random(2);
                if (t === 0) {
                    var number = utils.random(3) + this.countPlayerPlaying();
                    for (var i = 0; i < number; i++) {
                        var fish = this.currentFishTurn.plantFish();
                        this.addFish(fish);
                        listFishPlant.push(fish);
                    }
                }
                this.lastTimeGenerateFish = Date.now();
            }
        }
    } else if (this.currentFishTurn.type === Consts.FISH_TURN.TYPE.SPECIAL) {
        if (this.fishQueue.length <= 2 && !this.currentFishTurn.isOutOfFish()) {
            listFishPlant = this.currentFishTurn.plantFishSpecial();
            for (var i = 0; i < listFishPlant.length; i++) {
                this.addFish(listFishPlant[i]);
            }
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

// Kiem tra ca hoac dan bi timeout
prot.doCheckEntityTimeOut = function() {
    for (var i = this.fishQueue.length - 1; i > 0; i--) {
        var fish = this.fishQueue[i];
        if (!fish || fish.isTimeOut() || fish.isEndOrbit()) {
            this.fishQueue.splice(i, 1);
            for (var k in fish) {
                delete fish[k];
            }
            fish = null;
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
    var count = 0;
    for (var i = 0; i < this.fishQueue.length; i++) {
        var fish = this.fishQueue[i];
        if (fish) {
            fish.move();
        }
        if (fish && fish.isEndOrbit()) {
            this.fishQueue.splice(i, 1);
            i--;
            count++;
            for (var k in fish) {
                delete fish[k];
            }
            fish = null;
        }
    }
    if (count > 0) {
        this.plantFishWhenOtherFishDied(count);
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
            } else if (player.getGold() < 2) {
                this.leaveRoom(null, player.getUser(), GameController.LEAVE_ROOM_REASON.NOT_ENOUGH_MONEY);
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
            this.spectators[i] = null;
        }
    }
};

prot.doCheckItemTimeOut = function() {
    var reqInfo = {}, extrasReqInfo = {};
    for (var i = 0; i < this.itemsInUsed.length; i++) {
        var item = this.itemsInUsed[i];
        if (item.isTimeOut()) {
            var player = this.findPlayer(item.owner);
            if (player) {
                reqInfo[ParamsKey.ITEM_ID] = item.uid;
                reqInfo[ParamsKey.ITEM_TYPE] = item.type;
                reqInfo[ParamsKey.NAME] = player.getName();
                reqInfo[ParamsKey.SEAT] = player.getSeat();
                //Xu ly timeout cho item cua nguoi choi nao do
                if (item.type === Consts.ITEM.TYPE.X2_GOLD || item.type === Consts.ITEM.TYPE.X3_GOLD) {
                    player.setPercentBonusCoin(0);
                    extrasReqInfo[ParamsKey.PLAYER_BONUS_COIN] = 0;
                } else if (item.type === Consts.ITEM.TYPE.FROZEN) {
                    if (this.itemState === ITEM_STATE.FROZEN) {
                        if (Date.now() - this.timeItemState >= this.timeItemStateEffect) {
                            this.setItemState(ITEM_STATE.NON_ITEM);
                            extrasReqInfo[ParamsKey.ITEM_STATE] = ITEM_STATE.NON_ITEM;
                        }
                    }
                } else if (item.type === Consts.ITEM.TYPE.TARGET_LOCK) {
                    extrasReqInfo[ParamsKey.LOCK_TARGET] = false;
                } else if (item.type === Consts.ITEM.TYPE.LASER) {
                    extrasReqInfo[ParamsKey.LASER_CANNON] = false;
                }
                reqInfo[ParamsKey.EXTRAS] = extrasReqInfo;

                this.sendToList(Commands.ITEM_TIME_OUT, reqInfo, this.players);
                this.sendToList(Commands.ITEM_TIME_OUT, reqInfo, this.spectators);
            }
            //Xoa khoi danh sach
            this.itemsInUsed.splice(i, 1);
            i--;
        } else if (Date.now() - item.timeStartCreated >= 60000) {
            //Xoa khoi danh sach luon
            this.itemsInUsed.splice(i, 1);
            i--;
        }
    }
    if (this.itemState === ITEM_STATE.FROZEN) {
        if (Date.now() - this.timeItemState >= this.timeItemStateEffect) {
            this.setItemState(ITEM_STATE.NON_ITEM);
            //
            var changeItemReqInfo = {};
            changeItemReqInfo[ParamsKey.ITEM_STATE] = ITEM_STATE.NON_ITEM;

            this.sendToList(Commands.CHANGE_ITEM_STATE, changeItemReqInfo, this.players);
            this.sendToList(Commands.CHANGE_ITEM_STATE, changeItemReqInfo, this.spectators);
        }
    }
};

prot.doUpdateDatabase = function() {
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player && Date.now() - player.lastTimeUpdateMoneyDb >= 30000) {
            if (player.getCurrentGoldChange() > 0) {
                this.addUserGoldToDb(player, player.getCurrentGoldChange(), 'auto update');
            } else {
                player.resetLastTimeUpdateMoneyDb();
            }
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
    this.playerInfoMap = {};
    this.lastTimeGenerateFish = Date.now();
    this.roomInterestBefore = 0;
    this.itemsInUsed = [];
    this.timeItemState = Date.now();
    this.itemState = ITEM_STATE.NON_ITEM;
    this.timeItemStateEffect = 0;
    this.countTurnNormalBeforeSpecial = 0;
    this.waitTimeLog = 0;
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

prot.setItemState = function(itemState) {
    this.itemState = itemState;
    this.timeItemState = Date.now();
};

// ===============================================================
// USE ITEMS
// ===============================================================

prot.playerUseItem = function(player, item) {
    if (item.type === Consts.ITEM.TYPE.X2_GOLD) {
        player.setPercentBonusCoin(100);
    } else if (item.type === Consts.ITEM.TYPE.X3_GOLD) {
        player.setPercentBonusCoin(200);
    } else if (item.type === Consts.ITEM.TYPE.FROZEN) {
        this.setItemState(ITEM_STATE.FROZEN);
        this.timeItemStateEffect = item.time_sec_effect * 1000;
        this.timeItemState = Date.now();

        var reqInfo = {};
        reqInfo[ParamsKey.ITEM_STATE] = ITEM_STATE.FROZEN;
        this.sendToList(Commands.CHANGE_ITEM_STATE, reqInfo, this.players);
        this.sendToList(Commands.CHANGE_ITEM_STATE, reqInfo, this.spectators);
    }
};

// ===============================================================
// SUPPORT METHODS
// ===============================================================

prot.addUserGoldToDb = function(player, change, reason) {
    var self = this;
    if (change !== 0) {
        this.database.addUserGold(player.getName(), change, reason);
    }
    player.setCurrentGoldChange(0);
    if (player.hasOwnProperty('lastTimeUpdateMoneyDb')) {
        player.resetLastTimeUpdateMoneyDb();
    }
};

prot.updateUserGoldToDb = function(player, newGold, reason) {
    this.database.updateUserGold(player.getName(), newGold, reason);
    player.setCurrentGoldChange(0);
    if (player.hasOwnProperty('lastTimeUpdateMoneyDb')) {
        player.resetLastTimeUpdateMoneyDb();
    }
};

prot.removeItemsInUsedOfPlayer = function(name) {
    for (var i = 0; i < this.itemsInUsed.length; i++) {
        var item = this.itemsInUsed[i];
        if (item && item.owner === name) {
            this.itemsInUsed.splice(i, 1);
            item = null;
            i--;
        }
    }
};

prot.getFishInQueueFromUid = function(uid) {
    for (var i = 0; i < this.fishQueue.length; i++) {
        if (this.fishQueue[i].uid === uid) {
            return this.fishQueue[i];
            break;
        }
    }
    return null;
};

prot.createTurn = function(turnType) {
    if (!turnType) {
        turnType = Consts.FISH_TURN.TYPE.NORMAL;
        if (this.countTurnNormalBeforeSpecial >= Consts.FISH_TURN.COUNT_TIME_NORMAL_TO_SPECIAL) {
            var t = utils.random(1);
            if (t === 0) {
                turnType = Consts.FISH_TURN.TYPE.SPECIAL;
            }
        }
    }
    //turnType = Consts.FISH_TURN.TYPE.SPECIAL;
    if (turnType === Consts.FISH_TURN.TYPE.NORMAL) {
        this.countTurnNormalBeforeSpecial++;
        var maxFish = utils.randomBetween(2, 5) * 100;
        var opts = {type : Consts.FISH_TURN.TYPE.NORMAL, maxFish : maxFish};
        this.currentFishTurn = new FishTurn(opts);
        this.currentFishTurn.generateFish();
    } else if (turnType === Consts.FISH_TURN.TYPE.SPECIAL) {
        this.countTurnNormalBeforeSpecial = 0;
        var opts = {type : Consts.FISH_TURN.TYPE.SPECIAL};
        this.currentFishTurn = new FishTurn(opts);
        this.currentFishTurn.generateFish();
    }
};

prot.console = function(msg) {
    if (Date.now() - this.waitTimeLog >= 1000) {
        console.log(msg);
        this.waitTimeLog = Date.now();
    }
};