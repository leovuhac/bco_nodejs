var FishDeadHpRule = require('./fishDeadHpRule');
var FishDeadOneHitRule = require('./fishDeadOneHitRule');
var FishDeadMachineWinLostRule = require('./fishDeadMachineWinLostRule');
var Consts = require('../../../consts/consts');
var FishPointCalculator = require('./fishPointCalculator');
/**
 * Cá có chết hay không
 */

var FishDeadDecision = function() {
    //1 phat chet ngay
    this.deadOneHitRule = new FishDeadOneHitRule();
    //Tinh theo hp
    this.deadHpRule = new FishDeadHpRule();
    //Tinh ti le an thua cua may
    this.deadMachineWinLostRule = new FishDeadMachineWinLostRule();
};

module.exports = FishDeadDecision;

var prot = FishDeadDecision.prototype;

prot.validateFishDead = function(fish, bullet, player, extras) {
    var machine_win_ratio = extras.machine_win_ratio;
    var machine_lost_ratio = extras.machine_lost_ratio;
    var machine_win_money = extras.machine_win_money;
    var machine_lost_money = extras.machine_lost_money;
    var useMachineWinLostRule = extras.use_machine_win_lost_rule || true;
    var game_type = extras.game_type || Consts.GAME_TYPE.QUICK_PLAY;
    //console.log("==================================================");
    //console.log("===== VALIDATE FISH DEAD fish : " + fish.fishTypeId  + ", name : " + fish.name + ", dead_percent_onehit : " + fish.dead_percent_on_hit);
    var result = {dead : false, money : 0};
    var fishDeadType = -1;
    var moneyEarned = 0;
    if (game_type === Consts.GAME_TYPE.FREE_PLAY || game_type === Consts.GAME_TYPE.QUICK_PLAY) {
        if (this.deadOneHitRule.validate(fish, bullet, player)) {
            fishDeadType = Consts.FISH_DEAD_TYPE.ONE_HIT;
        } else if (this.deadHpRule.validate(fish)) {
            fishDeadType = Consts.FISH_DEAD_TYPE.MUCH_HIT;
        }
    } else {
        if (this.deadHpRule.validate(fish)) {
            fishDeadType = Consts.FISH_DEAD_TYPE.MUCH_HIT;
        }
    }
    //console.log("===== VALIDATE FISH DEAD fishDeadType : " + fishDeadType);
    if (useMachineWinLostRule) {
        if (fishDeadType >= 0) {
            moneyEarned = this.deadMachineWinLostRule.validate(fishDeadType, fish, bullet, player, machine_win_ratio,
                machine_lost_ratio, machine_win_money, machine_lost_money);
            //console.log("===== VALIDATE FISH DEAD moneyEarned : " + moneyEarned);
            if (moneyEarned > 0) {
                result.dead = true;
                result.money = moneyEarned;
            }
        }
    } else {
        if (fishDeadType >= 0) {
            var randomPoint = FishPointCalculator.getInstance().calculatePoint(fishDeadType, fish.prize_min, fish.prize_max, bullet.coin);
            //Truong hop player su dung item tang % diem an duoc thi tinh them
            var point = Math.floor(randomPoint + randomPoint * bullet.bonusCoin / 100);
            result.dead = true;
            result.money = point;
        }
    }
    return result;
};

