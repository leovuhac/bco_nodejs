var Consts = require('../../consts/consts');

var Bullet = function(opts) {
    this.uid = opts.uid;
    this.speed = opts.speed;
    this.coin = opts.coin;
    this.owner = opts.owner; //Ten cua user ban dan
    this.timeout = opts.timeout || Consts.BULLET_TIME_OUT_IN_GAME;
    this.timeCreated = Date.now();
    this.bonusPercentOneHit = opts.bonusPercentOneHit || 0; //Ti le ban ca thanh cong sau 1 lan ban duoc cong them. VD : 20%
    this.bonusCoin = opts.bonusCoin || 0; //Ti le cong them diem khi an item. VD : 20%
};

module.exports = Bullet;

var prot = Bullet.prototype;

prot.isTimeOut = function() {
    if (Date.now() - this.timeCreated > this.timeout) {
        return true;
    }
    return false;
};
