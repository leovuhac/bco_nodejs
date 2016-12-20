var Telco = function (code, id) {
	this.code = code;
	this.id = id;
};

module.exports = Telco;

Telco.VIET_TEL = new Telco("viettel", 1);
Telco.VINA = new Telco("vinaphone", 2);
Telco.MOBI = new Telco("mobifone", 3);
Telco.HPCARD = new Telco("hpcode", 4);

Telco.prototype.getCode = function() {
		return this.code;
	};

	Telco.prototype.getId = function() {
		return this.id;
	};

Telco.prototype.getCodeById = function(id) {
	switch (id) {
		case 1:
			return Telco.VIET_TEL.getCode();
		case 2:
			return Telco.VINA.getCode();
		case 3:
			return Telco.MOBI.getCode();
		case 4:
			return Telco.HPCARD.getCode();
		default:
			return "";
		}
};