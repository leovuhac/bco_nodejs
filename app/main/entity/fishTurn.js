var Consts = require('../../consts/consts');
var FishGenerator = require('./fishGenerator');
var FishGeneratorCL = require('./fishGeneratorCL');
var FishConfig = require('./fishConfig');
var Fish = require('./fish');
var utils = require('../../util/utils');

var FishTurn = function(opts) {
    this.type = opts.type || Consts.FISH_TURN.TYPE.NORMAL;
    this.maxFish = opts.maxFish || Consts.FISH_TURN.MAX_FISH;
    this.fishQueue = [];
    this.tempFishPlanted = [];
    this.isPlantAllFish = false;
};

module.exports = FishTurn;

var prot = FishTurn.prototype;

prot.generateFish = function(inputData) {
    if (this.type === Consts.FISH_TURN.TYPE.NORMAL) {
        if (this.fishQueue.length > 0) {
            this.fishQueue.splice(0, this.fishQueue.length);
        }
        if (this.tempFishPlanted.length > 0) {
            this.tempFishPlanted.splice(0, this.tempFishPlanted.length);
        }
        this.generateFishNormal(inputData);
    } else {
        var t = utils.random(FishConfig.getInstance().listSpecialWaveIds.length);
        var randomWaveId = FishConfig.getInstance().listSpecialWaveIds[t];
        if (!inputData) {
            inputData = {};
        }
        if (!inputData.hasOwnProperty("wave_id")) {
            inputData["wave_id"] = randomWaveId;
        }
        this.generateFishSpecial(inputData);
    }
};

prot.generateFishNormal = function(inputData) {
    //Sinh cá trong turn, dua vào inputData de sinh ra
    if (!inputData) {
        inputData = {totalFish : this.maxFish};
    }
    var arrIdFish = FishGenerator.getInstance().generateFish(inputData);
    if (inputData.game_id === Consts.GAME_TYPE.CHALLENGE) {
        arrIdFish = FishGeneratorCL.getInstance().generateFish(inputData);
    }
    var tempOrbitAvoidSame = [];
    for (var i = 0; i < arrIdFish.length; i++) {
        try {
            var fish = {};
            var opts = {};
            var fishCode = arrIdFish[i];
            var fishData = FishConfig.getInstance().getDataFish(fishCode);
            ////Random orbit cua ca
            var orbitConfigArr = fishData.orbit; //Mang chua orbit id cua ca
            //var indexRandom = utils.random(orbitConfigArr.length);
            //var orbitPoints = FishConfig.getInstance().getOrbit(orbitConfigArr[indexRandom])['points'];
            var orbitId = this.randomFishOrbit(orbitConfigArr, tempOrbitAvoidSame);
            //opts.orbit = FishConfig.getInstance().getOrbit(orbitId)['points'];
            opts.orbitLength = FishConfig.getInstance().getOrbit(orbitId)['points'].length;
            opts.orbitId = /*orbitConfigArr[indexRandom]*/orbitId;
            ////
            opts.uid = fishCode + '-' + Date.now() + '-' + i;
            opts.code = fishCode;
            opts.name = fishData.name;
            opts.min_speed = fishData.min_speed;
            opts.max_speed = fishData.max_speed;
            opts.prize_min = fishData.prize_min;
            opts.prize_max = fishData.prize_max;
            opts.dead_percent_on_hit = fishData.dead_percent_on_hit;
            opts.hp = fishData.hp;
            var fish = new Fish(opts);
            this.fishQueue.push(fish);
        } catch (e) {}
    }
    arrIdFish = null;
};