prot.validateFishDeadByItem = function(fishes, item, player, extras) {
    var machine_win_ratio = extras.machine_win_ratio;
    var machine_lost_ratio = extras.machine_lost_ratio;
    var machine_win_money = extras.machine_win_money;
    var machine_lost_money = extras.machine_lost_money;
    var result = {money : 0, fish_list : []};
    var listFishDead = [];
    var totalMoney = 0;
    if (item.type === Consts.ITEM.TYPE.BOMBER) {
        for (var i = 0; i < fishes.length; i++) {
            var oneFish = fishes[i];
            if (oneFish.fishTypeId <= 10) {
                //Nho hon ca duoi thi chet tat ca
                var obj = {fish_id : oneFish.uid, money : oneFish.prize_min};
                listFishDead.push(obj);
                machine_lost_money += oneFish.prize_min;
                totalMoney += oneFish.prize_min;
            } else {
                //Neu la tien ca, ca voi, ca than tai thi phai xem xet
                var point = oneFish.prize_min;
                var new_machine_lost_money = machine_lost_money + point;
                if (this.validateMoneyMachineLost(machine_win_ratio, machine_lost_ratio, machine_win_money, new_machine_lost_money)) {
                    var obj = {fish_id : oneFish.uid, money : oneFish.prize_min};
                    listFishDead.push(obj);
                    machine_lost_money += oneFish.prize_min;
                    totalMoney += oneFish.prize_min;
                } else {
                    var obj = {fish_id : oneFish.uid, money : 0};
                    listFishDead.push(obj);
                }
            }
        }
    } else if (item.type === Consts.ITEM.TYPE.ELECTRO_NET) {
        for (var i = 0; i < fishes.length; i++) {
            var oneFish = fishes[i];
            var point = oneFish.prize_min;
            var new_machine_lost_money = machine_lost_money + point;
            if (this.validateMoneyMachineLost(machine_win_ratio, machine_lost_ratio, machine_win_money, new_machine_lost_money)) {
                var obj = {fish_id : oneFish.uid, money : oneFish.prize_min};
                listFishDead.push(obj);
                machine_lost_money += oneFish.prize_min;
                totalMoney += oneFish.prize_min;
            }
        }
    } else if (item.type === Consts.ITEM.TYPE.MERMAID_TRAP) {
        for (var i = 0; i < fishes.length; i++) {
            var oneFish = fishes[i];
            var obj = {fish_id : oneFish.uid, money : oneFish.prize_min};
            listFishDead.push(obj);
            totalMoney += oneFish.prize_min;
        }
    } else if (item.type === Consts.ITEM.TYPE.LASER) {
        for (var i = 0; i < fishes.length; i++) {
            var oneFish = fishes[i];
            if (oneFish.fishTypeId <= 10) {
                //Nho hon ca duoi thi chet tat ca
                var obj = {fish_id : oneFish.uid, money : oneFish.prize_min};
                listFishDead.push(obj);
                machine_lost_money += oneFish.prize_min;
                totalMoney += oneFish.prize_min;
            } else {
                //Neu la tien ca, ca voi, ca than tai thi phai xem xet
                var point = oneFish.prize_min;
                var new_machine_lost_money = machine_lost_money + point;
                if (this.validateMoneyMachineLost(machine_win_ratio, machine_lost_ratio, machine_win_money, new_machine_lost_money)) {
                    var obj = {fish_id : oneFish.uid,
                        money : oneFish.prize_min};
                    listFishDead.push(obj);
                    machine_lost_money += oneFish.prize_min;
                    totalMoney += oneFish.prize_min;
                } else {
                    var obj = {fish_id : oneFish.uid, money : 0};
                    listFishDead.push(obj);
                }
            }
        }
    } else if (item.type === Consts.ITEM.TYPE.TORPEDO) {
        for (var i = 0; i < fishes.length; i++) {
            var oneFish = fishes[i];
            if (oneFish.fishTypeId <= 10) {
                //Nho hon ca duoi thi chet tat ca
                var obj = {fish_id : oneFish.uid,
                    money : oneFish.prize_min};
                listFishDead.push(obj);
                machine_lost_money += oneFish.prize_min;
                totalMoney += oneFish.prize_min;
            } else {
                //Neu la tien ca, ca voi, ca than tai thi phai xem xet
                var point = oneFish.prize_min;
                var new_machine_lost_money = machine_lost_money + point;
                if (this.validateMoneyMachineLost(machine_win_ratio, machine_lost_ratio, machine_win_money, new_machine_lost_money)) {
                    var obj = {fish_id : oneFish.uid,
                        money : oneFish.prize_min};
                    listFishDead.push(obj);
                    machine_lost_money += point;
                    totalMoney += oneFish.prize_min;
                }
            }
        }
    }
    result = {money : totalMoney, fish_list : listFishDead};
    return result;
};

prot.validateMoneyMachineLost = function(machine_win_ratio, machine_lost_ratio, machine_win_money, new_machine_lost_money) {
    if ((machine_win_money / new_machine_lost_money) < (machine_win_ratio / machine_lost_ratio)) {
        return false;
    } else {
        return true;
    }
};
