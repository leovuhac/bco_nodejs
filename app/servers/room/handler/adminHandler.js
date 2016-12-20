var pomelo = require('pomelo');
var messageService = require('../../../domain/messageService');
var User = require('../../../domain/user');
var utils = require('../../../util/utils');
var UserFlag = require('../../../lib/constants/userFlag');
var Consts = require('../../../consts/consts');
var GameConfig = require('../../../lib/config/gameConfig');
var ParamsKey = require('../../../lib/constants/paramsKey');
var Commands = require('../../../lib/constants/commands');
var RoomSettingManager = require('../../../lib/config/roomSettingManager');
var Database = require('../../../lib/database/database');
var RoomManager = require('../../../domain/roomManagerService');
var ItemConfig = require('../../../main/entity/itemConfig');
var Telco = require('../../../lib/common/telco');
var SSGCardChargeHelper = require('../../../lib/common/ssgCardChargeHelper');
var async = require('async');
var Debug = require('../../../log/debug');
var NotifyServerDownTask = require('../../../main/zone/notifyServerDownTask');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.send_user_message = function(msg, session, next) {
    try {
        var params = msg;
        var self = this;
        var content = params["content"];
        var title = params["title"];
        var recipient = params["recipient"];
        var database = Database.getInstance();
        var userManagerService = pomelo.app.get('userManagerService');
        database.getUserByName(recipient, function (err, userData) {
            if (userData) {
                database.insertUserMessage(recipient, title, content, Consts.USER_MESSAGE.TYPE.ADMIN_SEND, 'Admin', function (err, res) {
                    var userOnline = userManagerService.getUserByName(recipient);
                    if (userOnline) {
                        //var newMessageInfo = {};
                        //newMessageInfo["number_not_read"] = 1;
                        //messageService.pushMessageToUser(userOnline, Commands.NEW_MESSAGE, newMessageInfo);
                    }
                    var resObj = {};
                    resObj.code = 200;
                    resObj["description"] = "thanh cong!";
                    resObj["is_success"] = true;
                    messageService.pushMessageToSession(session, "send_user_message", resObj);
                    next(null, {code: 200});
                });
            } else {
                var resObj = {};
                resObj.code = 500;
                resObj["description"] = "user ko ton tai!";
                resObj["is_success"] = true;
                messageService.pushMessageToSession(session, "send_user_message", resObj);
                next(null, {code: 500});
            }
        });
    } catch (e) {
        next(null, {code : 500});
        Debug.error("adminHandler", e);
    }
};

handler.kich_user = function(msg, session, next) {
    var username = msg['username'];
    var roomname = msg['roomname'];
    if (username) {
        pomelo.app.rpc.connector.connectorRemote.kich_user(session, username, function(err, msg) {});
    }
    next(null, {code : 200, message : 'Kick user success'});
    if (roomname) {
        var room = RoomManager.getInstance().getRoomByName(roomname);
        if (room) {
            if (username) {
                room.gameController.doKickUser(username);
                messageService.pushMessageToSession(session, "kich_user", {code : 200, message : 'Kick user success'});
            } else {
                messageService.pushMessageToSession(session, "kich_user", {code : 500, message : 'Username not exist'});
            }
        } else {
            messageService.pushMessageToSession(session, "kich_user", {code : 500, message : 'Room not exist'});
        }
    } else {
        if (username) {
            messageService.pushMessageToSession(session, "kich_user", {code : 200, message : 'Kick user success'});
        }
    }
};