prot.generateFishSpecial = function(inputData) {
    var waveId = inputData.wave_id;
    var waveData = FishConfig.getInstance().getSpecialWave(waveId);
    var fishArr = waveData.fish_list;
    for (var i = 0; i < fishArr.length; i++) {
        var fish = {};
        var opts = {};
        var fishCode = fishArr[i].type;
        var fishData = FishConfig.getInstance().getDataFish(fishCode);
        if (fishData) {
            var orbitId = fishArr[i].orbit_id;
            var start_offset_x = fishArr[i].start_offset_x;
            var start_offset_y = fishArr[i].start_offset_y;
            var start_offset_time = fishArr[i].start_offset_time;
            var start_direct = fishArr[i].start_direct;
            //
            //opts.orbit = FishConfig.getInstance().getOrbit(orbitId)['points'];
            opts.orbitLength = FishConfig.getInstance().getOrbit(orbitId)['points'].length;
            opts.orbitId = orbitId;
            opts.uid = fishCode + '-' + Date.now() + '-' + i;
            opts.code = fishCode;
            opts.name = fishData.name;
            opts.min_speed = fishData.min_speed;
            opts.max_speed = fishData.max_speed;
            opts.prize_min = fishData.prize_min;
            opts.prize_max = fishData.prize_max;
            opts.dead_percent_on_hit = fishData.dead_percent_on_hit;
            opts.start_offset_x = start_offset_x;
            opts.start_offset_y = start_offset_y;
            opts.start_offset_time = start_offset_time;
            opts.start_direct = start_direct;
            opts.hp = fishData.hp;
            var fish = new Fish(opts);
            this.fishQueue.push(fish);
        }
    }
};

prot.plantFish = function() {
    if (this.type === Consts.FISH_TURN.TYPE.NORMAL) {
        return this.plantFishNormal();
    } else {
        return this.plantFishSpecial();
    }
};

/**
 * Tha cá tu queue cua turn -> ra màn hình choi game
 */
prot.plantFishNormal = function() {
    if (this.isOutOfFish()) {
        this.isPlantAllFish = true;
        return null;
    }
    var countLoop = 0;
    //if (this.tempFishPlanted.length >= 35) {
    //    this.tempFishPlanted.splice(0, this.tempFishPlanted.length);
    //}
    var indexFishInQueue = 0;
    var fish = this.fishQueue[0];
    while (!this.fishInPlantedList(fish)) {
        var indexFishInQueue = utils.random(this.fishQueue.length);
        fish = this.fishQueue[indexFishInQueue];
        countLoop++;
        if (countLoop > 5) {
            countLoop = 0;
            break;
        }
    }
    this.fishQueue.splice(indexFishInQueue, 1);
    fish.timeCreated = Date.now();
    //this.tempFishPlanted.push(fish);
    return fish;
};

prot.plantFishSpecial = function() {
    if (this.fishQueue.length === 0) {
        return null;
    }
    var fishList = [];
    for (var i = 0; i < this.fishQueue.length; i++) {
        var fish = this.fishQueue[i];
        fish.timeCreated = Date.now();
        fishList.push(fish);
    }
    this.fishQueue.splice(0, this.fishQueue.length);
    this.isPlantAllFish = true;
    return fishList;
};

/**
 * Turn da het ca
 */
prot.isOutOfFish = function() {
    return this.fishQueue.length === 0;
};

prot.randomFishOrbit = function(orbitConfigArr, tempOrbitAvoidSame) {
    var countLoop = 0;
    if (tempOrbitAvoidSame.length > 35) {
        tempOrbitAvoidSame.splice(0, tempOrbitAvoidSame.length);
    }
    var indexRandom = utils.random(orbitConfigArr.length);
    var orbitId = orbitConfigArr[indexRandom];
    while(tempOrbitAvoidSame.indexOf(orbitId) === -1) {
        var indexRandom = utils.random(orbitConfigArr.length);
        orbitId = orbitConfigArr[indexRandom];
        countLoop++;
        if (countLoop > 50) {
            countLoop = 0;
            break;
        }
    }
    tempOrbitAvoidSame.push(orbitId);
    return orbitId;
};

prot.fishInPlantedList = function(fish) {
    for (var i = 0; i < this.tempFishPlanted.length; i++) {
        var tempFish = this.tempFishPlanted[i];
        if (tempFish.fishTypeId === fish.fishTypeId && tempFish.orbitId === fish.orbitId) {
            return true;
        }
    }
    return false;
};
