var Consts = require('../../consts/consts.js');
var ParamsKey = require('../../lib/constants/paramsKey');

var Popup = function() {
    this.id = 1;
    this.title = '';
    this.content = '';
    this.time_start = null;
    this.time_end = null;
    this.state = 1;
    this.type = Consts.POPUP_TYPE.POPUP_BOARD;
    this.extras = {};
};

module.exports = Popup;

var prototype = Popup.prototype;

prototype.isAvailable = function() {
    var currentTime = Date.now();
    if (this.state === Consts.POPUP_STATE.ACTIVE && this.time_start.getTime() < currentTime && this.time_end.getTime() > currentTime) {
            return true;
    }
    return false;
};

prototype.toObj = function() {
    var obj = {};
    obj[ParamsKey.ID] = this.id;
    obj[ParamsKey.TITLE] = this.title;
    obj[ParamsKey.CONTENT] = this.content;
    obj[ParamsKey.EXTRAS] = this.extras;
    obj[ParamsKey.TYPE] = this.type;
    return obj;
};
