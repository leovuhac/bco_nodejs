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
var geoip = require('geoip-lite');
var Common = require('../../../lib/common/common');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.ping = function(msg, session, next) {
    var received = Date.now();
    var clientTime = msg.t;
    if (clientTime) {
        var difference = received - clientTime;
        messageService.pushMessageToSession(session, 'pong', {d : difference});
    }
    next(null, {code : Consts.OK});
};

/**
 * L?y thông tin user khi v?a login xong
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
handler.user_info = function(msg, session, next) {
    try {
        var self = this;
        var userManagerService = self.app.get('userManagerService');
        var user = userManagerService.getUserByName(session.uid);
        var title = msg[ParamsKey.TITLE] || '';
        var avatar = msg[ParamsKey.AVATAR] || '';
        var platform = msg[ParamsKey.PLATFORM] || '';
        var deviceId = msg[ParamsKey.DEVICE_ID] || '';
        var editionId = msg[ParamsKey.EDITION_ID];
        var buildId = msg[ParamsKey.BUILD_ID];
        var infoForBot = msg[ParamsKey.INFO_FOR_BOT] || false;
        if (!user) {
            user = new User(session, session.uid);
            userManagerService.addUser(user);
        }
        var database = Database.getInstance();
        var userData = null;
        var userMoney = 0;
        var userGold = 0;
        var bonusQueue = [];
        var goldBonusQueue = [];
        var inviteCode = null;
        Debug.game(session.uid, "lobbyHandler.user_info" + JSON.stringify(msg));
        database.getUserByName(user.getName(), function (err, res) {
            if (res) {
                userData = res;
                if (infoForBot) {
                    if (userData.is_bot !== 1) {
                        var notValidReqInfo = {};
                        notValidReqInfo[ParamsKey.SUCCESS] = false;
                        notValidReqInfo[ParamsKey.MESSAGE] = 'Đây không phải là user bot';
                        messageService.pushMessageToSession(session, Commands.USER_INFO, notValidReqInfo);
                    }
                }
                if (!userData.ip_address) {
                    userData.ip_address = '';
                }
                user.setIpAddress(userData.ip_address);
                if (userData.ip_address.indexOf('192.168.1') >= 0) {
                    user.setIpAddress('117.6.79.157');
                }
                if (userData.reg_type === Consts.LOGIN_TYPE.FACEBOOK) {
                    if (title.length > 0) {
                        database.updateUserByName(user.getName(), 'title', title);
                        userData.title = title;
                    }
                    if (avatar.length > 0) {
                        database.updateUserByName(user.getName(), 'avatar', avatar);
                        userData.avatar = avatar;
                    }
                }
                inviteCode = userData.invite_code;

                userMoney = userData.money;
                userGold = userData.gold;

                async.waterfall([
                    function(cb) {
                        database.getGoldBonusQueue(user.getName(), cb);
                    }, function(res, cb) {
                        if (res) {
                            goldBonusQueue = res;
                        }
                        database.getMoneyBonusQueue(user.getName(), cb);
                    }, function(res, cb) {
                        if (res) {
                            bonusQueue = res;
                        }
                        for (var i = 0; i < bonusQueue.length; i++) {
                            var oneBonusE = bonusQueue[i];
                            database.addUserMoney(user.getName(), oneBonusE.money_bonus, oneBonusE.message);
                            database.insertMoneyBonusLog(user.getName(), userData.title, oneBonusE.money_bonus, userMoney,
                                userMoney + oneBonusE.money_bonus, 0, userData.partner, oneBonusE.admin_name, oneBonusE.message);
                            database.insertUserMoneyTrace(user.getName(), userData.title, Consts.MONEY_TRACE_MONEY_BONUS, Consts.LOBBY, '', 0, userMoney,
                                userMoney + oneBonusE.money_bonus, oneBonusE.money_bonus, 0, userData.partner, '');
                            database.deleteMoneyBonusQueue(oneBonusE.id);
                            database.insertUserMessage(user.getName(), 'Cộng Kim cương', 'Cộng ' + oneBonusE.money_bonus + ' KC lý do : ' + oneBonusE.message,
                                Consts.USER_MESSAGE.TYPE.ADMIN_SEND, 'admin');
                            userMoney += oneBonusE.money_bonus;
                        }

                        for (var i = 0; i < goldBonusQueue.length; i++) {
                            var oneBonusE = goldBonusQueue[i];
                            database.addUserGold(user.getName(), oneBonusE.gold_bonus, oneBonusE.message);
                            database.insertGoldBonusLog(user.getName(), userData.title, oneBonusE.gold_bonus, userGold,
                                userGold + oneBonusE.gold_bonus, 0, userData.partner, oneBonusE.admin_name, oneBonusE.message);
                            database.deleteGoldBonusQueue(oneBonusE.id);
                            database.insertUserMessage(user.getName(), 'Cộng Vàng', 'Cộng ' + oneBonusE.gold_bonus + ' Vàng lý do : ' + oneBonusE.message,
                                Consts.USER_MESSAGE.TYPE.ADMIN_SEND, oneBonusE.admin_name);
                            userGold += oneBonusE.gold_bonus;
                        }

                        user.setProperty(UserFlag.TITLE, userData.title);
                        user.setProperty(UserFlag.PHONE_NUMBER, userData.phone);
                        user.setProperty(UserFlag.AVATAR, userData.avatar);
                        user.setProperty(UserFlag.MONEY, userMoney);
                        user.setProperty(UserFlag.PLATFORM, userData.platform.toLowerCase());
                        user.setProperty(UserFlag.VERSION, userData.version);
                        user.setProperty(UserFlag.DEVICE_ID, userData.device_id);
                        user.setProperty(UserFlag.PARTNER_ID, userData.partner);
                        user.setProperty(UserFlag.SECRET_KEY, userData.secret_key);
                        user.setProperty(UserFlag.LOCATION, Consts.GAME_LOCATION.LOBBY);
                        user.setProperty(UserFlag.GOLD, userGold);
                        user.setProperty(UserFlag.LEVEL, 0);
                        user.setProperty(UserFlag.CONFIRM_INVITE_CODE, userData.confirm_invite_code);
                        user.setProperty(UserFlag.IS_BOT, userData.is_bot);

                        if (editionId && editionId.length > 0) {
                            self.checkEdition(editionId, platform, userData.partner);
                        }

                        if (!user.getProperty(UserFlag.FIRST_USERINFO)) {
                            self.sendLobbyInfo(user, userData, session, msg);
                            self.sendPopupInfo(user, userData, session, msg);
                            user.setProperty(UserFlag.FIRST_USERINFO, true);
                        }

                        var reqInfo = {};
                        reqInfo[ParamsKey.TITLE] = userData.title;
                        reqInfo[ParamsKey.AVATAR] = userData.avatar;
                        reqInfo[ParamsKey.PHONE] = userData.phone;
                        reqInfo[ParamsKey.MONEY] = userMoney;
                        reqInfo[ParamsKey.SECRET_KEY] = userData.secret_key;
                        reqInfo[ParamsKey.ID] = userData.id;
                        reqInfo[ParamsKey.GOLD] = userGold;
                        if (inviteCode) {
                            reqInfo[ParamsKey.INVITE_CODE] = inviteCode;
                        }
                        if (userData.confirm_invite_code === 0) {
                            reqInfo[ParamsKey.CAN_CONFIRM_INVITE_CODE] = true;
                        } else {
                            reqInfo[ParamsKey.CAN_CONFIRM_INVITE_CODE] = false;
                        }

                        messageService.pushMessageToSession(session, Commands.USER_INFO, reqInfo);

                        database.countUnreadMessage(user.getName(), function (err, res) {
                            if (res) {
                                if (res > 0) {
                                    var messageUnread = {};
                                    messageUnread[ParamsKey.COUNT] = res;
                                    messageService.pushMessageToSession(session, Commands.UNREAD_MESSAGE, messageUnread);
                                }
                            }
                        });

                        cb(null);
                    }
                ], function(err) {});

                if (userData.account_state === Consts.ACCOUNT_STATE.EVER_LOGIN) {
                    database.updateUserByName(user.getName(), 'account_state', Consts.ACCOUNT_STATE.ACTIVE);
                }
                database.getUserStatistic(user.getName(), function (err, res) {
                    if (!res) {
                        database.insertUserStatistic(user.getName());
                    } else {
                        if (res.level > 0) {
                            user.setProperty(UserFlag.LEVEL, res.level);
                        } else {
                            user.setProperty(UserFlag.LEVEL, 0);
                        }
                    }
                });
            }
        });
    } catch (e) {
        Debug.error(Consts.LOBBY, e);
    }
    next(null, /*{code : Consts.OK}*/{});
};

