var ChargeInfo = function() {
	this.money = 0;
	this.des = '';
};

module.exports = ChargeInfo;

	ChargeInfo.prototype.setMoney = function(money) {
		this.money = money;
	}

	ChargeInfo.prototype.setDes = function(des) {
		this.des = des;
	}

	//ChargeInfo.prototype.getDes() {
	//	return this.des;
	//}
    //
	//ChargeInfo.prototype.getMoney() {
	//	return this.money;
	//}