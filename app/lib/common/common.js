var DateFormat = require('./date_format.js');
var utils = require('../../util/utils');
var fs = require('fs');
var crypto = require('crypto');
var uuid = require('node-uuid');
var Hashids = require('../../util/hashids');
var Consts = require('../../consts/consts');

var exports = module.exports;

exports.fomatDate = function (date) {
	return DateFormat.asString('yyyy-MM-dd hh:mm:ss', date);
};

exports.fomatDateSimple = function (date) {
	return DateFormat.asString('yyyy-MM-dd', date);
};

exports.formatDateLienTuc = function (date) {
	return DateFormat.asString("yyyyMMddHHmmssSS", date);
};

exports.generateInviteCode = function(id) {
	var hashids = new Hashids(Consts.GAME_NAME, 6);
	var code = hashids.encode(id);
	return code;
};

exports.getDateFromVersionFormat = function(version) {
	var versionParts = version.split('/');
	var versionDate = new Date(Number(versionParts[2]), Number(versionParts[1]) - 1, Number(versionParts[0]));
	return versionDate;
};

exports.readFile = function(filename, cb) {
	fs.readFile(filename, 'utf8', function (err,data) {
  		if (err) {
  			utils.invokeCallback(cb, null, false);
 		} else {
  			utils.invokeCallback(cb, null, data.toString());
  		}
	});
};

exports.readFileSync = function(filename) {
	var data = fs.readFileSync(filename, 'utf8');
	return data.toString();
};

exports.formatNumber = function(number) {
	var result = number + '';
	if (number % 1000000000 === 0)
		result = number / 1000000000 + "B";
	else if (number % 1000000 === 0)
		result = number / 1000000 + "M";
	else if (number % 1000 === 0) {
		result = number / 1000 + "K";
	}
	return result;
};

exports.generateLevel = function(n) {
	if (n > 0) {
		return exports.generateFibo(n) * 10;
	}
	return 0;
};

exports.findLevel = function(fromlevel, numberWins) {
	var levelFound = -1;
	var count = 10;
	var levelCheck = fromlevel + 1;
	do {
		var numberWinCheck = exports.generateLevel(levelCheck);
		if (numberWins < numberWinCheck) {
			levelFound = levelCheck - 1;
		}
		count--;
		levelCheck++;
	} while ((levelFound === -1) && (count > 0));
	if (levelFound === -1) {
		levelFound = fromlevel + 1;
	}
	return levelFound;
};

exports.generateFibo = function(n) {
		n--;
		if (n === 0) {
			return 1;
		}
		if (n === 1) {
			return 2;
		}
		var fibo = new Array(n + 1);
		fibo[0] = 1;
		fibo[1] = 2;
		for (var i = 2; i <= n; i++) {
			fibo[i] = (fibo[(i - 1)] + fibo[(i - 2)]);
		}
		return fibo[n];
};

exports.readFileData = function(filename, cb) {
	var bufferString, bufferStringSplit;
	fs.readFile(filename, function (err, data) {
		if (err) {
			utils.invokeCallback(cb, null, false);
		} else {
	    	bufferString = data.toString(); 
	    	bufferStringSplit = bufferString.split('\n'); 
	    	utils.invokeCallback(cb, null, bufferStringSplit);
    	}
  	});
};

exports.readFileDataSync = function(filename) {
	var data = fs.readFileSync(filename, 'utf8');
	var bufferString, bufferStringSplit;
	bufferString = data.toString();
	bufferStringSplit = bufferString.split('\n');
	return bufferStringSplit;
};

exports.convertFileDataToStringArr = function(fileData) {
	var listResult = [];
	var partj = '';
	for (var i = 0; i < fileData.length; i++) {
		var part = fileData[i].split(",");
		for (var j = 0; j < part.length; j++) {
			partj = part[j].trim();
			listResult.push(partj);
		}
	}
	return listResult;
};

exports.MD5 = function(msg) {
	var hash = crypto.createHash('md5').update(msg).digest('hex');
	return hash;
};

exports.generatePass = function() {
	var t = uuid.v1();
	var result = "";
	for (var i = 0; i < 6; i++) {
		result += t.charAt(i);
	}

	return result;
};

exports.next = function(n) {
	return utils.random(n);
};