/**
 * Nh?n m?ng thông tin update [{field : ... , value : ...}, ...]
 * @param msg
 * @param session
 * @param next
 */
handler.update_info = function(msg, session, next) {
    try {
        var self = this;
        var database = Database.getInstance();
        var user = session.get('user');
        var listInfo = msg[ParamsKey.ARRAY];
        Debug.game(session.uid, "lobbyHandler.update_info" + JSON.stringify(msg));
        if (!listInfo || listInfo.length === 0) {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Array info not valid';
            messageService.pushMessageToSession(session, Commands.UPDATE_INFO, reqInfo);
        } else {
            var reqInfo = {};
            for (var i = 0; i < listInfo.length; i++) {
                var aInfo = listInfo[i];
                var field = aInfo[ParamsKey.FIELD];
                var value = aInfo[ParamsKey.VALUE];
                //database.updateUserByName(user.getName(), field, value);
                if (field === 'title') {
                    var isFoundSpecial = /^[a-zA-Z0-9- ]*$/.test(value);
                    if (!isFoundSpecial && value.length < 4) {
                        reqInfo[ParamsKey.SUCCESS] = false;
                        reqInfo[ParamsKey.MESSAGE] = 'Title invalid';
                        reqInfo[ParamsKey.FIELD] = field;
                        messageService.pushMessageToSession(session, Commands.UPDATE_INFO, reqInfo);
                    } else if (user.getName() === value) {
                        reqInfo[ParamsKey.SUCCESS] = false;
                        reqInfo[ParamsKey.MESSAGE] = 'Tên hiển thị không được trùng với tên đăng nhập';
                        reqInfo[ParamsKey.FIELD] = field;
                        messageService.pushMessageToSession(session, Commands.UPDATE_INFO, reqInfo);
                    } else {
                        database.getUserByTitle(value, function (err, res) {
                            if (res) {
                                reqInfo[ParamsKey.SUCCESS] = false;
                                reqInfo[ParamsKey.MESSAGE] = 'Tên hiển thị đã tồn tại';
                                reqInfo[ParamsKey.FIELD] = field;
                                messageService.pushMessageToSession(session, Commands.UPDATE_INFO, reqInfo);
                            } else {
                                reqInfo[ParamsKey.SUCCESS] = true;
                                reqInfo[ParamsKey.MESSAGE] = 'Cập nhật tên hiển thị thành công';
                                reqInfo[ParamsKey.FIELD] = field;
                                reqInfo[ParamsKey.VALUE] = value;
                                messageService.pushMessageToSession(session, Commands.UPDATE_INFO, reqInfo);
                                user.setProperty(UserFlag.TITLE, value);
                                database.updateUserByName(user.getName(), field, value);
                            }
                        });
                    }
                }

                if (field === 'phone') {
                    if (value.length > 0) {
                        reqInfo[ParamsKey.SUCCESS] = true;
                        reqInfo[ParamsKey.MESSAGE] = 'Cập nhật SĐT thành công';
                        reqInfo[ParamsKey.FIELD] = field;
                        reqInfo[ParamsKey.VALUE] = value;
                        messageService.pushMessageToSession(session, Commands.UPDATE_INFO, reqInfo);
                        user.setProperty(UserFlag.PHONE_NUMBER, value);
                        database.updateUserByName(user.getName(), field, value);
                    } else {
                        reqInfo[ParamsKey.SUCCESS] = false;
                        reqInfo[ParamsKey.MESSAGE] = 'Phone invalid';
                        reqInfo[ParamsKey.FIELD] = field;
                        messageService.pushMessageToSession(session, Commands.UPDATE_INFO, reqInfo);
                    }
                }

                if (field === 'avatar') {
                    if (value.length > 0) {
                        reqInfo[ParamsKey.SUCCESS] = true;
                        reqInfo[ParamsKey.MESSAGE] = 'Cập nhật avatar thành công';
                        reqInfo[ParamsKey.FIELD] = field;
                        reqInfo[ParamsKey.VALUE] = value;
                        messageService.pushMessageToSession(session, Commands.UPDATE_INFO, reqInfo);
                        user.setProperty(UserFlag.AVATAR, value);
                        database.updateUserByName(user.getName(), field, value);
                    } else {
                        reqInfo[ParamsKey.SUCCESS] = false;
                        reqInfo[ParamsKey.MESSAGE] = 'Avatar link invalid';
                        reqInfo[ParamsKey.FIELD] = field;
                        messageService.pushMessageToSession(session, Commands.UPDATE_INFO, reqInfo);
                    }
                }
            }
        }
    } catch (e) {
        Debug.error(Consts.LOBBY, e);
    }
    next(null, /*{code : Consts.OK}*/{});
};

handler.freeplay = function(msg, session, next) {
    var self = this;
    var roomSettingMap = RoomSettingManager.getInstance().getSettingMap(Consts.GAME_TYPE.FREE_PLAY);
    var roomManager = RoomManager.getInstance();
    var roomSettingFind = null;
    var user = session.get('user');
    if (user.getProperty(UserFlag.IS_BOT) !== 1) {
        //User binh thuong
        //Tim theo cach binh thuong
        for (var k in roomSettingMap) {
            var setting = roomSettingMap[k];
            var numberPlayer = setting.numberPlayer;
            var maxPlayer = setting.maxPlayer;
            if (numberPlayer < maxPlayer - 1 && setting.getRoomState() === Consts.ROOM_STATE.ACTIVE) {
                roomSettingFind = setting;
                break;
            }
        }
        if (roomSettingFind) {
            var reqInfo = {};
            reqInfo[ParamsKey.ROOM] = roomSettingFind.name;
            messageService.pushMessageToSession(session, Commands.FREEPLAY, reqInfo);
            Debug.game(session.uid, "lobbyHandler.freeplay " + roomSettingFind.name);
        } else {
            var reqInfo = {};
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Can not find room valid';
            messageService.pushMessageToSession(session, Commands.FREEPLAY, reqInfo);
        }
    } else {
        //User la bot
        for (var k in roomSettingMap) {
            var setting = roomSettingMap[k];
            var numberPlayer = setting.numberPlayer;
            var maxPlayer = setting.maxPlayer;
            var room = roomManager.getRoomByName(setting.getName());
            if (numberPlayer < maxPlayer && setting.getRoomState() === Consts.ROOM_STATE.ACTIVE && !room.gameController.containBot()) {
                roomSettingFind = setting;
                break;
            }
        }
        if (!roomSettingFind) {
            for (var k in roomSettingMap) {
                var setting = roomSettingMap[k];
                var numberPlayer = setting.numberPlayer;
                var maxPlayer = setting.maxPlayer;
                if (numberPlayer < maxPlayer && setting.getRoomState() === Consts.ROOM_STATE.ACTIVE) {
                    roomSettingFind = setting;
                    break;
                }
            }
        }
        if (roomSettingFind) {
            var reqInfo = {};
            reqInfo[ParamsKey.ROOM] = roomSettingFind.name;
            messageService.pushMessageToSession(session, Commands.FREEPLAY, reqInfo);
        } else {
            var reqInfo = {};
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Can not find room valid';
            messageService.pushMessageToSession(session, Commands.FREEPLAY, reqInfo);
        }
    }
    next(null, /*{code : Consts.OK}*/{});
};

