var utils = require('../../util/utils');

var RoomSetting = function() {
	this.index = 1;
	this.type = 0;
	this.tableFee = 0;
	this.minJoinRoom = 0;
	this.numberPlayer = 0;
	this.numberUser = 0;
	this.name = '';
	this.minLevel = 0;
	this.maxPlayer = 4;
	this.vip = 0;
	this.roomState = 1;
	//Mot so thong tin gianh rieng cho choi nhanh
    this.minAmountFish = 16;
    this.maxAmountFish = 30;
    this.winLostRatio = 5 / 5;
	this.machineWinRatio = 5;
	this.machineLostRatio = 5;
    this.interest = 0;
    this.maxMoneyJoinRoom = 1000;
    //Mot so thong tin gianh rieng cho choi thach dau
    this.initBullet = 200;
};

module.exports = RoomSetting;

	RoomSetting.prototype.setType = function(type) {
		this.type = type;
	};

	RoomSetting.prototype.setTableFee = function(tableFee) {
		this.tableFee = tableFee;
	};

	RoomSetting.prototype.getTableFee = function() {
		return this.tableFee;
	};

	/**
	 * (Phong tap su + Phong chuyen nghiep)
	 */
	RoomSetting.prototype.getType = function() {
		return this.type;
	};

	RoomSetting.prototype.setMinJoinRoom = function(minJoinRoom) {
		this.minJoinRoom = minJoinRoom;
	};

	RoomSetting.prototype.getMinJoinRoom = function() {
		return this.minJoinRoom;
	};

	RoomSetting.prototype.getNumberPlayer = function() {
		return this.numberPlayer;
	};

	RoomSetting.prototype.updateNumberPlayer = function(updateNumber) {
		this.numberPlayer = updateNumber;
	};

	RoomSetting.prototype.getNumberUser = function() {
		return this.numberUser;
	};

	RoomSetting.prototype.updateNumberUser = function(numberUser) {
		this.numberUser = numberUser;
	};

	RoomSetting.prototype.getName = function() {
		return this.name;
	};

	RoomSetting.prototype.setName = function(name) {
		this.name = name;
	};

	RoomSetting.prototype.setMinLevel = function(minLevel) {
		this.minLevel = minLevel;
	};

	RoomSetting.prototype.getMinLevel = function() {
		return this.minLevel;
	};

	RoomSetting.prototype.getMaxPlayer = function(){
		return this.maxPlayer;
	};

	RoomSetting.prototype.setMaxPlayer = function(maxPlayer){
		this.maxPlayer = maxPlayer;
	};

	RoomSetting.prototype.getVip = function(){
		return this.vip;
	};

	RoomSetting.prototype.setVip = function(vip){
		this.vip = vip;
	};

    RoomSetting.prototype.setMinAmountFish = function(minAmountFish) {
        this.minAmountFish = minAmountFish;
    };

    RoomSetting.prototype.getMinAmountFish = function() {
        return this.minAmountFish;
    };

    RoomSetting.prototype.setMaxAmountFish = function(maxAmountFish) {
        this.maxAmountFish = maxAmountFish;
    };

    RoomSetting.prototype.getMaxAmountFish = function() {
        return this.maxAmountFish;
    };

    RoomSetting.prototype.setWinLostRation = function(winLostRatio) {
        this.winLostRatio = winLostRatio;
    };

    RoomSetting.prototype.setInterest = function(interest) {
        this.interest = interest;
    };

    RoomSetting.prototype.getInterest = function() {
        return this.interest;
    };

    RoomSetting.prototype.setMaxMoneyJoinRoom = function(maxMoneyJoinRoom) {
        this.maxMoneyJoinRoom = maxMoneyJoinRoom;
    };

    RoomSetting.prototype.getMaxMoneyJoinRoom = function() {
        return this.maxMoneyJoinRoom;
    };

    RoomSetting.prototype.setInitBullet = function(t) {
        this.initBullet = t;
    };

    RoomSetting.prototype.getInitBullet = function() {
        return this.initBullet;
    };

	RoomSetting.prototype.setRoomState = function(state) {
		this.roomState = state;
	};

	RoomSetting.prototype.getRoomState = function() {
		return this.roomState;
	};