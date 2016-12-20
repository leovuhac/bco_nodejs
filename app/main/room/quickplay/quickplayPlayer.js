var Player = require('../player.js');
var util = require('util');

var QuickplayPlayer = function(user) {
    QuickplayPlayer.super_.call(this, user);
    this.usQuickplayMoneyWin = 0;
    this.usQuickplayMoneyLost = 0;
    this.usFishMammonMoney = 0;
    this.lastTimeUpdateMoneyDb = Date.now();
    this.percentBonusCoin = 0;
    //Info for event
    this.tempMoneyBulletOnTarget = 0; //Player cu ban dan la cong vao, khi ban trung dan thi tru di
    this.tempMoneyBulletMiss = 0; //Player cu ban trung la cong vao
    this.tempMoneyBulletMammonFish = 0; //Player ban ca than tai
};

module.exports = QuickplayPlayer;

util.inherits(QuickplayPlayer, Player);

var prot = QuickplayPlayer.prototype;

prot.setUsQuickplayMoneyWin = function(t) {
    this.usQuickplayMoneyWin = t;
};

prot.getUsQuickplayMoneyWin = function() {
    return this.usQuickplayMoneyWin;
};

prot.setUsQuickplayMoneyLost = function(t) {
    this.usQuickplayMoneyLost = t;
};

prot.getUsQuickplayMoneyLost = function() {
    return this.usQuickplayMoneyLost;
};

prot.setUsFishMammonMoney = function(t) {
    this.usFishMammonMoney = t;
};

prot.getUsFishMammonMoney = function() {
    return this.usFishMammonMoney;
};

prot.resetLastTimeUpdateMoneyDb = function() {
    this.lastTimeUpdateMoneyDb = Date.now();
};

prot.setPercentBonusCoin = function(percentBonus) {
    this.percentBonusCoin = percentBonus;
};

prot.getPercentBonusCoin = function() {
    return this.percentBonusCoin;
};