/**
 * User vào ch?i ch? ?? ch?i ngay. Ch?n 1 phòng ch?i ngay còn tr?ng và g?i v? cho user
 */
handler.quickplay = function(msg, session, next) {
    var self = this;
    var user = session.get('user');
    var roomSettingMap = RoomSettingManager.getInstance().getSettingMap(Consts.GAME_TYPE.QUICK_PLAY);
    var roomManager = RoomManager.getInstance();
    var roomSettingFind = null;
    //Tim theo cach binh thuong
    //for (var k in roomSettingMap) {
    //    var setting = roomSettingMap[k];
    //    var numberPlayer = setting.numberPlayer;
    //    var maxPlayer = setting.maxPlayer;
    //    if (numberPlayer < maxPlayer && setting.getRoomState() === Consts.ROOM_STATE.ACTIVE) {
    //        roomSettingFind = setting;
    //        break;
    //    }
    //}
    //if (roomSettingFind) {
    //    var reqInfo = {};
    //    reqInfo[ParamsKey.ROOM] = roomSettingFind.name;
    //    messageService.pushMessageToSession(session, Commands.QUICKPLAY, reqInfo);
    //} else {
    //    reqInfo[ParamsKey.SUCCESS] = false;
    //    reqInfo[ParamsKey.MESSAGE] = 'Can not find room valid';
    //    messageService.pushMessageToSession(session, Commands.QUICKPLAY, reqInfo);
    //}
    //Tim theo cach moi
    var validRoomSettingsHighPriority = [];
    var validRoomSettingsLowPriority = [];
    var userMoney = Number(user.getProperty(UserFlag.MONEY));
    if (user.getProperty(UserFlag.IS_BOT) !== 1) {
        //Loc room cho user thuong
        for (var k in roomSettingMap) {
            var setting = roomSettingMap[k];
            var numberPlayer = setting.numberPlayer;
            var maxPlayer = setting.maxPlayer;
            if (numberPlayer < maxPlayer && setting.getRoomState() === Consts.ROOM_STATE.ACTIVE) {
                var room = roomManager.getRoomByName(setting.getName());
                if (room && room.getGameControlelr().validSameLevelMoney(userMoney)) {
                    if (numberPlayer > 0) {
                        validRoomSettingsHighPriority.push(setting);
                    } else {
                        validRoomSettingsLowPriority.push(setting);
                    }
                }
            }
        }
    } else {
        //Loc room cho user bot
        for (var k in roomSettingMap) {
            var setting = roomSettingMap[k];
            var numberPlayer = setting.numberPlayer;
            var maxPlayer = setting.maxPlayer;
            if (numberPlayer < maxPlayer && setting.getRoomState() === Consts.ROOM_STATE.ACTIVE) {
                var room = roomManager.getRoomByName(setting.getName());
                if (room && !room.getGameControlelr().containBot()) {
                    if (numberPlayer > 0) {
                        validRoomSettingsHighPriority.push(setting);
                    } else {
                        validRoomSettingsLowPriority.push(setting);
                    }
                }
            }
        }
    }
    if (validRoomSettingsHighPriority.length > 0) {
        var rIndex = utils.random(validRoomSettingsHighPriority.length);
        roomSettingFind = validRoomSettingsHighPriority[rIndex];
    }
    if (!roomSettingFind) {
        if (validRoomSettingsLowPriority.length > 0) {
            var rIndex = utils.random(validRoomSettingsLowPriority.length);
            roomSettingFind = validRoomSettingsLowPriority[rIndex];
        }
    }
    if (!roomSettingFind) {
        for (var k in roomSettingMap) {
            var setting = roomSettingMap[k];
            var numberPlayer = setting.numberPlayer;
            var maxPlayer = setting.maxPlayer;
            if (numberPlayer > 0 && numberPlayer < maxPlayer && setting.getRoomState() === Consts.ROOM_STATE.ACTIVE) {
                roomSettingFind = setting;
                break;
            }
        }
    }
    if (!roomSettingFind) {
        for (var k in roomSettingMap) {
            var setting = roomSettingMap[k];
            var numberPlayer = setting.numberPlayer;
            var maxPlayer = setting.maxPlayer;
            if (numberPlayer < maxPlayer && setting.getRoomState() === Consts.ROOM_STATE.ACTIVE) {
                roomSettingFind = setting;
                break;
            }
        }
    }
    if (roomSettingFind) {
        var reqInfo = {};
        reqInfo[ParamsKey.ROOM] = roomSettingFind.name;
        messageService.pushMessageToSession(session, Commands.QUICKPLAY, reqInfo);
        Debug.game(session.uid, "lobbyHandler.quickplay " + roomSettingFind.name);
    } else {
        var reqInfo = {};
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Không tìm thấy phòng hoặc chức năng đang tạm khóa';
        messageService.pushMessageToSession(session, Commands.QUICKPLAY, reqInfo);
    }
    next(null, /*{code : Consts.OK}*/{});
};

/**
 * Lấy danh sách phòng chơi thách đấu. Các bàn có người chơi + mỗi mức cược 2 bàn trống
 * Filter theo mức cược, số người chơi
 * Sắp xếp tăng dần, giảm dần theo mức cược, số người chơi
 */
