var CacheUserRequest = require('../common/cacheUserRequest.js');
var Consts = require('../../consts/consts.js');

var instance;

var RoomSettingManager = function() {
    this.settingMap = {};
    this.tableFeeMap = {}; //Chi ap dung voi ban cua che do choi thach dau, luu lai danh sach ban o muc cuoc do
    this.cacheUserRequest = new CacheUserRequest();
};

function getInstance () {
    if (!instance) {
        instance = new RoomSettingManager();
    }
    return instance;
};

module.exports = {
    getInstance : getInstance
};

RoomSettingManager.prototype.putSetting = function(gameId, name, roomSetting) {
    if (!this.settingMap[gameId]) {
        this.settingMap[gameId] = {};
    }
    this.settingMap[gameId][name] = roomSetting;
    if (gameId === Consts.GAME_TYPE.CHALLENGE) {
        var listTableName = this.tableFeeMap[roomSetting.getTableFee()];
        if (!listTableName) {
            listTableName = [];
            this.tableFeeMap[roomSetting.getTableFee()] = listTableName;
        }
        listTableName.push(roomSetting);
    }
};

RoomSettingManager.prototype.getSetting = function(gameId, name) {
    return this.settingMap[gameId][name];
};

RoomSettingManager.prototype.getByTableFee = function(fee) {
    return this.tableFeeMap[fee];
};

RoomSettingManager.prototype.getSettingMap = function(gameId) {
    return this.settingMap[gameId];
};