var Consts = require('../../consts/consts');

var Item = function(opts) {
    this.uid = opts.uid;
    this.type =  opts.item_id;
    this.name = opts.name;
    this.percent_appear = opts.percent_appear;
    this.time_sec_effect = opts.time_sec_effect;
    this.owner = opts.owner;
    this.timeStartCreated = -1;
    this.state = Consts.ITEM.STATE.WAIT;
};

module.exports = Item;

var prot = Item.prototype;

prot.isTimeOut = function() {
    if (this.state === Consts.ITEM.STATE.WAIT) {
        return false;
    }
    if (this.time_sec_effect === 0) {
        return false;
    }
    if (Date.now() - this.timeStartCreated > this.time_sec_effect * 1000) {
        return true;
    }
    return false;
};

prot.avtivate = function() {
    this.state = Consts.ITEM.STATE.ACTIVE;
    this.timeStartCreated = Date.now();
};