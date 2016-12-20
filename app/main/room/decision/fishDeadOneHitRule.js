var FishConfig = require('../../entity/fishConfig');
var utils = require('../../../util/utils');
/**
 * Cá chết sau 1 phát đạn
 */
var FishDeadOneHitRule = function() {

};

module.exports = FishDeadOneHitRule;

var prot = FishDeadOneHitRule.prototype;

prot.validate = function(fish, bullet, player) {
    var fishPercentOneHitDead = 100 * (1 / fish.dead_percent_on_hit + bullet.bonusPercentOneHit / 100);
    var t = utils.random(100);
    if (t < fishPercentOneHitDead) {
        return true;
    } else {
        return false;
    }
};

