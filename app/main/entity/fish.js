var Consts = require('../../consts/consts');
var Position = require('./position');
var ParamsKey = require('../../lib/constants/paramsKey');

var Fish = function(opts) {
    this.uid = opts.uid; //id cua ca khi duoc sinh ra, moi con co 1 id duy nhat
    //Thong tin tu config truyen vao
    this.fishTypeId = opts.code; //Loai ca
    this.name = opts.name;
    this.orbitId = opts.orbitId;
    //this.orbit = opts.orbit; //mang [] cac point
    this.orbitLength = opts.orbitLength;
    this.min_speed = opts.min_speed;
    this.max_speed = opts.max_speed;
    this.prize_min = opts.prize_min;
    this.prize_max = opts.prize_max;
    this.dead_percent_on_hit = opts.dead_percent_on_hit;
    this.maxHp  = opts.hp;
    this.timeout = opts.timeout || Consts.FISH_TIME_OUT_IN_GAME;
    this.startOffsetX = opts.start_offset_x || 0;
    this.startOffsetY = opts.start_offset_y || 0;
    this.startOffsetTime = opts.start_offset_time || 0;
    this.startDirect = opts.start_direct || 0;
    //this.position = new Position();
    this.currentOrbitPoint = 0;
    //Thong tin khac
    this.hp = this.maxHp;
    this.prize = this.prize_min;
    this.speed = this.min_speed;
    this.timeCreated = /*Date.now()*/-1;
};

module.exports = Fish;

var prot = Fish.prototype;

prot.setPrize = function(price) {
    this.prize = price;
};

prot.getPrize = function() {
    return this.prize;
};

prot.setSpeed = function(sp) {
    this.speed = sp;
};

prot.getSpeed = function() {
    return this.speed;
};

prot.setHp = function(hp) {
    this.hp = hp;
};

prot.getHp = function() {
    return this.hp;
};

prot.addHp = function(delta) {
    this.hp += delta;
    if (this.hp === 0) {
        this.hp = 0;
    }
};

prot.move = function() {
    if (Date.now() - this.timeCreated >= this.startOffsetTime * 1000) {
        var step = Math.floor(Consts.GAME_TIMER_INTERVAL / Consts.CLIENT_GAME_LOOP_DELAY);
        if (this.currentOrbitPoint < this.orbitLength - 1) {
            this.currentOrbitPoint += step;
            if (this.currentOrbitPoint > this.orbitLength - 1) {
                this.currentOrbitPoint = this.orbitLength - 1;
            }
            //this.position = this.orbit[this.currentOrbitPoint];
        }
    }
};

prot.isTimeOut = function() {
    //if (this.timeCreated <= 0) {
    //    return false;
    //}
    //if (Date.now() - this.timeCreated > this.timeout) {
    //    return true;
    //}
    return false;
};

prot.isEndOrbit = function() {
    return this.currentOrbitPoint === (this.orbitLength - 1);
};

prot.toObj = function() {
    var obj = {};
    obj[ParamsKey.UID] = this.uid;
    obj[ParamsKey.TYPE] = this.fishTypeId;
    //obj[ParamsKey.NAME] = this.name;
    obj[ParamsKey.ORBIT] = {id : this.orbitId, point_index : this.currentOrbitPoint};
    //obj[ParamsKey.SPEED] = this.speed;
    if (this.startOffsetX && this.startOffsetX !== 0) {
        obj[ParamsKey.OFFSET_X] = this.startOffsetX;
    }
    if (this.startOffsetY && this.startOffsetY !== 0) {
        obj[ParamsKey.OFFSET_Y] = this.startOffsetY;
    }
    if (this.startOffsetTime && this.startOffsetTime !== 0) {
        obj[ParamsKey.OFFSET_TIME] = this.startOffsetTime;
    }
    if (this.timeCreated <= 0) {
        obj[ParamsKey.TIME_LIFE] = 0;
    } else {
        obj[ParamsKey.TIME_LIFE] = Date.now() - this.timeCreated;
    }
    if (this.startDirect && this.startDirect >= 0) {
        obj[ParamsKey.START_DIRECT] = this.startDirect;
    }
    if (this.getHp()) {
        obj['hp'] = this.getHp();
    }
    return obj;
};