handler.challenge_list_room = function(msg, session, next) {
    try {
        var self = this;
        var user = session.get('user');
        var roomSettingManager = RoomSettingManager.getInstance();
        var tableFee = msg[ParamsKey.TABLE_FEE];
        user.setProperty(UserFlag.LOCATION, Consts.GAME_LOCATION.CL_CHOICE_ROOM);
        var reqInfo = {};
        var listRoomResult = [];
        var listRoomResultEmpty = [];
        var listRoomResultHas = [];

        var listRoomSettingByFee = [];
        var listRoomSettingByHas = [];
        if (tableFee) {
            listRoomSettingByFee = roomSettingManager.getByTableFee(tableFee);
            for (var i = 0; i < listRoomSettingByFee.length; i++) {
                var roomSetting = listRoomSettingByFee[i];
                var roomName = roomSetting.getName();
                var room = RoomManager.getInstance().getRoomByName(roomName);
                if (room && !room.isHidden()) {
                    var obj = {};
                    obj[ParamsKey.INDEX] = roomSetting.index;
                    obj[ParamsKey.NAME] = roomSetting.getName();
                    obj[ParamsKey.TABLE_FEE] = roomSetting.getTableFee();
                    obj[ParamsKey.MIN_JOIN_ROOM] = roomSetting.getMinJoinRoom();
                    obj[ParamsKey.PASSWORD] = room.isPasswordProtected();
                    obj[ParamsKey.MAX_PLAYER] = roomSetting.getMaxPlayer();
                    obj[ParamsKey.NUMBER_PLAYERS] = roomSetting.getNumberPlayer();
                    if (roomSetting.getNumberPlayer() === 0) {
                        listRoomResultEmpty.push(obj);
                    } else {
                        listRoomResultHas.push(obj);
                    }
                }

            }
        } else {
            var allSetting = roomSettingManager.getSettingMap(Consts.GAME_TYPE.CHALLENGE);
            var mapTableFeeEmpty = {};
            for (var k in allSetting) {
                var roomSetting = allSetting[k];
                if (roomSetting.getNumberPlayer() === 0) {
                    if (!mapTableFeeEmpty[roomSetting.getTableFee()]) {
                        mapTableFeeEmpty[roomSetting.getTableFee()] = [];
                    }
                    mapTableFeeEmpty[roomSetting.getTableFee()].push(roomSetting);
                }
            }
            for (var k in allSetting) {
                var roomSetting = allSetting[k];
                if (roomSetting.getNumberPlayer() > 0) {
                    listRoomSettingByHas.push(roomSetting);
                }
            }
            for (var i = 0; i < listRoomSettingByHas.length - 1; i++) {
                for (var j = i + 1; j < listRoomSettingByHas.length; j++) {
                    var r_i = listRoomSettingByHas[i];
                    var r_j = listRoomSettingByHas[j];
                    if (r_i.getTableFee() < r_j.getTableFee()) {
                        var temp = listRoomSettingByHas[i];
                        listRoomSettingByHas[i] = listRoomSettingByHas[j];
                        listRoomSettingByHas[j] = temp;
                    }
                }
            }
            for (var k in mapTableFeeEmpty) {
                var count = 0;
                var listRoomSettingByEmpty = mapTableFeeEmpty[k];
                for (var i = 0; i < listRoomSettingByEmpty.length; i++) {
                    var roomSetting = listRoomSettingByEmpty[i];
                    var roomName = roomSetting.getName();
                    var room = RoomManager.getInstance().getRoomByName(roomName);
                    if (room && !room.isHidden()) {
                        var obj = {};
                        obj[ParamsKey.INDEX] = roomSetting.index;
                        obj[ParamsKey.NAME] = roomSetting.getName();
                        obj[ParamsKey.TABLE_FEE] = roomSetting.getTableFee();
                        obj[ParamsKey.MIN_JOIN_ROOM] = roomSetting.getMinJoinRoom();
                        obj[ParamsKey.PASSWORD] = room.isPasswordProtected();
                        obj[ParamsKey.MAX_PLAYER] = roomSetting.getMaxPlayer();
                        obj[ParamsKey.NUMBER_PLAYERS] = roomSetting.getNumberPlayer();
                        listRoomResultEmpty.push(obj);
                    }
                    count++;
                    if (count === 2) {
                        break;
                    }
                }
            }
            for (var i = 0; i < listRoomSettingByHas.length; i++) {
                var roomSetting = listRoomSettingByHas[i];
                var roomName = roomSetting.getName();
                var room = RoomManager.getInstance().getRoomByName(roomName);
                if (room && !room.isHidden()) {
                    var obj = {};
                    obj[ParamsKey.INDEX] = roomSetting.index;
                    obj[ParamsKey.NAME] = roomSetting.getName();
                    obj[ParamsKey.TABLE_FEE] = roomSetting.getTableFee();
                    obj[ParamsKey.MIN_JOIN_ROOM] = roomSetting.getMinJoinRoom();
                    obj[ParamsKey.PASSWORD] = room.isPasswordProtected();
                    obj[ParamsKey.MAX_PLAYER] = roomSetting.getMaxPlayer();
                    obj[ParamsKey.NUMBER_PLAYERS] = roomSetting.getNumberPlayer();
                    listRoomResultHas.push(obj);
                }
            }
        }
        for (var i = 0; i < listRoomResultHas.length; i++) {
            listRoomResult.push(listRoomResultHas[i]);
        }
        for (var i = 0; i < listRoomResultEmpty.length; i++) {
            listRoomResult.push(listRoomResultEmpty[i]);
        }
        reqInfo[ParamsKey.ARRAY] = listRoomResult;
        messageService.pushMessageToSession(session, Commands.CHALLENGE_LIST_ROOM, reqInfo);
        Debug.game(session.uid, "lobbyHandler.challenge_list_room " + JSON.stringify(msg));
    } catch (e) {
        Debug.error(Consts.LOBBY, e);
    }
    next(null, /*{code : Consts.OK}*/{});
};

/**
 *
 */
handler.challenge_find_room = function(msg, session, next) {
    try {
        var user = session.get('user');
        var roomSettingFound = null;
        var listRoomSettingEmpty = [];
        var listRoomSettingHas = [];
        var roomSettingManager = RoomSettingManager.getInstance();
        var allSetting = roomSettingManager.getSettingMap(Consts.GAME_TYPE.CHALLENGE);
        var userMoney = Number(user.getProperty(UserFlag.MONEY));
        for (var k in allSetting) {
            var roomSetting = allSetting[k];
            if (roomSetting.getNumberPlayer() > 0 && roomSetting.getNumberPlayer() < roomSetting.getMaxPlayer()
                && roomSetting.getMinJoinRoom() < userMoney) {
                listRoomSettingHas.push(roomSetting);
            }
        }
        for (var k in allSetting) {
            var roomSetting = allSetting[k];
            if (roomSetting.getNumberPlayer() === 0 && roomSetting.getMinJoinRoom() < userMoney) {
                listRoomSettingEmpty.push(roomSetting);
            }
        }
        if (listRoomSettingHas.length > 0) {
            var t = utils.random(listRoomSettingHas.length);
            roomSettingFound = listRoomSettingHas[t];
        } else {
            roomSettingFound = listRoomSettingEmpty[0];
        }
        if (roomSettingFound) {
            var reqInfo = {};
            reqInfo[ParamsKey.ROOM] = roomSettingFound.getName();
            reqInfo[ParamsKey.INDEX] = roomSettingFound.index;
            reqInfo[ParamsKey.NAME] = roomSettingFound.getName();
            reqInfo[ParamsKey.TABLE_FEE] = roomSettingFound.getTableFee();
            reqInfo[ParamsKey.MIN_JOIN_ROOM] = roomSettingFound.getMinJoinRoom();
            reqInfo[ParamsKey.PASSWORD] = false;
            reqInfo[ParamsKey.MAX_PLAYER] = roomSettingFound.getMaxPlayer();
            reqInfo[ParamsKey.NUMBER_PLAYERS] = roomSettingFound.getNumberPlayer();
            messageService.pushMessageToSession(session, Commands.CHALLENGE_FIND_ROOM, reqInfo);
        }
    } catch (e) {
        Debug.error(Consts.LOBBY, e);
    }
    next(null, /*{code : Consts.OK}*/{});
};

/**
 * Nguoi choi muon chon nhanh 1 bàn de choi. Chon bàn dua vào so tien cua nguoi choi, statistics cua nguoi choi, so nguoi cua bàn
 */
