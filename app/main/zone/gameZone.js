var fs = require('fs');
var xml2js = require('xml2js');
var Database = require('../../lib/database/database');
var utils = require('../../util/utils');
var Debug = require('../../log/debug.js');
var GameConfig = require('../../lib/config/gameConfig.js');
var Popup = require('../../lib/common/popup.js');
var Common = require('../../lib/common/common.js');
var Consts = require('../../consts/consts.js');
var RoomSetting = require('../../lib/config/roomSetting.js');
var RoomSettingManager = require('../../lib/config/roomSettingManager');
var FishConfig = require('../../main/entity/fishConfig');
var ItemConfig = require('../../main/entity/itemConfig');
var Room = require('../../domain/room');
var RoomManagerService = require('../../domain/roomManagerService');
var LoadConfigTask = require('./loadConfigTask');
var LoadGameConfigTask = require('./loadGameConfigTask');
var LogCCUTask = require('./logCCUTask');
var EventManager = require('../../lib/config/eventManager');

var roomConfigXml = 'room_cfg.xml';

var GameZone = function(opts) {
    this.inConnector = opts.inConnector || false;
};

module.exports = GameZone;

var prototype = GameZone.prototype;

prototype.init = function() {
    this.loadGameConfig();
    if (!this.inConnector) {
        this.resetQuickRoomManager();
        this.loadScheduledTask();
        this.loadPopUp();
        this.loadChallengeRoom();
        this.loadQuickPlayRoom();
        this.loadFreePlayRoom();
        this.loadFish();
        this.loadItem();
        this.loadCardConfig();
        this.loadPartner();
        this.loadEventManager();
    } else {
        //Reload Config in connector
        var optsLoadConfigTask = {gameZone : this, interval : Consts.TIME_SCHEDULER_TASK.LOAD_CONFIG_TASK};
        var loadGameConfigTask = new LoadGameConfigTask(optsLoadConfigTask);
        loadGameConfigTask.run();
    }
};

prototype.loadScheduledTask = function() {
    var optsLoadConfigTask = {gameZone : this, interval : Consts.TIME_SCHEDULER_TASK.LOAD_CONFIG_TASK};
    var loadConfigTask = new LoadConfigTask(optsLoadConfigTask);
    loadConfigTask.run();

    var optsLogCCUTask = {interval : Consts.TIME_SCHEDULER_TASK.LOG_CCU_TASK};
    var logCCUTask = new LogCCUTask(optsLogCCUTask);
    logCCUTask.run();
};

prototype.resetQuickRoomManager = function() {
    var database = Database.getInstance();
    database.resetQuickRoomManager();
};

prototype.loadGameConfig = function() {
    var database = Database.getInstance();
    var gameConfig = GameConfig.getInstance();
    database.getAllGameConfig(function(err, res) {
        if (res) {
            for (var i = 0; i < res.length; i++) {
                var row = res[i];
                if (row.key === 'banner_text') {
                    gameConfig.setBanner_text(row.value);
                } else if (row.key === 'banner_link') {
                    gameConfig.setBanner_link(row.value);
                } else if (row.key === 'current_version') {
                    gameConfig.setCurrent_version(row.value);
                } else if (row.key === 'payment_method') {
                    gameConfig.setPayment_method(row.value);
                } else if (row.key === 'payment_permission') {
                    gameConfig.setPayment_permission(row.value);
                } else if (row.key === 'register_bonus') {
                    gameConfig.setRegister_bonus(Number(row.value));
                } else if (row.key === 'max_account_device_id') {
                    gameConfig.setMax_account_device_id(Number(row.value));
                } else if (row.key === 'number_acc_per_device_register_bonus') {
                    gameConfig.setNumber_acc_per_device_register_bonus(Number(row.value));
                } else if (row.key === 'cashout_permission') {
                    gameConfig.setCashout_permission(row.value);
                } else if (row.key === 'money_cashout_remain') {
                    gameConfig.money_cashout_remain = row.value;
                } else if (row.key === 'rule_cashout') {
                    gameConfig.rule_cashout = row.value;
                } else if (row.key === 'register_default_gold') {
                    gameConfig.register_default_gold = Number(row.value);
                } else if (row.key === 'freeplay_win_lost_ratio') {
                    gameConfig.freeplay_win_lost_ratio = row.value;
                } else if (row.key === 'invite_code_bonus_gold') {
                    gameConfig.invite_code_bonus_gold = Number(row.value);
                } else if (row.key === 'platform_default_full_mode') {
                    gameConfig.setPlatform_default_full_mode(row.value);
                } else if (row.key === 'hour_active_full_mode') {
                    gameConfig.setHour_active_full_mode(row.value);
                } else if (row.key === 'freeplay_valid_open_full_mode') {
                    gameConfig.freeplay_valid_open_full_mode = Number(row.value);
                }
            }
            //console.log("=== GameZone getPlatform_default_full_mode() value : " + JSON.stringify(gameConfig.getPlatform_default_full_mode()));
            database.updateGameConfig('last_load_config', Common.fomatDate(new Date(Date.now())));
            res = null;
        } else {
            Debug.error("GameZone", err);
        }
    });
};

