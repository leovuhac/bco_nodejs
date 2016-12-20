var Common = require('../common/common.js');

var instance;

var GameConfig = function() {
    //info from game_config table
    this.last_load_config = '';
    this.banner_text = 'Chào mừng các bạn tới với game bắn cá online';
    this.banner_link = '';
    this.current_version = '1';
    this.payment_method = ['CARD', 'IAP'];
    this.payment_permission = {android : true, ios : true, wp : true};
    this.register_bonus = 1000;
    this.max_account_device_id = 10;
    this.number_acc_per_device_register_bonus = 1;
    this.cashout_permission = {android : true, ios : true, wp : true};
    this.serverIsShuttingDown = false;
    this.money_cashout_remain = 10000;
    this.rule_cashout = '';
    this.register_default_gold = 100000;
    this.freeplay_win_lost_ratio = '5-5';
    this.invite_code_bonus_gold = 5000;
    this.platform_default_full_mode = ['ios', 'web', 'windowphone', 'desktop'];
    this.hour_active_full_mode = 24;
    this.freeplay_valid_open_full_mode = 3;
    //info from popup_manager table
    this.popups = [];
    this.telcos = [];
    this.cardExchangeRate = [];
    this.partners = [];
    this.events = {};
};

function getInstance () {
    if (!instance) {
        instance = new GameConfig();
    }
    return instance;
};

module.exports = {
    getInstance : getInstance
};

var prototype = GameConfig.prototype;

prototype.setLast_load_config = function(last_load_config) {
    this.last_load_config = last_load_config;
};

prototype.getLast_load_config = function() {
    return this.last_load_config;
};

prototype.setBanner_text = function(text) {
    this.banner_text = text;
};

prototype.getBanner_text = function() {
    return this.banner_text;
};

prototype.setBanner_link = function(link) {
    this.banner_link = link;
};

prototype.getBanner_link = function() {
    return this.banner_link;
};

prototype.setCurrent_version = function(version) {
    this.current_version = version;
};

prototype.getCurrent_version = function() {
    return this.current_version;
};

prototype.getDateCurrent_version = function() {
    return Common.getDateFromVersionFormat(this.current_version);
};

prototype.setPayment_method = function(arrayPayment) {
    try {
        if (typeof arrayPayment === 'string') {
            this.payment_method = JSON.parse(arrayPayment);
        } else {
            this.payment_method = arrayPayment;
        }
    } catch (e) {}
};

prototype.getPayment_method = function() {
    return this.payment_method;
};

prototype.setPayment_permission = function(objPermission) {
    try {
        if (typeof objPermission === 'string') {
            this.payment_permission = JSON.parse(objPermission);
        } else {
            this.payment_permission = objPermission;
        }
    } catch (e) {}
};

prototype.getPayment_permission = function() {
    return this.payment_permission;
};

prototype.setRegister_bonus = function(register_bonus) {
    this.register_bonus = register_bonus;
};

prototype.getRegister_bonus = function() {
    return this.register_bonus;
};

prototype.setMax_account_device_id = function(max_account_device_id) {
    this.max_account_device_id = max_account_device_id;
};

prototype.getMax_account_device_id = function() {
    return this.max_account_device_id;
};

prototype.setNumber_acc_per_device_register_bonus = function(number_acc) {
    this.number_acc_per_device_register_bonus = number_acc;
};

prototype.getNumber_acc_per_device_register_bonus = function() {
    return this.number_acc_per_device_register_bonus;
};

prototype.setCashout_permission = function(c_p) {
    this.cashout_permission = c_p;
};

prototype.getCashout_permission = function() {
    return this.cashout_permission;
};

prototype.setPopups = function(popups) {
      this.popups = popups;
};

prototype.addPopup = function(popup) {
    var duplicate = false;
    var index = 0;
    for (var i = 0; i < this.popups.length; i++) {
        if (this.popups[i].id === popup.id) {
            duplicate = true;
            index = i;
            break;
        }
    }
    if (!duplicate) {
        this.popups.push(popup);
    } else {
        this.popups[index] = popup;
    }
};

prototype.getPopupsAvailable = function() {
    var list = [];
    for (var i = 0; i < this.popups.length; i++) {
        if (this.popups[i].isAvailable()) {
            list.push(this.popups[i]);
        }
    }
    return list;
};

prototype.resetPopup = function() {
    this.popups = [];
};

prototype.getCardTelco = function() {
    return this.telcos;
};

prototype.setCardTelco = function(cardTelco) {
    this.telcos = cardTelco;
};

prototype.getCardExchangeRate = function() {
    return this.cardExchangeRate;
};

prototype.setCardExchangeRate = function(value) {
    this.cardExchangeRate = value;
};

prototype.setPartners = function(arr) {
    this.partners = arr;
};

prototype.getPartners = function() {
    return this.partners;
};

prototype.addEventManager = function(event) {
    this.events[event.eventId] = event;
};

prototype.removeEventManager = function(eventId) {
    delete this.events[eventId];
};

prototype.getEventManager = function(eventId) {
    return this.events[eventId];
};

prototype.setPlatform_default_full_mode = function(value) {
    try {
        if (typeof value === 'string') {
            this.platform_default_full_mode = JSON.parse(value);
        } else {
            this.platform_default_full_mode = value;
        }
    } catch (e) {
    }
};

prototype.getPlatform_default_full_mode = function() {
    return this.platform_default_full_mode;
};

prototype.setHour_active_full_mode = function(value) {
    this.hour_active_full_mode = Number(value);
};

prototype.getHour_active_full_mode = function() {
    return this.hour_active_full_mode;
};