handler.challenge_quick_select_room = function(msg, session, next) {
    var self = this;
    var database = Database.getInstance();
    var reqInfo = {};
    var user = session.get('user');
    var roomSettingManager = RoomSettingManager.getInstance();
    var roomManager = RoomManager.getInstance();
    var roomTableFeeSmallerMoney = [];
    var roomPlaying = [];
    var roomEmpty = [];
    var allClSettings = roomSettingManager.getSettingMap(Consts.GAME_TYPE.CHALLENGE);
    for (var k in allClSettings) {
        var setting = allClSettings[k];
        if (setting.getTableFee() < user.getProperty(UserFlag.MONEY)) {
            roomTableFeeSmallerMoney.push(setting);
        }
    }
    if (roomTableFeeSmallerMoney.length === 0) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Can not find room valid';
        messageService.pushMessageToSession(session, Commands.CHALLENGE_QUICK_SELECT_ROOM, reqInfo);
    } else {
        for (var i = 0; i < roomTableFeeSmallerMoney.length; i++) {
            var setting = roomTableFeeSmallerMoney[i];
            if (setting.getNumberPlayer() > 0) {
                var room = roomManager.getRoomByName(setting.getName());
                if (room && (room.getGameControlelr().getGameState() === 2 || room.getGameControlelr().getGameState() === 0)) {
                    roomPlaying.push(setting);
                }
            } else {
                roomEmpty.push(setting);
            }
        }
        var t = utils.random(3);
        if (roomPlaying.length === 0) {
            t = 0;
        }
        var selectSetting = null;
        if (t === 0) {
            var randomIndex = utils.random(roomEmpty.length);
            selectSetting = roomEmpty[randomIndex];
        } else {
            var randomIndex = utils.random(roomPlaying.length);
            selectSetting = roomPlaying[randomIndex];
        }
        if (selectSetting) {
            reqInfo[ParamsKey.SUCCESS] = true;
            reqInfo[ParamsKey.MESSAGE] = 'success';
            reqInfo[ParamsKey.ROOM] = selectSetting.getName();
            messageService.pushMessageToSession(session, Commands.CHALLENGE_QUICK_SELECT_ROOM, reqInfo);
        } else {
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'Can not find room valid';
            messageService.pushMessageToSession(session, Commands.CHALLENGE_QUICK_SELECT_ROOM, reqInfo);
        }
    }
    next(null, /*{code : Consts.OK}*/{});
};

handler.get_user_statistic = function(msg, session, next) {
    var self = this;
    var database = Database.getInstance();
    var user = session.get('user');
    var username = msg[ParamsKey.NAME];
    var userGetInfo = null;
    if (!username) {
        username = user.getName();
        userGetInfo = user;
    } else {
        userGetInfo = pomelo.app.get('userManagerService').getUserByName(username);
    }
    Debug.game(session.uid, "lobbyHandler.get_user_statistic " + username);
    database.getUserByName(username, function(err, res) {
        var userData = res;
        if (userData) {
            database.getUserStatistic(username, function(err, res) {
                if (res) {
                    var userStatisitic = res;
                    var reqInfo = {};
                    reqInfo[ParamsKey.SUCCESS] = true;
                    reqInfo[ParamsKey.ID] = userData.id;
                    reqInfo[ParamsKey.TITLE] = userData.title;
                    reqInfo[ParamsKey.AVATAR] = userData.avatar;
                    if (!userGetInfo) {
                        reqInfo[ParamsKey.MONEY] = userData.money;
                    } else {
                        reqInfo[ParamsKey.MONEY] = userGetInfo.getProperty(UserFlag.MONEY);
                    }
                    if (userStatisitic.level >= 0) {
                        reqInfo[ParamsKey.LEVEL] = userStatisitic.level;
                    } else {
                        reqInfo[ParamsKey.LEVEL] = 0;
                    }
                    reqInfo[ParamsKey.CHALLENGE_WIN] = userStatisitic.challenge_win;
                    reqInfo[ParamsKey.CHALLENGE_LOST] = userStatisitic.challenge_lost;
                    reqInfo[ParamsKey.QUICKPLAY_MONEY_WIN] = userStatisitic.quickplay_money_win;
                    reqInfo[ParamsKey.QUICKPLAY_MONEY_LOST] = userStatisitic.quickplay_money_lost;
                    reqInfo[ParamsKey.CHALLENGE_MONEY_WIN] = userStatisitic.challenge_money_win;
                    reqInfo[ParamsKey.CHALLENGE_MONEY_LOST] = userStatisitic.challenge_money_lost;
                    reqInfo[ParamsKey.FISD_DEAD] = userStatisitic.fish_dead;
                    messageService.pushMessageToSession(session, Commands.GET_USER_STATISTIC, reqInfo);
                } else {
                    var reqInfo = {};
                    reqInfo[ParamsKey.SUCCESS] = false;
                    reqInfo[ParamsKey.MESSAGE] = 'Can not query statistic of user ' + username;
                    messageService.pushMessageToSession(session, Commands.GET_USER_STATISTIC, reqInfo);
                }
            });
        } else {
            var reqInfo = {};
            reqInfo[ParamsKey.SUCCESS] = false;
            reqInfo[ParamsKey.MESSAGE] = 'User name ' + username + ' invalid';
            messageService.pushMessageToSession(session, Commands.GET_USER_STATISTIC, reqInfo);
        }
    });
    next(null, /*{code : Consts.OK}*/{});
};

/**
 * L?y hòm th? c?a user, có phân trang
 * @param msg
 * @param session
 * @param next
 */
handler.get_user_message = function(msg, session, next) {
    var user = session.get('user');
    var username = user.getName();
    var state = msg[ParamsKey.STATE];
    var type = msg[ParamsKey.TYPE];
    var database = Database.getInstance();
    Debug.game(session.uid, "lobbyHandler.get_user_message " + username);

    function parseDoiThuongMessage(messageObj) {
        var title = messageObj.message_title;
        if (title.indexOf('[ĐỔI THƯỞNG]') >= 0) {
            var content = messageObj.message_content;
            var card_type = '';
            if (content.indexOf('Vina') >= 0) {
                card_type = Telco.VINA.getCode();
            } else if (content.indexOf('Viettel') >= 0) {
                card_type = Telco.VIET_TEL.getCode();
            } else if (content.indexOf('Mobi') >= 0) {
                card_type = Telco.MOBI.getCode();
            } else if (content.indexOf('HpCode') >= 0) {
                card_type = Telco.HPCARD.getCode();
            }
            var numberPattern = /\d+/g;
            var listNumberInContent = content.match(numberPattern);
            var amount = Number(listNumberInContent[1]) * 1000;
            var card_pin = listNumberInContent[3];
            var card_serial = listNumberInContent[2];
            var obj = {};
            obj[ParamsKey.TYPE] = card_type;
            obj[ParamsKey.CARD_AMOUNT] = amount;
            obj[ParamsKey.CARD_PIN] = card_pin;
            obj[ParamsKey.CARD_SERIAL] = card_serial;
            return obj;
        } else {
            return null;
        }
    }

    database.getUserMessage(type, state, username, function(err, res) {
        if (!res) {
            res = [];
        }
        var listMessages = res;
        for (var i = 0; i < listMessages.length; i++) {
            listMessages[i].gen_date = listMessages[i].gen_date.getTime();
            if (listMessages[i].message_title.indexOf('[ĐỔI THƯỞNG]') >= 0) {
                listMessages[i].type = Consts.USER_MESSAGE.TYPE.GIFT_EXCHANGE;
                var extrasObj = parseDoiThuongMessage(listMessages[i]);
                if (extrasObj) {
                    listMessages[i].extras = extrasObj;
                }
            }
        }
        var reqInfo = {};
        reqInfo[ParamsKey.SUCCESS] = true;
        reqInfo[ParamsKey.CONTENT] = listMessages;
        messageService.pushMessageToSession(session, Commands.GET_USER_MESSAGE, reqInfo);
    });
    next(null, /*{code : Consts.OK}*/{});
};

/**
 * ??c th? c?a user
 * @param msg
 * @param session
 * @param next
 */
handler.read_user_message = function(msg, session, next) {
    var user = session.get('user');
    var message_id = msg[ParamsKey.ID];
    var database = Database.getInstance();
    database.updateMessageState(message_id, Consts.USER_MESSAGE.STATE.READ);
    next(null, /*{code : Consts.OK}*/{});
};

