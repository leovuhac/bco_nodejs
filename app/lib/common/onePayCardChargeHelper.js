var Telco = require('./telco.js');
var crypto = require('crypto');
var https = require('https');
var utils = require('../../util/utils');

var OnePayCardChargeHelper = function () {
		
};

module.exports = OnePayCardChargeHelper;

OnePayCardChargeHelper.prototype.payment = function(pin, serial, type, cb) {
	var URL_SERVICES = "api.1pay.vn";
	var V_ACCESS_KEY = "i81b3zrmum0s5jo25vvm";
	var V_SECRET = "9tma4iiwv5bjj43n9nqoyzrgd87altpo"; 	
	var VIETTEL = "viettel";
	var MOBIFONE = "mobifone";
	var VINAPHONE = "vinaphone";
	var GATE = "gate";
	var VCOIN = "vcoin";
	var ZING = "zing";

	function getCardType (type) {
		if (type === Telco.VIET_TEL.getId()) {
			return VIETTEL;
		} else if (type === Telco.MOBI.getId()) {
			return MOBIFONE;
		} else if (type === Telco.VINA.getId()) {
			return VINAPHONE;
		} else if (type === Telco.VCOIN.getId()) {
			return VCOIN;
		}
		return "";
	}

	type = getCardType(type);

	function hmacDigest (msg, keyString) {
		return crypto.createHmac('sha256', keyString).update(msg).digest('hex');
	}

	function generateSignature (access_key, pin, serial, type, secret) {
		var urlParameters = "";
		var signature = "";
		if ((access_key) && (pin) && (serial)
				&& (type) && (secret)) {
			urlParameters = "access_key=%access_key%&pin=%pin%&serial=%serial%&type=%type%";
			urlParameters = urlParameters.replace("%access_key%",
					access_key);
			urlParameters = urlParameters.replace("%pin%", pin);
			urlParameters = urlParameters.replace("%serial%", serial);
			urlParameters = urlParameters.replace("%type%", type);
			signature = hmacDigest(urlParameters, secret);
		}
		return signature;
	}

	var access_key = V_ACCESS_KEY;
	var urlParameters = "access_key=%access_key%&pin=%pin%&serial=%serial%"
				+ "&type=%type%&signature=%signature%";
	urlParameters = urlParameters.replace("%access_key%", access_key);
	urlParameters = urlParameters.replace("%type%", type);
	urlParameters = urlParameters.replace("%pin%", pin);
	urlParameters = urlParameters.replace("%serial%", serial);
	var secretKey = V_SECRET;
	// secret_key cua san pham do 1Pay cung cap
	var signature = generateSignature(access_key, pin, serial, type,
				secretKey);
	// access_key va secretKey do 1pay cung cap
	urlParameters = urlParameters.replace("%signature%", signature);

	var options = {
  		host: URL_SERVICES,
  		path: '/card-charging/v5/topup',
  		//since we are listening on a custom port, we need to specify it by hand
 		 port: '443',
  		//This is what changes the request to a POST request
  		method: 'POST',
  		headers: {
  			'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': urlParameters.length,
          'Accept-Language': 'en-US,en;q=0.5'
      }
	};
	callback = function(response) {
  		var str = ''
  		response.on('data', function (chunk) {
    		str += chunk;
  		});

  		response.on('end', function () {
  			console.log('============Payment Http Response : ' + str);
    		utils.invokeCallback(cb, null, JSON.parse(str));
  		});
	}
	var req = https.request(options, callback);
	req.write(urlParameters);
  	req.end();
};