var pomelo = require('pomelo');
var Database = require('../../lib/database/database');
var GameConfig = require('../../lib/config/gameConfig');
var UserFlag = require('../../lib/constants/userFlag');
var Consts = require('../../consts/consts');

var LogCCUTask = function(opts) {
    this.interval = opts.interval || 5 * 60 * 1000;
};

module.exports = LogCCUTask;

var prototype = LogCCUTask.prototype;

prototype.run = function() {
    this.interval = setInterval(this.tick.bind(this), this.interval);
};

prototype.close = function () {
    clearInterval(this.interval);
};

prototype.tick = function() {
    var userManagerService = pomelo.app.get('userManagerService');
    var db = Database.getInstance();
    var gameConfig = GameConfig.getInstance();

    var listUserOnline = userManagerService.getAllUsers();
    var mapCCU = {};
    var mapGameCCU = {};
    mapGameCCU[Consts.GAME_TYPE.QUICK_PLAY] = 0;
    mapGameCCU[Consts.GAME_TYPE.CHALLENGE] = 0;
    mapGameCCU[Consts.GAME_TYPE.FREE_PLAY] = 0;
    for (var k in listUserOnline) {
        var user = listUserOnline[k];
        if (user) {
            var partner = user.getProperty(UserFlag.PARTNER_ID);
            var platform = user.getProperty(UserFlag.PLATFORM);
            var gameType = user.getProperty(UserFlag.GAME_ID);
            if (platform && partner && gameType) {
                if (!mapCCU[partner]) {
                    mapCCU[partner] = {};
                }
                if (!mapCCU[partner][platform]) {
                    mapCCU[partner][platform] = 0;
                }
                if (!mapGameCCU[gameType]) {
                    mapGameCCU[gameType] = 0;
                }
                mapCCU[partner][platform] += 1;
                mapGameCCU[gameType] += 1;
            }
        }
    }
    for (var k in mapCCU) {
        var partner = k;
        var ccuPartner = mapCCU[k];
        for (var t in ccuPartner) {
            var platform = t;
            var ccu = ccuPartner[t];
            db.logCCU(partner, platform, ccu);
        }
    }
    for (var k in mapGameCCU) {
        var gameType = k;
        if (gameType >= 0) {
            var ccu = mapGameCCU[k];
            db.logCCUGame(ccu, gameType);
        }
    }
};