handler.get_system_message = function(msg, session, next) {
    var user = session.get('user');
    var database = Database.getInstance();
    database.getSystemMessage(function(err, res) {
        if (!res) {
            res = [];
        }
        var listMessages = res;
        for (var i = 0; i < listMessages.length; i++) {
            listMessages[i].gen_date = listMessages[i].gen_date.getTime();
        }
        var reqInfo = {};
        reqInfo[ParamsKey.SUCCESS] = true;
        reqInfo[ParamsKey.CONTENT] = listMessages;
        messageService.pushMessageToSession(session, Commands.GET_SYSTEM_MESSAGE, reqInfo);
    });
    next(null, /*{code : Consts.OK}*/{});
};

/**
 * Nap tien bang the cua telco hoac hopepay
 * @param msg
 * @param session
 * @param next
 */
handler.recharge_card = function(msg, session, next) {
    var user = session.get('user');
    var cardPin = msg[ParamsKey.CARD_PIN];
    var cardSerial = msg[ParamsKey.CARD_SERIAL];
    var cardType = msg[ParamsKey.TYPE]; ///viettel, vinaphone, mobifone, hpcode
    var database = Database.getInstance();
    var gameConfig = GameConfig.getInstance();
    var userMoneyBefore = user.getProperty(UserFlag.MONEY);
    var partner = user.getProperty(UserFlag.PARTNER_ID);
    var userTitle = user.getProperty(UserFlag.TITLE);
    var bonusMoney = 0;
    var reqInfo = {};
    try {
        var valid = this.checkCardParams(cardPin, cardSerial, cardType);
        if (valid) {
            var cardChargeHelper = new SSGCardChargeHelper();
            cardChargeHelper.payment(user.getName(), cardPin, cardSerial, cardType, function(err, res) {
                var chargeInfo = res;
                var amount = chargeInfo['amount'];
                if (amount > 0) {
                    var cardExchangeRate = gameConfig.getCardExchangeRate();
                    var moneyRecharge = 0;
                    for (var i = 0; i < cardExchangeRate.length; i++) {
                        var oneExRate = cardExchangeRate[i];
                        if (oneExRate['card_amount'] === amount) {
                            moneyRecharge = oneExRate['money_in_game'];
                        }
                    }
                    bonusMoney = moneyRecharge;
                    //
                    user.addMoney(bonusMoney);
                    database.addUserMoney(user.getName(), bonusMoney, 'charge card ' + cardPin + " - " + cardSerial);
                    var userMoneyAfter = user.getProperty(UserFlag.MONEY);
                    database.insertUserMoneyTrace(user.getName(), userTitle, Consts.MONEY_TRACE_CARD_RECHARGE, Consts.LOBBY, '', 0, userMoneyBefore,
                        userMoneyAfter, bonusMoney, 0, partner, '');
                    database.logCardExchange(cardPin, cardSerial, cardType, bonusMoney, user.getName(), userMoneyBefore, userMoneyAfter,
                        chargeInfo['description'], chargeInfo['trans_id'], amount, partner);
                    var message = 'Nạp thẻ ' + cardType + ", pin : " + cardPin + ", serial : " + cardSerial + ", giá : " + amount;
                    database.insertUserMessage(user.getName(), 'Nạp tiền', message, Consts.USER_MESSAGE.TYPE.PAYMENT, Consts.ADMIN);
                    //
                    reqInfo[ParamsKey.SUCCESS] = true;
                    reqInfo[ParamsKey.MESSAGE] = 'Nạp tiền thành công. Mệnh giá ' + amount + ' số tiền được cộng trong game ' + bonusMoney;
                    reqInfo[ParamsKey.MONEY] = userMoneyAfter;
                    reqInfo[ParamsKey.MONEY_CHANGE] = bonusMoney;
                    reqInfo[ParamsKey.CARD_AMOUNT] = amount;
                    messageService.pushMessageToSession(session, Commands.RECHARGE_CARD, reqInfo);
                } else {
                    reqInfo[ParamsKey.SUCCESS] = false;
                    reqInfo[ParamsKey.MESSAGE] = chargeInfo['description'];
                    messageService.pushMessageToSession(session, Commands.RECHARGE_CARD, reqInfo);
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
        }
    } catch (e) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Thanh toán không thành công';
        messageService.pushMessageToSession(session, Commands.RECHARGE_CARD, reqInfo);
        Debug.error(Consts.LOBBY, e);
    }
    next(null, {code : Consts.OK});
};

handler.gift_exchange = function(msg, session, next) {
    var user = session.get('user');

    var gift_id = msg[ParamsKey.ID];

    var partner = user.getProperty(UserFlag.PARTNER_ID);
    var userTitle = user.getProperty(UserFlag.TITLE);
    var database = Database.getInstance();
    var gameConfig = GameConfig.getInstance();
    var reqInfo = {};
    try {
        database.getGift(gift_id, function(err, res) {
            var giftInfo = res;
            if (res) {
                database.getUserByName(user.getName(), function(err, res) {
                    if (res) {
                        var userMoneyDb = res.money;
                        var moneyBefore = userMoneyDb;
                        ///
                        user.updateMoney(userMoneyDb);
                        ///
                        if (userMoneyDb - giftInfo.fee >= gameConfig.money_cashout_remain) {
                            var moneyChange = -giftInfo.fee;
                            user.addMoney(moneyChange);
                            database.addUserMoney(user.getName(), moneyChange, 'gift exchange ' + gift_id);
                            var userMoneyAfter = user.getProperty(UserFlag.MONEY);
                            database.insertUserMoneyTrace(user.getName(), userTitle, Consts.MONEY_TRACE_GIFT_EXCHANGE, Consts.LOBBY, '', 0, moneyBefore,
                                userMoneyAfter, moneyChange, 0, partner, '');
                            database.insertGiftRequest(gift_id, user.getName(), moneyBefore, userMoneyAfter, user.getName() + Date.now() + gift_id,moneyChange);
                            //
                            reqInfo[ParamsKey.SUCCESS] = true;
                            reqInfo[ParamsKey.MESSAGE] = 'Thành công. Vật phẩm sẽ được gửi tới bạn sớm nhất. Vui lòng check hòm thư cá nhân để kiểm tra vật phẩm';
                            reqInfo[ParamsKey.MONEY_CHANGE] = moneyChange;
                            reqInfo[ParamsKey.MONEY] = user.getProperty(UserFlag.MONEY);
                            messageService.pushMessageToSession(session, Commands.GIFT_EXCHANGE, reqInfo);
                        } else {
                            reqInfo[ParamsKey.SUCCESS] = false;
                            reqInfo[ParamsKey.MESSAGE] = 'Không đủ tiền. Số tiền của bạn sau khi đổi thưởng phải còn dư ' + gameConfig.money_cashout_remain;
                            messageService.pushMessageToSession(session, Commands.GIFT_EXCHANGE, reqInfo);
                        }
                    } else {
                        reqInfo[ParamsKey.SUCCESS] = false;
                        reqInfo[ParamsKey.MESSAGE] = 'Không tìm thấy user trong hệ thống';
                        messageService.pushMessageToSession(session, Commands.GIFT_EXCHANGE, reqInfo);
                    }
                });
            } else {
                reqInfo[ParamsKey.SUCCESS] = false;
                reqInfo[ParamsKey.MESSAGE] = 'Không tìm thấy vật phẩm';
                messageService.pushMessageToSession(session, Commands.GIFT_EXCHANGE, reqInfo);
            }
        });
    } catch (e) {
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Đổi thưởng không thành công';
        messageService.pushMessageToSession(session, Commands.GIFT_EXCHANGE, reqInfo);
        Debug.error(Consts.LOBBY, e);
    }

    next(null, {code : Consts.OK});
};

handler.gift_info = function(msg, session, next) {
    var user = session.get('user');
    var database = Database.getInstance();
    var reqInfo = {};
    database.getAllGiftInfo(function(err, resArr){
        reqInfo[ParamsKey.SUCCESS] = true;
        reqInfo[ParamsKey.CONTENT] = resArr;
        messageService.pushMessageToSession(session, Commands.GIFT_INFO, reqInfo);
    });
    next(null, {code : Consts.OK});
};

handler.fish_info = function(msg, session, next) {
    var user = session.get('user');
    var database = Database.getInstance();
    var reqInfo = {};
    var resArr = [];
    database.getAllFish(function(err, res) {
        for (var i = 0; i < res.length; i++) {
            var obj = {};
            obj[ParamsKey.NAME] = res[i].name;
            obj[ParamsKey.MONEY] = res[i].prize_min;
            obj[ParamsKey.ID] = res[i].id;
            resArr.push(obj);
        }
        reqInfo[ParamsKey.SUCCESS] = true;
        reqInfo[ParamsKey.CONTENT] = resArr;
        messageService.pushMessageToSession(session, Commands.FISH_INFO, reqInfo);
    });
    next(null, {code : Consts.OK});
};

//handler.top_rich = function(msg, session, next) {
//    var user = session.get('user');
//    var database = Database.getInstance();
//    var reqInfo = {};
//    database.getUserTopRich(function(err, res){
//        if (res) {
//            var listUser = [];
//            for (var i = 0; i < res.length; i++) {
//                var oneUser = res[i];
//                var obj = {};
//                obj[ParamsKey.ID] = oneUser.id;
//                obj[ParamsKey.NAME] = oneUser.name;
//                obj[ParamsKey.TITLE] = oneUser.title;
//                obj[ParamsKey.MONEY] = oneUser.money;
//                obj[ParamsKey.AVATAR] = oneUser.avatar;
//                listUser.push(obj);
//            }
//            reqInfo[ParamsKey.SUCCESS] = true;
//            reqInfo[ParamsKey.CONTENT] = listUser;
//            messageService.pushMessageToSession(session, Commands.TOP_RICH, reqInfo);
//        } else {
//            reqInfo[ParamsKey.SUCCESS] = false;
//            reqInfo[ParamsKey.MESSAGE] = "Gặp lỗi khi xử lý yêu cầu";
//            messageService.pushMessageToSession(session, Commands.TOP_RICH, reqInfo);
//        }
//    });
//    next(null, {code : Consts.OK});
//};

handler.top_rich = function(msg, session, next) {
    var user = session.get('user');
    var database = Database.getInstance();
    var reqInfo = {};
    var topRich = [];
    var topMammonMoney = [];
    async.waterfall([
        function(cb) {
            database.getUserTopRich(cb);
        }, function(res, cb) {
            if (res) {
                topRich = res;
            }
            database.getUserTopMammonMoney(cb);
        }, function(res, cb) {
            if (res) {
                topMammonMoney = res;
            }
            var listTopRich = [];
            var listTopMammonMoney = [];
            for (var i = 0; i < topRich.length; i++) {
                var oneUser = topRich[i];
                var obj = {};
                obj[ParamsKey.ID] = oneUser.id;
                obj[ParamsKey.NAME] = oneUser.name;
                obj[ParamsKey.TITLE] = oneUser.title;
                obj[ParamsKey.MONEY] = oneUser.money;
                obj[ParamsKey.AVATAR] = oneUser.avatar;
                if (oneUser.money > 0) {
                    listTopRich.push(obj);
                }
            }
            for (var i = 0; i < topMammonMoney.length; i++) {
                var oneUser = topMammonMoney[i];
                var obj = {};
                obj[ParamsKey.ID] = oneUser.id;
                obj[ParamsKey.NAME] = oneUser.name;
                obj[ParamsKey.TITLE] = oneUser.title;
                obj[ParamsKey.MONEY] = oneUser.fish_mammon_money;
                obj[ParamsKey.AVATAR] = oneUser.avatar;
                if (oneUser.fish_mammon_money > 0) {
                    listTopMammonMoney.push(obj);
                }
            }
            //
            var contentArr = [];
            var reqInfoTopRich = {};
            var reqInfoTopMammonMoney = {};
            reqInfoTopRich[ParamsKey.NAME] = 'Top đại gia';
            reqInfoTopRich[ParamsKey.ARRAY] = listTopRich;
            reqInfoTopMammonMoney[ParamsKey.NAME] = 'Top bắn cá vàng';
            reqInfoTopMammonMoney[ParamsKey.ARRAY] = listTopMammonMoney;
            contentArr.push(reqInfoTopRich);
            contentArr.push(reqInfoTopMammonMoney);
            reqInfo[ParamsKey.SUCCESS] = true;
            reqInfo[ParamsKey.CONTENT] = contentArr;
            messageService.pushMessageToSession(session, Commands.TOP_RICH, reqInfo);
            cb(null);
        }
    ], function(err) {});
    next(null, {});
};

handler.transaction_log = function(msg, session, next) {
    var user = session.get('user');
    var database = Database.getInstance();
    var rechargeCardLog = [];
    var rechargeMoneyArr = [];
    var giftExchangeArr = [];
    var giftExchange = [];
    var reqInfo = {};
    //async.waterfall([
    //        function(cb) {
    //            database.getCardExchangeLog(user.getName(), cb);
    //        }, function(res, cb) {
    //            rechargeCardLog = res;
    //            for (var i = 0; i < rechargeCardLog.length; i++) {
    //                var rechargeObject = rechargeCardLog[i];
    //                var moneyInfo = {};
    //                moneyInfo[ParamsKey.TIME] = rechargeObject["gen_date"].getTime();
    //                moneyInfo[ParamsKey.TYPE] = Consts.TRANACTION_TYPE.CARD_RECHARGE;
    //                moneyInfo[ParamsKey.DES] = "Thẻ " + rechargeObject["telco"] + " " + rechargeObject["fee"];
    //                rechargeMoneyArr.push(moneyInfo);
    //            }
    //            var reqInfo = {};
    //            reqInfo[ParamsKey.CARD_RECHARGE] = rechargeMoneyArr;
    //            messageService.pushMessageToSession(session, Commands.TRANSACTION_LOG, reqInfo);
    //        }
    //    ],
    //    function(err) {
    //        //next(null, {code : Consts.OK});
    //    });
    database.getCardExchangeLog(user.getName(), function(err, res) {
        if (res) {
            rechargeCardLog = res;
            for (var i = 0; i < rechargeCardLog.length; i++) {
                var rechargeObject = rechargeCardLog[i];
                var moneyInfo = {};
                moneyInfo[ParamsKey.TIME] = rechargeObject["gen_date"].getTime();
                moneyInfo[ParamsKey.TYPE] = Consts.TRANACTION_TYPE.CARD_RECHARGE;
                moneyInfo[ParamsKey.DES] = "Thẻ " + rechargeObject["telco"] + " " + rechargeObject["amount"];
                rechargeMoneyArr.push(moneyInfo);
            }
            var reqInfo = {};
            reqInfo[ParamsKey.CARD_RECHARGE] = rechargeMoneyArr;
            messageService.pushMessageToSession(session, Commands.TRANSACTION_LOG, reqInfo);
        }
    });
    next(null, {code : Consts.OK});
};

handler.giftexchange_log = function(msg, session, next) {
    var user = session.get('user');
    var database = Database.getInstance();
    var giftExchangeArr = [];
    var giftExchange = [];
    var reqInfo = {};
    database.getAllGiftRequest(user.getName(), function(err, res) {
        if (res) {
            giftExchange = res;
            for (var i = 0; i < giftExchange.length; i++) {
                var exchangeObject = giftExchange[i];
                exchangeObject.gen_date = exchangeObject["gen_date"].getTime();
                giftExchangeArr.push(exchangeObject);
            }
        }
        var reqInfo = {};
        reqInfo[ParamsKey.ARRAY] = giftExchangeArr;
        messageService.pushMessageToSession(session, Commands.GIFTEXCHANGE_LOG, reqInfo);
    });
    next(null, {});
};

handler.confirm_invite_code = function(msg, session, next) {
    var inviteCode = msg[ParamsKey.INVITE_CODE];
    var user = session.get('user');
    var userTitle = user.getProperty(UserFlag.TITLE);
    var database = Database.getInstance();
    var gameConfig = GameConfig.getInstance();
    if (user.getProperty(UserFlag.CONFIRM_INVITE_CODE) >= 1) {
        var reqInfo = {};
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Thiết bị đã nhập code mời';
        messageService.pushMessageToSession(session, Commands.CONFIRM_INVITE_CODE, reqInfo);
        return;
    }
    if (inviteCode && inviteCode.length >= 6) {
        database.getUserByInviteCode(inviteCode, function (err, res) {
            if (res) {
                var userData = res;
                if (userData.device_id === user.getProperty(UserFlag.DEVICE_ID)) {
                    var reqInfo = {};
                    reqInfo[ParamsKey.SUCCESS] = true;
                    reqInfo[ParamsKey.MESSAGE] = 'Hai tài khoản cùng thiết bị. Không hợp lệ';
                    messageService.pushMessageToSession(session, Commands.CONFIRM_INVITE_CODE, reqInfo);
                } else {
                    database.insertGoldBonusQueue(gameConfig.invite_code_bonus_gold, userData.name, 0, user.getName(), 'User ' + userTitle + ' nhập code mời chơi');
                    database.updateUserByDeviceId(user.getProperty(UserFlag.DEVICE_ID), 'confirm_invite_code', 1);
                    user.setProperty(UserFlag.CONFIRM_INVITE_CODE, 1);
                    var userManagerService = pomelo.app.get('userManagerService');
                    var allUsers = userManagerService.getAllUsers();
                    for (var k in allUsers) {
                        var oneUser = allUsers[k];
                        if (oneUser.getProperty(UserFlag.DEVICE_ID) === user.getProperty(UserFlag.DEVICE_ID)) {
                            if (oneUser.getProperty(UserFlag.CONFIRM_INVITE_CODE) === 0) {
                                oneUser.setProperty(UserFlag.CONFIRM_INVITE_CODE, 1);
                            }
                        }
                    }

                    var reqInfo = {};
                    reqInfo[ParamsKey.SUCCESS] = true;
                    reqInfo[ParamsKey.MESSAGE] = 'Nhập mã code thành công';
                    messageService.pushMessageToSession(session, Commands.CONFIRM_INVITE_CODE, reqInfo);
                }
            } else {
                var reqInfo = {};
                reqInfo[ParamsKey.SUCCESS] = false;
                reqInfo[ParamsKey.MESSAGE] = 'Mã code không tồn tại trên hệ thống';
                messageService.pushMessageToSession(session, Commands.CONFIRM_INVITE_CODE, reqInfo);
            }
        });
    } else {
        var reqInfo = {};
        reqInfo[ParamsKey.SUCCESS] = false;
        reqInfo[ParamsKey.MESSAGE] = 'Mã code không hợp lệ';
        messageService.pushMessageToSession(session, Commands.CONFIRM_INVITE_CODE, reqInfo);
    }
    next(null, {});
};

// ==============================================================
// OTHER METHODS
// ==============================================================
handler.sendLobbyInfo = function(user, userData, session, msg) {
    var database = Database.getInstance();
    var gameConfig = GameConfig.getInstance();
    var roomSettingManager = RoomSettingManager.getInstance();
    var platform = msg[ParamsKey.PLATFORM] || '';
    var info = {};
    info[ParamsKey.BANNER_LINK] = gameConfig.getBanner_link();
    info[ParamsKey.BANNER_TEXT] = gameConfig.getBanner_text();
    info[ParamsKey.PAYMENT_METHOD] = gameConfig.getPayment_method();
    info[ParamsKey.RULE_CASHOUT] = gameConfig.rule_cashout;
    info[ParamsKey.PAYMENT_PERMISSION] = true;
    //if (gameConfig.getPayment_permission().hasOwnProperty(platform)) {
    //    info[ParamsKey.PAYMENT_PERMISSION] = gameConfig.getPayment_permission()[platform];
    //}
    info[ParamsKey.CASHOUT_PERMISSION] = true;
    //if (gameConfig.getCashout_permission().hasOwnProperty(platform)) {
    //    info[ParamsKey.CASHOUT_PERMISSION] = gameConfig.getCashout_permission()[platform];
    //}
    if (gameConfig.getPlatform_default_full_mode().indexOf(platform) < 0 && userData.mode_play == 0) {
        info[ParamsKey.PAYMENT_PERMISSION] = false;
        info[ParamsKey.CASHOUT_PERMISSION] = false;
    }
    try {
        var geo = geoip.lookup(user.getIpAddress());
        var country = geo.country;
        if (!(Consts.COUNTRY_ENABLE_PAYMENT.indexOf(country.toUpperCase()) >= 0)) {
            info[ParamsKey.PAYMENT_PERMISSION] = false;
            info[ParamsKey.CASHOUT_PERMISSION] = false;
        }
    } catch (e) {
        //console.log(e.stack);
    }

    var gunConfig = [];
    for (var k in Consts.GUN.TYPE) {
        gunConfig.push(Consts.GUN.TYPE[k]);
    }
    info[ParamsKey.GUN] = gunConfig;
    var tableFees = [];
    for (var k in roomSettingManager.tableFeeMap) {
        tableFees.push(k);
    }
    info[ParamsKey.TABLE_FEE] = tableFees;
    var itemsConfig = [];
    for (var k in ItemConfig.getInstance().mapper) {
        var oneItemData = ItemConfig.getInstance().getItemData(k);
        var oneJsonObj = {};
        oneJsonObj[ParamsKey.ID] = oneItemData.item_id;
        oneJsonObj[ParamsKey.NAME] = oneItemData.name;
        oneJsonObj[ParamsKey.ITEM_TIME_EFFECT] = oneItemData.time_sec_effect;
        oneJsonObj[ParamsKey.DES] = oneItemData.description;
        itemsConfig.push(oneJsonObj);
    }
    info[ParamsKey.ITEM] = itemsConfig;

    var cardInfo = {};
    cardInfo[ParamsKey.TELCO] = gameConfig.getCardTelco();
    cardInfo[ParamsKey.EXCHANGE_RATE] = gameConfig.getCardExchangeRate();
    info[ParamsKey.CARD] = cardInfo;
    messageService.pushMessageToSession(session, Commands.LOBBY_INFO, info);
};

handler.sendPopupInfo = function(user, userData, session, msg) {
    var gameConfig = GameConfig.getInstance();
    var popups = gameConfig.getPopupsAvailable();
    var reqInfo = {};
    var contentPopups = [];
    for (var i = 0; i < popups.length; i++) {
        var onePopup = popups[i];
        if (onePopup.extras.first_time) {
            if (userData.account_state === Consts.ACCOUNT_STATE.EVER_LOGIN) {
                contentPopups.push(popups[i].toObj());
            }
        } else {
            contentPopups.push(popups[i].toObj());
        }
    }
    reqInfo[ParamsKey.SUCCESS] = true;
    reqInfo[ParamsKey.CONTENT] = contentPopups;
    messageService.pushMessageToSession(session, Commands.POPUP, reqInfo);
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

handler.checkEdition = function(edition_id, platform, partner) {
    var database = Database.getInstance();
    database.getEdition(edition_id, function(err, res) {
        if (!res) {
            database.insertEdition(edition_id, platform, partner);
        }
    });
};

