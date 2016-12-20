/**
 * Cá chết sau nhieu phat dan
 */
var FishDeadHpRule = function() {

};

module.exports = FishDeadHpRule;

var prot = FishDeadHpRule.prototype;

prot.validate = function(fish) {
    if (!fish) {
        return false;
    }
    if (fish.getHp() <= 0) {
        return true;
    } else {
        return false;
    }
};