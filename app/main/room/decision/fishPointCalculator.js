var Consts = require('../../../consts/consts');
var utils = require('../../../util/utils');

var instance;
/**
 * Cá chết được bao nhiêu điểm
 */
var FishPointCalculator = function() {

};

function getInstance () {
    if (!instance) {
        instance = new FishPointCalculator();
    }
    return instance;
};

module.exports = {
    getInstance : getInstance
};

var prot = FishPointCalculator.prototype;

prot.calculatePoint = function(type, fish_min_prize, fish_max_prize, bullet_point) {
    var point = 0;
    if (type === Consts.FISH_DEAD_TYPE.ONE_HIT) {
        point = bullet_point * fish_min_prize;
    } else if (type === Consts.FISH_DEAD_TYPE.MUCH_HIT) {
        point = utils.randomBetween(bullet_point * fish_min_prize, bullet_point * fish_max_prize);
    }
    return point;
};