prototype.loadPopUp = function() {
    var database = Database.getInstance();
    var gameConfig = GameConfig.getInstance();
    gameConfig.resetPopup();

    function parseExtrasInfo(extras) {
        var obj = {};
        if (extras) {
            if (extras.startsWith && extras.startsWith("http:")) {
                obj['url'] = extras;
            } else {
                try {
                    obj = JSON.parse(extras);
                } catch (e) {
                    obj['data'] = extras;
                }
            }
        }
        return obj;
    }

    database.getAllPopupActive(function(err, res) {
        if (res) {
            for (var i = 0; i < res.length; i++) {
                var row = res[i];
                var popup = new Popup();
                popup.id = row.id;
                popup.content = row.content;
                popup.extras = /*JSON.parse(row.extras)*/parseExtrasInfo(row.extras);
                popup.state = row.state;
                popup.title = row.title;
                popup.time_start = row.time_start;
                popup.time_end = row.time_end;
                popup.type = row.type;
                gameConfig.addPopup(popup);
            }
        }
    });
};

prototype.loadEventManager = function() {
    var database = Database.getInstance();
    var gameConfig = GameConfig.getInstance();
    database.getAllEventManager(function(err, res) {
        if (res) {
            for (var i = 0; i < res.length; i++) {
                var row = res[i];
                var eventM = new EventManager(row);
                gameConfig.addEventManager(eventM);
            }
        }
    });
};

prototype.loadChallengeRoom = function() {
    var fileData = fs.readFileSync(Consts.CONFIG_PATH.CHALLENGE_ROOM_BASE + '/' + roomConfigXml, 'utf8');
    var parser = new xml2js.Parser();
    var roomSettingManager = RoomSettingManager.getInstance();
    var self = this;
    var countIndex = 0;
    parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
        if (!err) {
            var roomList = result.roomConfig.room;
            for (var i = 0; i < roomList.length; i++) {
                var roomElement = roomList[i];
                var game_id = Number(roomElement["game_id"][0]);
                var baseRoomName = roomElement["name"][0];
                var tableFee = Number(roomElement['tableFee'][0]);
                var minJoinRoom = Number(roomElement['minJoinRoom'][0]);
                var numbers = Number(roomElement['numbers'][0]);
                var initBullet = Number(roomElement['initBullet'][0]);
                var maxPlayer = Number(roomElement['maxPlayer'][0]);
                for (var j = 0; j < numbers; j++) {
                    countIndex++;
                    var roomSetting = new RoomSetting();
                    var roomName = baseRoomName + "_" + (j + 1);
                    roomSetting.index = countIndex;
                    roomSetting.tableFee = tableFee;
                    roomSetting.minJoinRoom = minJoinRoom;
                    roomSetting.maxPlayer = maxPlayer;
                    roomSetting.initBullet = initBullet;
                    roomSetting.name = roomName;
                    roomSettingManager.putSetting(Consts.GAME_TYPE.CHALLENGE, roomName, roomSetting);
                    //
                    self.createRoom(roomName, Consts.GAME_TYPE.CHALLENGE);
                }
            }
        }
    });
};

