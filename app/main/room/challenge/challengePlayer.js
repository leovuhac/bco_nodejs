var Player = require('../player.js');
var util = require('util');

var ChallengePlayer = function(user) {
    ChallengePlayer.super_.call(this, user);
    this.usChallengeWin = 0;
    this.usChallengeLost = 0;
    this.usChallengeMoneyWin = 0;
    this.usChallengeMoneyLost = 0;
    this.challengeMoney = 0;
    this.initBullet = 0;
};

module.exports = ChallengePlayer;

util.inherits(ChallengePlayer, Player);

var prot = ChallengePlayer.prototype;

prot.setUsChallengeWin = function(t) {
    this.usChallengeWin = t;
};

prot.getUsChallengeWin = function() {
    return this.usChallengeWin;
};

prot.setUsChallengeLost = function(t) {
    this.usChallengeLost = t;
};

prot.getUsChallengeLost = function() {
    return this.usChallengeLost;
};

prot.setUsChallengeMoneyWin = function(t) {
    this.usChallengeMoneyWin = t;
};

prot.getUsChallengeMoneyWin = function() {
    return this.usChallengeMoneyWin;
};

prot.setUsChallengeMoneyLost = function(t) {
    this.usChallengeMoneyLost = t;
};

prot.getUsChallengeMoneyLost = function() {
    return this.usChallengeMoneyLost;
};

prot.setChallengeMoney = function(t) {
    this.challengeMoney = t;
};

prot.getChallengeMoney = function() {
    return this.challengeMoney;
};

prot.addChallengeMoney = function(delta) {
    this.challengeMoney += delta;
    if (this.challengeMoney < 0) {
        this.challengeMoney = 0;
    }
};

prot.setInitBullet = function(initBullet) {
    this.initBullet = initBullet;
};

prot.getInitBullet = function() {
    return this.initBullet;
};

prot.addInitBullet = function(delta) {
    this.initBullet += delta;
    if (this.initBullet < 0) {
        this.initBullet = 0;
    }
};

prot.isTimeOutRequest = function() {
    if (Date.now() - this.lastTimeSendRequest >= 2 * 60 * 1000) {
        return true;
    } else {
        return false;
    }
};