handler.recharge_card = function(msg, session, next) {
    var self = this;
    var params = msg;
    var cardPin = params["card_code"];
    var cardSerial = params["card_serial"];
    var cardType = params["card_type"];
    var username = params["username"];
    var userManagerService = pomelo.app.get('userManagerService');
    var user = userManagerService.getUserByName(username);
    if (!user) {
        var data = {};
        data["result"] = false;
        data["reason"] = "User " + username + " not exist in server";
        messageService.pushMessageToSession(session, Commands.RECHARGE_CARD, reqInfo);
        next(null, {"code" : Consts.FAILED});
    }
    var database = Database.getInstance();
    var GameConfig = GameConfig.getInstance();
    var userMoneyBefore = user.getProperty(UserFlag.MONEY);
    var partner = user.getProperty(UserFlag.PARTNER_ID);
    var userTitle = user.getProperty(UserFlag.TITLE);
    var reqInfo = {};
    try {
        var valid = self.checkCardParams(cardPin, cardSerial, cardType);
        if (valid) {
            var cardChargeHelper = new SSGCardChargeHelper();
            cardChargeHelper.payment(user.getName(), cardPin, cardSerial, cardType, function(err, res) {
                var chargeInfo = res;
                var amount = chargeInfo['amount'];
                if (amount > 0) {
                    var cardExchangeRate = GameConfig.getCardExchangeRate();
                    var moneyRecharge = 0;
                    for (var i = 0; i < cardExchangeRate.length; i++) {
                        var oneExRate = cardExchangeRate[i];
                        if (oneExRate['card_amount'] === amount) {
                            moneyRecharge = oneExRate['money_in_game'];
                        }
                    }
                    var bonusMoney = moneyRecharge;
                    //
                    user.addMoney(bonusMoney);
                    database.addUserMoney(user.getName(), bonusMoney, 'charge card ' + cardPin + " - " + cardSerial);
                    var userMoneyAfter = user.getProperty(UserFlag.MONEY);
                    database.insertUserMoneyTrace(user.getName(), userTitle, Consts.MONEY_TRACE_CARD_RECHARGE, Consts.LOBBY, '', 0, userMoneyBefore,
                        userMoneyAfter, bonusMoney, 0, partner, '');
                    database.logCardExchange(cardPin, cardSerial, cardType, -1, user.getName(), userMoneyBefore, userMoneyAfter,
                        chargeInfo['description'], chargeInfo['trans_id'], -1, partner);
                    var message = 'Nạp thẻ ' + cardType + ", pin : " + cardPin + ", serial : " + cardSerial + ", giá : " + amount;
                    database.insertUserMessage(user.getName(), 'Nạp tiền', message, Consts.USER_MESSAGE.TYPE.PAYMENT, Consts.ADMIN);
                    //
                    reqInfo[ParamsKey.SUCCESS] = true;
                    reqInfo[ParamsKey.MESSAGE] = 'Nạp tiền thành công. Mệnh giá ' + amount + ' số tiền được cộng trong game ' + bonusMoney;
                    reqInfo[ParamsKey.MONEY] = userMoneyAfter;
                    reqInfo[ParamsKey.MONEY_CHANGE] = bonusMoney;
                    reqInfo[ParamsKey.CARD_AMOUNT] = amount;
                    messageService.pushMessageToSession(user.getSession(), Commands.RECHARGE_CARD, reqInfo);
                } else {
                    reqInfo[ParamsKey.SUCCESS] = false;
                    reqInfo[ParamsKey.MESSAGE] = chargeInfo['description'];
                    messageService.pushMessageToSession(user.getSession(), Commands.RECHARGE_CARD, reqInfo);
                    //
                    var userMoneyAfter = user.getProperty(UserFlag.MONEY);
                    database.logCardExchange(cardPin, cardSerial, cardType, bonusMoney, user.getName(), userMoneyBefore, userMoneyAfter,
                        chargeInfo['description'], chargeInfo['trans_id'], amount, partner);
                }
            });
        } else {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Thông tin thẻ cào gửi lên không hợp lệ';
            messageService.pushMessageToSession(session, Commands.RECHARGE_CARD, reqInfo);
            Debug.error("adminHandler", e);
        }
    } catch (e) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Thanh toán không thành công';
        messageService.pushMessageToSession(session, Commands.RECHARGE_CARD, reqInfo);
    }
    reqInfo["result"] = true;
    //Gui ket qua ve cho monitor
    messageService.pushMessageToSession(session, Commands.RECHARGE_CARD, reqInfo);
    next(null, {code : Consts.OK});
};

handler.hide_room = function(msg, session, next) {
    var roomname = msg["roomname"];
    if (roomname) {
        var room = RoomManager.getInstance().getRoomByName(roomname);
        if (room) {
            room.setHidden(true);
            next(null, {code : 200, message : 'Hide room ' + roomname + ' success'});
        } else {
            next(null, {code : 500, message : 'Room ' + roomname + ' not exist'});
        }
    } else {
        next(null, {code : 500, message : 'Roomname ' + roomname + ' not exist'});
    }
    messageService.pushMessageToSession(session, "hide_room", {code : 200});
};

handler.unhide_room = function(msg, session, next) {
    var roomname = msg["roomname"];
    if (roomname) {
        var room = RoomManager.getInstance().getRoomByName(roomname);
        if (room) {
            room.setHidden(false);
            next(null, {code : 200, message : 'UnHide room ' + roomname + ' success'});
        } else {
            next(null, {code : 500, message : 'Room ' + roomname + ' not exist'});
        }
    } else {
        next(null, {code : 500, message : 'Roomname ' + roomname + ' not exist'});
    }
    messageService.pushMessageToSession(session, "unhide_room", {code : 200});
};

handler.unhide_all_room = function(msg, session, next) {
    RoomManager.getInstance().unHideAll();
    next(null, {code : 200, message : 'UnHide All success'});
    messageService.pushMessageToSession(session, "unhide_all_room", {code : 200});
};

handler.reset_room = function(msg, session, next) {
    var roomname = msg["roomname"];
    if (roomname) {
        var room = RoomManager.getInstance().getRoomByName(roomname);
        if (room) {
            room.reset();
            next(null, {code : 200, message : 'Reset room ' + roomname + ' success'});
        } else {
            next(null, {code : 500, message : 'Room ' + roomname + ' not exist'});
        }
    } else {
        next(null, {code : 500, message : 'Roomname ' + roomname + ' not exist'});
    }
    messageService.pushMessageToSession(session, "reset_room", {code : 200});
};

handler.shut_down = function(msg, session, next) {
    var notifyTask = new NotifyServerDownTask();
    notifyTask.run();
    messageService.pushMessageToSession(session, "shut_down", {code : 200});
    next(null, {code : 200});
};

handler.reload_config = function(msg, session, next) {
    try {
        var zone = pomelo.app.zone;
        zone.reload();
        next(null, {code : 200});
    } catch (e) {
        console.log(e.stack);
        next(null, {code : 500});
    }
};

handler.checkCardParams = function(cardCode, cardSerial, type) {
    if (!cardCode || !cardSerial || !type) {
        return false;
    }
    if (type === Telco.VIET_TEL.getCode()) {
        if (cardCode.length < 13) {
            return false;
        }
        if (cardSerial.length < 11) {
            return false;
        }
    } else if (type === Telco.MOBI.getCode()) {
        if (cardCode.length < 12) {
            return false;
        }
        if (cardSerial.length < 15) {
            return false;
        }
    } else if (type === Telco.VINA.getCode()) {
        if (cardCode.length < 14) {
            return false;
        }
        if (cardSerial.length < 9) {
            return false;
        }
    }
    return true;
};