prototype.loadQuickPlayRoom = function() {
    var self = this;
    var database = Database.getInstance();
    database.getAllQuickRoom(function(err, res) {
        if (res) {
            self.loadQuickPlayRoomFromDb(res);
        } else {
            self.loadQuickPlayRoomFromFile();
        }
    });
};

prototype.loadFreePlayRoom = function() {
    var database = Database.getInstance();
    var fileData = fs.readFileSync(Consts.CONFIG_PATH.FREEPLAY_ROOM_BASE + '/' + roomConfigXml, 'utf8');
    var parser = new xml2js.Parser();
    var roomSettingManager = RoomSettingManager.getInstance();
    var self = this;
    parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
        if (!err) {
            var roomList = result.roomConfig.room;
            for (var i = 0; i < roomList.length; i++) {
                var roomElement = roomList[i];
                var game_id = Number(roomElement["game_id"][0]);
                var baseRoomName = roomElement["name"][0];
                var minMoneyJoinRoom = Number(roomElement['minMoneyJoinRoom'][0]);
                var maxMoneyJoinRoom = Number(roomElement['maxMoneyJoinRoom'][0]);
                var numbers = Number(roomElement['numbers'][0]);
                var minAmountFish = Number(roomElement['minAmountFish'][0]);
                var maxAmountFish = Number(roomElement['maxAmountFish'][0]);
                var winLostRatio = roomElement['winLostRatio'][0];
                var maxPlayer = Number(roomElement['maxPlayer'][0]);
                for (var j = 0; j < numbers; j++) {
                    var roomSetting = new RoomSetting();
                    var roomName = baseRoomName + "_" + (j + 1);
                    roomSetting.minJoinRoom = minMoneyJoinRoom;
                    roomSetting.maxMoneyJoinRoom = maxMoneyJoinRoom;
                    roomSetting.minAmountFish = minAmountFish;
                    roomSetting.maxAmountFish = maxAmountFish;

                    var winLostRatioSplit = winLostRatio.split('-');
                    roomSetting.winLostRatio = Number(winLostRatioSplit[0]) / Number(winLostRatioSplit[1]);
                    roomSetting.machineWinRatio = Number(winLostRatioSplit[0]);
                    roomSetting.machineLostRatio = Number(winLostRatioSplit[1]);
                    roomSetting.name = roomName;

                    roomSetting.maxPlayer = maxPlayer;
                    roomSettingManager.putSetting(Consts.GAME_TYPE.FREE_PLAY, roomName, roomSetting);
                    //
                    self.createRoom(roomName, Consts.GAME_TYPE.FREE_PLAY);
                }
            }
        }
    });
};

prototype.loadQuickPlayRoomFromFile = function() {
    var database = Database.getInstance();
    var fileData = fs.readFileSync(Consts.CONFIG_PATH.QUICKPLAY_ROOM_BASE + '/' + roomConfigXml, 'utf8');
    var parser = new xml2js.Parser();
    var roomSettingManager = RoomSettingManager.getInstance();
    var self = this;
    parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
        if (!err) {
            var roomList = result.roomConfig.room;
            for (var i = 0; i < roomList.length; i++) {
                var roomElement = roomList[i];
                var game_id = Number(roomElement["game_id"][0]);
                var baseRoomName = roomElement["name"][0];
                var minMoneyJoinRoom = Number(roomElement['minMoneyJoinRoom'][0]);
                var maxMoneyJoinRoom = Number(roomElement['maxMoneyJoinRoom'][0]);
                var numbers = Number(roomElement['numbers'][0]);
                var minAmountFish = Number(roomElement['minAmountFish'][0]);
                var maxAmountFish = Number(roomElement['maxAmountFish'][0]);
                var winLostRatio = roomElement['winLostRatio'][0];
                var maxPlayer = Number(roomElement['maxPlayer'][0]);
                for (var j = 0; j < numbers; j++) {
                    var roomSetting = new RoomSetting();
                    var roomName = baseRoomName + "_" + (j + 1);
                    roomSetting.minJoinRoom = minMoneyJoinRoom;
                    roomSetting.maxMoneyJoinRoom = maxMoneyJoinRoom;
                    roomSetting.minAmountFish = minAmountFish;
                    roomSetting.maxAmountFish = maxAmountFish;

                    var winLostRatioSplit = winLostRatio.split('-');
                    roomSetting.winLostRatio = Number(winLostRatioSplit[0]) / Number(winLostRatioSplit[1]);
                    roomSetting.machineWinRatio = Number(winLostRatioSplit[0]);
                    roomSetting.machineLostRatio = Number(winLostRatioSplit[1]);
                    roomSetting.name = roomName;

                    roomSetting.maxPlayer = maxPlayer;
                    roomSettingManager.putSetting(Consts.GAME_TYPE.QUICK_PLAY, roomName, roomSetting);
                    // Insert room into database
                    database.insertQuickPlayRoom(roomName, roomName, maxPlayer, minAmountFish, maxAmountFish, winLostRatio, minMoneyJoinRoom, maxMoneyJoinRoom);
                    //
                    self.createRoom(roomName, Consts.GAME_TYPE.QUICK_PLAY);
                }
            }
        }
    });
};

