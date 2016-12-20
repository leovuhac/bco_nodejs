var FishPointCalculator = require('./fishPointCalculator');

/**
 * Cá chết cân nhắc với tỉ lệ thắng thua của máy
 */

var FishDeadMachineWinLostRule = function() {

};

module.exports = FishDeadMachineWinLostRule;

var prot = FishDeadMachineWinLostRule.prototype;

prot.validate = function(typeDead, fish, bullet, player, machine_win_ratio, machine_lost_ratio, machine_win_money, machine_lost_money) {
    var minimizePoint = fish.prize_min * bullet.coin;
    var randomPoint = FishPointCalculator.getInstance().calculatePoint(typeDead, fish.prize_min, fish.prize_max, bullet.coin);
    //Truong hop player su dung item tang % diem an duoc thi tinh them
    var point = Math.floor(randomPoint + randomPoint * bullet.bonusCoin / 100);
    var new_machine_lost_money = point + machine_lost_money;
    if (this.validateMoneyMachineLost(machine_win_ratio, machine_lost_ratio, machine_win_money, new_machine_lost_money)) {
        return point;
    } else {
        point = minimizePoint;
        new_machine_lost_money = point + machine_lost_money;
        if (this.validateMoneyMachineLost(machine_win_ratio, machine_lost_ratio, machine_win_money, new_machine_lost_money)) {
            return point;
        } else {
            return 0;
        }
    }
    return 0;
};

prot.validateMoneyMachineLost = function(machine_win_ratio, machine_lost_ratio, machine_win_money, new_machine_lost_money) {
    //console.log("==== validateMoneyMachineLost : " + machine_win_ratio + ", " + machine_lost_ratio + ", " + machine_win_money
    //    + ", " + new_machine_lost_money + ", machine_win_money / new_machine_lost_money : " + machine_win_money / new_machine_lost_money
    //    + ", machine_win_ratio / machine_lost_ratio : " + machine_win_ratio / machine_lost_ratio );
    if ((machine_win_money / new_machine_lost_money) < (machine_win_ratio / machine_lost_ratio)) {
        return false;
    } else {
        return true;
    }
};