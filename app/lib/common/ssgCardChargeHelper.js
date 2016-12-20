var Telco = require('./telco.js');
var crypto = require('crypto');
var http = require('http');
var utils = require('../../util/utils');
var Debug = require('../../log/debug');

var SSGCardChargeHelper = function () {

};

module.exports = SSGCardChargeHelper;

SSGCardChargeHelper.prototype.payment = function(userId, cardPin, cardSerial, cardType, cb) {
    var URL_SERVICE_2 = "s3.hopepay.vn";
    var PRODUCT_ID = "MB02";
    var PRODUCT_KEY = "5KX882ZJFK";
    var VINA = "VNP";
    var VIETTEL = "VTT";
    var MOBI = "VMS";
    var HPCARD = "HPC";
    var PIN = "pin";
    var SERIAL = "serial";
    var PROVIDER = "provider";
    var SIGN = "sign";

    function getCardType (type) {
        if (type === Telco.VIET_TEL.getCode()) {
            return VIETTEL;
        } else if (type === Telco.MOBI.getCode()) {
            return MOBI;
        } else if (type === Telco.VINA.getCode()) {
            return VINA;
        } else if (type === Telco.HPCARD.getCode()) {
            return HPCARD;
        }
        return "";
    }

    function getMsgError(status, defaultMsg) {
        var msg = defaultMsg;
        try {
            if (status == -33) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == -44) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == -55) {
                msg = "Chữ kí giao dịch không chính xác";
            } else if (status == -66) {
                msg = "Id của giao dịch gửi lên bị trùng lặp";
            } else if (status == -6) {
                msg = "Product ID không hợp lệ";
            } else if (status == -7) {
                msg = "Mã pin của thẻ không hợp lệ";
            } else if (status == -8) {
                msg = "Mã serial của thẻ không hợp lệ";
            } else if (status == -9) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == -10) {
                msg = "Id của giao dịch không hợp lệ";
            } else if (status == -11) {
                msg = "Chữ ký của giao dịch không hợp lệ";
            } else if (status == -24) {
                msg = "Dữ liệu thẻ gửi lên bị lỗi";
            } else if (status == 0) {
                msg = "Thất bại";
            } else if (status == 1) {
                msg = "Thành công";
            } else if (status == 2) {
                msg = "Giao dịch bị timeout do thời gian thực hiện giao dịch quá lâu";
            } else if (status == 3) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 4) {
                msg = "Mã pin và serial của thẻ không hợp lệ";
            } else if (status == 5) {
                msg = "Nhập sai mã thẻ quá 5 lần";
            } else if (status == 7) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 8) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 9) {
                msg = "Hệ thống thanh toán của Mobifone đang quá tải. Vui lòng thử lại sau";
            } else if (status == 10) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 11) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 12) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 13) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == -2) {
                msg = "Thẻ bị khóa";
            } else if (status == -3) {
                msg = "Thẻ hết hạn sử dụng";
            } else if (status == 50) {
                msg = "Thẻ đã được sử dụng hoặc thẻ không tồn tại";
            } else if (status == 51) {
                msg = "Số serial của thẻ không hợp lệ";
            } else if (status == 52) {
                msg = "Số serial và mã pin không khớp";
            } else if (status == 53) {
                msg = "Số serial và mã pin không chính xác";
            } else if (status == 55) {
                msg = "Thẻ bị khóa trong 24 giờ";
            } else if (status == 56) {
                msg = "User nạp thẻ đã bị khóa";
            } else if (status == 57) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 58) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 59) {
                msg = "Thẻ không được kích hoạt";
            } else if (status == 60) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 61) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 62) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 63) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            } else if (status == 64) {
                msg = "Hệ thống đang bảo trì. Vui lòng thử lại sau !";
            }
        } catch (ex) {
            console.log(ex.stack);
        }
        return msg;
    }

    cardType = getCardType(cardType);

    try {
        var sign = crypto.createHash('md5').update(PRODUCT_ID + cardPin + PRODUCT_KEY).digest('hex');
        var params = PIN + "=" + cardPin + "&"
            + SERIAL + "=" + cardSerial + "&"
            + PROVIDER + "=" + cardType + "&"
            + "product_id" + "=" + PRODUCT_ID + "&"
            + SIGN + "=" + sign;
        Debug.money(userId + " PARAMS " + params);
        var options = {
            host: URL_SERVICE_2,
            path: '/hope?' + params,
            agent: false
        };
        callback = function (response) {
            var str = ''
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                Debug.money(userId + " " + str);
                var chargeInfo = {};
                var jsonResult = JSON.parse(str);
                var status = jsonResult.status;
                if (status == 1) {
                    chargeInfo['amount'] = Number(jsonResult['amount']);
                } else {
                    chargeInfo['amount'] = -1;
                }
                var message = jsonResult["msg"];
                var trans_id = jsonResult["trans_id"];
                var vnMsg = getMsgError(status, message);
                chargeInfo['description'] = vnMsg;
                chargeInfo['trans_id'] = trans_id;
                utils.invokeCallback(cb, null, chargeInfo);
            });
        }
        var req = http.request(options, callback);
        req.on('error', function(err) {
            console.log("Http Request Error " + err.stack);
            Debug.error("SSG Card Charge Helper", err);
            //
            var chargeInfo = {};
            chargeInfo['amount'] = -1;
            chargeInfo['description'] = 'ErrorRequest, Hệ thống đang bảo trì. Vui lòng thử lại sau !';
            chargeInfo['transId'] = -1;
            utils.invokeCallback(cb, null, chargeInfo);
        });
        req.end();
    } catch (ex) {
        console.log(ex.stack);
        Debug.error("SSG Card Charge Helper", ex);
        //
        var chargeInfo = {};
        chargeInfo['amount'] = -1;
        chargeInfo['description'] = 'ErrorRequest, Hệ thống đang bảo trì. Vui lòng thử lại sau !';
        chargeInfo['transId'] = -1;
        utils.invokeCallback(cb, null, chargeInfo);
    }
};
