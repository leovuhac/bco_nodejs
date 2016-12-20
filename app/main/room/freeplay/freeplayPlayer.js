var Player = require('../player.js');
var util = require('util');
var UserFlag = require('../../../lib/constants/userFlag');
var Consts = require('../../../consts/consts');
var ParamsKey = require('../../../lib/constants/paramsKey');

var FreeplayPlayer = function(user) {
    FreeplayPlayer.super_.call(this, user);
    this.percentBonusCoin = 0;
    this.currentGoldChange = 0;
    this.goldChange = 0;
    this.goldBullet = 0;
    this.goldFish = 0;
};

module.exports = FreeplayPlayer;

util.inherits(FreeplayPlayer, Player);

var prot = FreeplayPlayer.prototype;

prot.setPercentBonusCoin = function(percentBonus) {
    this.percentBonusCoin = percentBonus;
};

prot.getPercentBonusCoin = function() {
    return this.percentBonusCoin;
};

prot.setCurrentGoldChange = function(m) {
    this.currentGoldChange = m;
};

prot.addCurrentGoldChange = function(m){
    this.currentGoldChange += m;
};

prot.getCurrentGoldChange = function() {
    return this.currentGoldChange;
};

prot.getGold = function() {
    return Number(this.user.getProperty(UserFlag.GOLD));
};

prot.getGoldChange = function() {
    return this.goldChange;
};

prot.updategoldChange = function(change) {
    this.goldChange += change;
};

prot.addGold = function(m, reason) {
    this.user.addGold(m);
    this.updategoldChange(m);
    this.addCurrentGoldChange(m);
    if (reason) {
        if (reason === Consts.PLAYER.MONEY_CHANGE_TYPE.BULLET_FIRE) {
            this.goldBullet += Math.abs(m);
        }
        if (reason === Consts.PLAYER.MONEY_CHANGE_TYPE.FISH_DEAD) {
            this.goldFish += Math.abs(m);
        }
    }
};

prot.toObj = function() {
    var obj = {};
    obj[ParamsKey.NAME] = this.name;
    obj[ParamsKey.TITLE] = this.title;
    obj[ParamsKey.SEAT] = this.seat;
    obj[ParamsKey.GUN_ID] = this.currentGun;
    obj[ParamsKey.AVATAR] = this.avatar;
    obj[ParamsKey.MONEY] = this.getMoney();
    obj[ParamsKey.GOLD] = this.getGold();
    obj[ParamsKey.IS_HOST] = this.isHost;
    obj[ParamsKey.LEVEL] = this.usLevel;
    obj[ParamsKey.PLAYER_STATE] = this.getState();
    return obj;
};

prot.reset = function() {
    this.seat = 0;
    this.state = 0;
    this.spectatorId = -1;
    this.moneyChange = 0;
    this.goldChange = 0;
    this.moneyBullet = 0;
    this.moneyFish = 0;
    this.goldBullet = 0;
    this.goldFish = 0;
    this.isHost = false;
    this.currentMoneyChange = 0;
    this.currentGoldChange = 0;
};


