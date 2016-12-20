var utils = require('../../util/utils');
var Common = require('../../lib/common/common');

var instance;

var ID_CA_NEMO = 1;
var ID_CA_NOC = 2;
var ID_SUA_BIEN = 3;
var ID_CA_CHUON = 4;
var ID_CA_ANGLER = 5;
var ID_CA_THAN_TIEN = 6;
var ID_RUA = 7;
var ID_SAO_BIEN = 8;
var ID_CA_KIM = 9;
var ID_CA_DUOI = 10;
var ID_TIEN_CA_CAP1 = 11;
var ID_TIEN_CA_CAP2 = 12;
var ID_TIEN_CA_CAP3 = 13;
var ID_CA_VOI = 14;
var ID_TIEN_CA_CAP4 = 15;
var ID_CA_THANTAI = 16;

var FIX_PERCENT_TIEN_CA_CAP1= 4;//bi -1
var FIX_PERCENT_TIEN_CA_CAP2 = 3;//bi -1
var FIX_PERCENT_TIEN_CA_CAP3 = 2;//bi -1
var FIX_PERCENT_CA_VOI = 3;
var FIX_PERCENT_TIEN_CA_CAP4 = 1;//bi -1
var FIX_PERCENT_CA_THAN_TAI = 1;

var FIX_PERCENT_CA_NEMO = 14;
var FIX_PERCENT_CA_NOC = 11;
var FIX_PERCENT_SUA_BIEN = 10;
var FIX_PERCENT_CA_CHUON = 7;
var FIX_PERCENT_CA_ANGLER = 6;
var FIX_PERCENT_CA_THAN_TIEN = 6;
var FIX_PERCENT_RUA = 6;
var FIX_PERCENT_SAO_BIEN = 5;
var FIX_PERCENT_CA_KIM = 6;
var FIX_PERCENT_CA_DUOI = 5;

var FishGenerator = function() {

};

function getInstance () {
    if (!instance) {
        instance = new FishGenerator();
    }
    return instance;
};

module.exports = {
    getInstance : getInstance
};

var prot = FishGenerator.prototype;

prot.generateFish = function(inputData) {
    //
    var totalFish = inputData.totalFish || 200; //Tong so ca trong 1 turn
    var percentFish = utils.initInArray(16);
    var numberFish = utils.initInArray(16);

    percentFish[ID_TIEN_CA_CAP1 - 1] = FIX_PERCENT_TIEN_CA_CAP1;
    percentFish[ID_TIEN_CA_CAP2 - 1] = FIX_PERCENT_TIEN_CA_CAP2;
    percentFish[ID_TIEN_CA_CAP3 - 1] = FIX_PERCENT_TIEN_CA_CAP3;
    percentFish[ID_CA_VOI - 1] = FIX_PERCENT_CA_VOI;
    percentFish[ID_TIEN_CA_CAP4 - 1] = FIX_PERCENT_TIEN_CA_CAP4;
    percentFish[ID_CA_THANTAI - 1] = FIX_PERCENT_CA_THAN_TAI;

    percentFish[ID_CA_NEMO - 1] = Common.next(2) + FIX_PERCENT_CA_NEMO;
    percentFish[ID_CA_NOC - 1] = Common.next(2) + FIX_PERCENT_CA_NOC;
    percentFish[ID_SUA_BIEN - 1] = Common.next(2) + FIX_PERCENT_SUA_BIEN;
    percentFish[ID_CA_CHUON - 1] = Common.next(2) + FIX_PERCENT_CA_CHUON;
    percentFish[ID_CA_ANGLER - 1] = Common.next(2) + FIX_PERCENT_CA_ANGLER;
    percentFish[ID_CA_THAN_TIEN - 1] = Common.next(2) + FIX_PERCENT_CA_THAN_TIEN;
    percentFish[ID_RUA - 1] = Common.next(2) + FIX_PERCENT_RUA;
    percentFish[ID_SAO_BIEN - 1] = Common.next(2) + FIX_PERCENT_SAO_BIEN;
    percentFish[ID_CA_KIM - 1] = Common.next(2) + FIX_PERCENT_CA_KIM;
    percentFish[ID_CA_DUOI - 1] = Common.next(2) + FIX_PERCENT_CA_DUOI;

    var currentTotalPercent = 0;
    for (var i = 0; i < percentFish.length; i++) {
        currentTotalPercent += percentFish[i];
    }
    var delatPercent = 100 - currentTotalPercent;
    // Chia lai so % con lai cho nhung ca con lai
    if (delatPercent > 0) {
        var lvFishBonus = utils.random(3);
        if (lvFishBonus < 2) {
            // Cong them cho ca thuong
            for (var i = 0; i < ID_CA_DUOI; i++) {
                if (delatPercent > 0) {
                    percentFish[i] += 1;
                    delatPercent -= 1;
                } else {
                    break;
                }
            }
            // Neu chia van ko het
            percentFish[ID_CA_NEMO - 1] += delatPercent;
        } else if (lvFishBonus === 2) {
            // Cong them cho ca dac biet
            // Random cong cho tien ca vang
            if (delatPercent > 0) {
                var t1 = utils.random(5);
                if (t1 === 2) {
                    percentFish[ID_TIEN_CA_CAP4 - 1] += 1;
                    delatPercent -= 1;
                }
            }
            // Random cong cho ca than tai
            if (delatPercent > 0) {
                var t1 = utils.random(5);
                if (t1 === 2) {
                    percentFish[ID_CA_THANTAI - 1] += 1;
                    delatPercent -= 1;
                }
            }
            for (var i = ID_TIEN_CA_CAP1 - 1; i < ID_CA_THANTAI; i++) {
                if (delatPercent > 0) {
                    percentFish[i] += 1;
                    delatPercent -= 1;
                } else {
                    break;
                }
            }
            // Neu chia van ko het
            percentFish[ID_CA_THANTAI - 1] += delatPercent;
        }
    }

    var currentTotalFish = 0;
    for (var i = 0; i < percentFish.length; i++) {
        numberFish[i] = Math.floor(totalFish * percentFish[i] / 100);
        currentTotalFish += numberFish[i];
    }
    var deltaNumberFish = totalFish - currentTotalFish;
    numberFish[0] += deltaNumberFish;

    //Phan phoi ca
    var countNumberFishNormal = 0;
    for (var i = 0; i < ID_CA_THANTAI; i++) {
        countNumberFishNormal += numberFish[i];
    }
    var arrFishNormal = utils.initInArray(countNumberFishNormal);
    var startIndex = 0;
    for (var i = 0; i < ID_CA_THANTAI; i++) {
        for (var j = 0; j < numberFish[i]; j++) {
            arrFishNormal[startIndex + j] = i + 1;
        }
        startIndex += numberFish[i];
    }
    for (var i = arrFishNormal.length - 1; i > 0; i--) {
        var index = utils.random(i + 1);
        // Simple swap
        var a = arrFishNormal[index];
        arrFishNormal[index] = arrFishNormal[i];
        arrFishNormal[i] = a;
    }
    //for (var i = 0; i < arrFishNormal.length; i++) {
    //    arrFishNormal[i] = ID_CA_THANTAI;
    //}
    return arrFishNormal;
};