var utils = require('../../util/utils.js');
var UserFlag = require('../../lib/constants/userFlag');
var Consts = require('../../consts/consts');
var ParamsKey = require('../../lib/constants/paramsKey');

var Player = function(user) {
    this.user = user;
    this.name = user.getName();
    this.title = user.getProperty(UserFlag.TITLE);
    this.seat = 0;
    this.currentGun = 1;
    this.avatar = user.getProperty(UserFlag.AVATAR);
    this.state = 0;
    this.spectatorId = -1;
    this.moneyChange = 0;
    this.moneyBullet = 0;
    this.moneyFish = 0;
    this.isHost = false;
    this.usLevel = 1;
    this.usFisdDead = 0;
    this.lastTimeSendRequest = Date.now();
    this.items = [];
    this.currentMoneyChange = 0;
};

module.exports = Player;

var prop = Player.prototype;

Player.STATE_VIEWING = 0;
Player.STATE_PLAYING = 1;
Player.STATE_WAITING_PLAY = 2;
Player.STATE_WAITING_FINISH_MATCH = 3;

prop.getUser = function() {
    return this.user;
};

prop.getName = function() {
    return this.name;
};

prop.getTitle = function() {
    return this.title;
};

prop.getSeat = function() {
    return this.seat;
};

prop.setSeat = function(seat) {
    this.seat = seat;
};

prop.setCurrentGun = function(gunId) {
    this.currentGun = gunId;
};

prop.getCurrentGun = function() {
    return this.currentGun;
};

prop.getAvatar = function() {
    return this.avatar;
};

prop.getState = function() {
    return this.state;
};

prop.setState = function(state) {
    this.state = state;
};

prop.setSpectatorId = function(id) {
    this.spectatorId = id;
};

prop.getSpectatorId = function() {
    return this.spectatorId;
};

prop.getMoneyChange = function() {
    return this.moneyChange;
};

prop.updatemoneyChange = function(change) {
    this.moneyChange += change;
};

prop.resetMoneyChange = function() {
    this.moneyChange = 0;
};

prop.isHostOfRoom = function() {
    return this.isHost;
};

prop.setIsHot = function(host) {
    this.isHost = host;
};

prop.getMoney = function() {
    return Number(this.user.getProperty(UserFlag.MONEY));
};

prop.addMoney = function(m, reason) {
    this.user.addMoney(m);
    this.updatemoneyChange(m);
    this.addCurrentMoneyChange(m);
    if (reason) {
        if (reason === Consts.PLAYER.MONEY_CHANGE_TYPE.BULLET_FIRE) {
            this.moneyBullet += Math.abs(m);
        }
        if (reason === Consts.PLAYER.MONEY_CHANGE_TYPE.FISH_DEAD) {
            this.moneyFish += Math.abs(m);
        }
    }
    //console.log("Player money : " + this.getMoney() + ", current money change : " + this.getCurrentMoneyChange());
};

prop.setUsLevel = function(lv) {
    this.usLevel = lv;
    this.user.setProperty(UserFlag.LEVEL, lv);
};

prop.getUsLevel = function() {
    return this.usLevel;
};

prop.setUsFishDead = function(no) {
    this.usFisdDead = no;
};

prop.getUsFishDead = function() {
    return this.usFisdDead;
}

prop.setCurrentMoneyChange = function(m) {
    this.currentMoneyChange = m;
};

prop.addCurrentMoneyChange = function(m){
    this.currentMoneyChange += m;
};

prop.getCurrentMoneyChange = function() {
    return this.currentMoneyChange;
};

prop.addItems = function(item) {
    this.items.push(item);
};

prop.removeItem = function(itemUid) {
    for (var i = 0; i < this.items.length; i++) {
        if (this.items[i].uid === itemUid) {
            this.items.splice(i, 1);
        }
    }
};

prop.clearItem = function() {
    if (this.items.length > 0) {
        this.items.splice(0, this.items.length - 1);
    }
};

prop.getItem = function(itemUid) {
    var item = null;
    for (var i = 0; i < this.items.length; i++) {
        if (this.items[i].uid === itemUid) {
            item = this.items[i];
        }
    }
    return item;
};

prop.getPartner = function() {
    return this.user.getProperty(UserFlag.PARTNER_ID);
};

prop.isBot = function() {
    return this.user.getProperty(UserFlag.IS_BOT) === 1;
};

prop.isTimeOutRequest = function() {
    if (!this.user || Date.now() - this.lastTimeSendRequest >= Consts.PLAYER.TIME_OUT_REQUEST) {
        return true;
    } else {
        return false;
    }
};

prop.toObj = function() {
    var obj = {};
    obj[ParamsKey.NAME] = this.name;
    obj[ParamsKey.TITLE] = this.title;
    obj[ParamsKey.SEAT] = this.seat;
    obj[ParamsKey.GUN_ID] = this.currentGun;
    obj[ParamsKey.AVATAR] = this.avatar;
    obj[ParamsKey.MONEY] = this.getMoney();
    obj[ParamsKey.IS_HOST] = this.isHost;
    if (this.usLevel > 0) {
        obj[ParamsKey.LEVEL] = this.usLevel;
    } else {
        obj[ParamsKey.LEVEL] = 1;
    }
    obj[ParamsKey.PLAYER_STATE] = this.getState();
    return obj;
};

prop.clone = function() {
    return utils.clone(this);
};

prop.reset = function() {
    this.seat = 0;
    this.state = 0;
    this.spectatorId = -1;
    this.moneyChange = 0;
    this.moneyBullet = 0;
    this.moneyFish = 0;
    this.isHost = false;
    this.currentMoneyChange = 0;
};