prototype.loadQuickPlayRoomFromDb = function(res) {
    var self = this;
    var roomSettingManager = RoomSettingManager.getInstance();
    for (var i = 0; i < res.length; i++) {
        var row = res[i];
        var game_id = Consts.GAME_TYPE.QUICK_PLAY;
        var roomName = row.name;
        var maxPlayer = row.max_players;
        var minAmountFish = row.min_amount_fish;
        var maxAmountFish = row.max_amount_fish;
        var winLostRatio = row.win_lost_ratio;
        var minMoneyJoinRoom = row.min_money;
        var maxMoneyJoinRoom = row.max_money;
        var roomState = row.room_state;

        var roomSetting = new RoomSetting();
        roomSetting.minJoinRoom = minMoneyJoinRoom;
        roomSetting.maxMoneyJoinRoom = maxMoneyJoinRoom;
        if (minAmountFish > 0) {
            roomSetting.minAmountFish = minAmountFish;
        } else {
            roomSetting.minAmountFish = 25;
        }
        if (maxAmountFish > 0) {
            roomSetting.maxAmountFish = maxAmountFish;
        } else {
            roomSetting.maxAmountFish = 25;
        }
        //
        var winLostRatioSplit = winLostRatio.split('-');
        roomSetting.winLostRatio = Number(winLostRatioSplit[0]) / Number(winLostRatioSplit[1]);
        roomSetting.machineWinRatio = Number(winLostRatioSplit[0]);
        roomSetting.machineLostRatio = Number(winLostRatioSplit[1]);
        roomSetting.name = roomName;
        roomSetting.setRoomState(roomState);
        //
        roomSetting.maxPlayer = maxPlayer;
        roomSettingManager.putSetting(Consts.GAME_TYPE.QUICK_PLAY, roomName, roomSetting);
        //
        self.createRoom(roomName, game_id);
    }
};

prototype.reloadQuickPlayRoom = function() {
    var self = this;
    var database = Database.getInstance();
    var roomSettingManager = RoomSettingManager.getInstance();
    database.getAllQuickRoom(function(err, res) {
        for (var i = 0; i < res.length; i++) {
            var row = res[i];
            var game_id = Consts.GAME_TYPE.QUICK_PLAY;
            var roomName = row.name;
            var maxPlayer = row.max_players;
            var minAmountFish = row.min_amount_fish;
            var maxAmountFish = row.max_amount_fish;
            var winLostRatio = row.win_lost_ratio;
            var minMoneyJoinRoom = row.min_money;
            var maxMoneyJoinRoom = row.max_money;
            var roomState = row.room_state;

            var roomSetting = roomSettingManager.getSetting(game_id, roomName);
            if (roomSetting) {
                roomSetting.minJoinRoom = minMoneyJoinRoom;
                roomSetting.maxMoneyJoinRoom = maxMoneyJoinRoom;
                if (minAmountFish > 0) {
                    roomSetting.minAmountFish = minAmountFish;
                } else {
                    roomSetting.minAmountFish = 25;
                }
                if (maxAmountFish > 0) {
                    roomSetting.maxAmountFish = maxAmountFish;
                } else {
                    roomSetting.maxAmountFish = 25;
                }
                //
                var winLostRatioSplit = winLostRatio.split('-');
                roomSetting.winLostRatio = Number(winLostRatioSplit[0]) / Number(winLostRatioSplit[1]);
                roomSetting.machineWinRatio = Number(winLostRatioSplit[0]);
                roomSetting.machineLostRatio = Number(winLostRatioSplit[1]);
                roomSetting.setRoomState(roomState);
            }
        }
    });
};

prototype.reloadSettingFreePlayRoom = function() {
    var roomSettingMap = RoomSettingManager.getInstance().getSettingMap(Consts.GAME_TYPE.FREE_PLAY);
    var gameConfig = GameConfig.getInstance();
    var winLostRatioSplit = gameConfig.freeplay_win_lost_ratio.split('-');
    for (var k in roomSettingMap) {
        var roomSetting = roomSettingMap[k];
        roomSetting.winLostRatio = Number(winLostRatioSplit[0]) / Number(winLostRatioSplit[1]);
        roomSetting.machineWinRatio = Number(winLostRatioSplit[0]);
        roomSetting.machineLostRatio = Number(winLostRatioSplit[1]);
        //console.log("=== reloadSettingFreePlayRoom winLostRatio : " + roomSetting.winLostRatio + ", machineWinRatio : " + roomSetting.machineWinRatio + ", machineLostRatio : " + roomSetting.machineLostRatio);
    }
};

prototype.createRoom = function(roomName, gameId) {
    if (!RoomManagerService.getInstance().containsRoomName(roomName)) {
        var opts = {tableName: roomName, gameId: gameId};
        var room = new Room(opts);
        RoomManagerService.getInstance().addRoom(room);
    }
};

prototype.loadFish = function() {
    var database = Database.getInstance();
    var fishConfig = FishConfig.getInstance();

    fishConfig.clear();

    //Doc file quy dao ca
    var fileData = fs.readFileSync(Consts.CONFIG_PATH.FISH_ORBIT, 'utf8');
    var orbitData = JSON.parse(fileData);
    for (var i = 0; i < orbitData.length; i++) {
        var oneOrbit = orbitData[i];
        fishConfig.addOrbit(oneOrbit);
    }

    //Doc file special_waves
    var specialWavesFileData = fs.readFileSync(Consts.CONFIG_PATH.SPECIAL_WAVES, 'utf8');
    var specialWavesData = JSON.parse(specialWavesFileData);
    for (var i = 0; i < specialWavesData.length; i++) {
        var oneWave = specialWavesData[i];
        fishConfig.addSpecialWave(oneWave);
    }
    //
    database.getAllFish(function(err, res){
        if (res) {
            for (var i = 0; i < res.length; i++) {
                fishConfig.addData(res[i]);
            }
        }
    });
};

prototype.loadItem = function() {
    var database = Database.getInstance();
    var itemConfig = ItemConfig.getInstance();

    itemConfig.reset();

    database.getAllItems(function(err, res) {
        for (var i = 0; i < res.length; i++) {
            itemConfig.addData(res[i]);
        }
    });
};

prototype.loadCardConfig = function() {
    var database = Database.getInstance();
    var gameConfig = GameConfig.getInstance();

    database.getCardTelco(function(err, res) {
        if (res) {
            var list = [];
            for (var i = 0; i < res.length; i++) {
                list.push(res[i].telco_code);
            }
            gameConfig.setCardTelco(list);
        }
    });

    database.getCardExchangeRate(function(err, res) {
        if (res) {
            gameConfig.setCardExchangeRate(res);
        }
    });
};

prototype.loadPartner = function() {
    var database = Database.getInstance();
    var gameConfig = GameConfig.getInstance();

    database.loadAllPartnerManager(function(err, res) {
        if (res) {
            var list = [];
            for (var i = 0; i < res.length; i++) {
                list.push(res[i].name);
            }
            gameConfig.setPartners(list);
        }
    });
};

prototype.reload = function(opts) {
    this.loadGameConfig();
    this.loadPopUp();
    this.loadFish();
    this.reloadQuickPlayRoom();
    this.loadItem();
    this.loadCardConfig();
    this.loadPartner();
    this.reloadSettingFreePlayRoom();
    this.loadEventManager();
};
