var pomelo = require('pomelo');
var utils = require('../../util/utils');
var Consts = require('../../consts/consts.js');
var Debug = require('../../log/debug');

var instance;

var Database = function() {
    this.dbclient = pomelo.app.get('dbclient');
    this.isShutDown = false;
};

function getInstance () {
    if (!instance) {
        instance = new Database();
    }
    return instance;
}

module.exports = {
    getInstance : getInstance
};

var db = Database.prototype;

// ===================================================
// TABLE GAME_CONFIG
// ===================================================

db.getGameConfig = function(key, cb) {
    var sql = 'SELECT * FROM game_config WHERE `key` = ?';
    var args = [key];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0].value);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getAllGameConfig = function(cb) {
    var sql = 'SELECT * FROM game_config';
    var args = [];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.updateGameConfig = function(key, value, cb) {
    var sql = "UPDATE game_config SET `value` = ? WHERE `key` = ?";
    var args = [value, key];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// =========================================================
// TABLE USER_MANAGER
// =========================================================

db.getUserByName = function(name, cb) {
    var sql = 'SELECT * FROM user_manager WHERE name = BINARY ?';
    var args = [name];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getUserByTitle = function(title, cb) {
    var sql = 'SELECT * FROM user_manager WHERE title = BINARY ?';
    var args = [title];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getUserByInviteCode = function(invite_code, cb) {
    var sql = 'SELECT * FROM user_manager WHERE invite_code = BINARY ?';
    var args = [invite_code];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getUserByDeviceId = function(device_id, cb) {
    var sql = 'SELECT * FROM user_manager WHERE device_id = ?';
    var args = [device_id];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getUserQuickLoginByDeviceId = function(device_id, cb) {
    var sql = 'SELECT * FROM user_manager WHERE device_id = ? AND reg_type = ' + Consts.LOGIN_TYPE.QUICK_LOGIN;
    var args = [device_id];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getUserByDeviceIdAndRegType = function(device_id, reg_type, cb) {
    var sql = 'SELECT * FROM user_manager WHERE device_id = ? AND reg_type = ?';
    var args = [device_id, reg_type];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.updateUserById = function(id, field, value, cb) {
    var sql = 'UPDATE user_manager SET ' + field + ' = ? WHERE id = ?';
    var args = [value, id];
    this.dbclient.query(sql, args, function(err, res){
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateUserByName = function(name, field, value, cb) {
    var sql = 'UPDATE user_manager SET ' + field + ' = ? WHERE name = BINARY ?';
    var args = [value, name];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateUserByDeviceId = function(device_id, field, value, cb) {
    var sql = 'UPDATE user_manager SET ' + field + ' = ? WHERE device_id = BINARY ?';
    var args = [value, device_id];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.createUser = function(name, title, avatar, password, platform, reg_type, phone, version, device_name, device_id,
                         last_device, secret_key, account_state, online_state, partner, cb) {
    var sql = "INSERT INTO user_manager(name, title, avatar, password, platform, reg_type, phone, version, gen_date, " +
                    "last_login, device_name, device_id, last_device, secret_key, account_state, online_state, partner) " +
                    " VALUES (?,?,?,?,?,?,?,?,now(),now(),?,?,?,?,?,?,?)";
    var args = [name, title, avatar, password, platform, reg_type, phone, version, device_name, device_id,
        last_device, secret_key, account_state, online_state, partner];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.addUserMoney = function(name, bonusMoney, reason, cb) {
    var sql = 'UPDATE user_manager SET money = money + ? WHERE name = BINARY ?';
    var args = [bonusMoney, name];
    Debug.updateDbMoney('bonusMoney ' + bonusMoney + ' reason ' + reason, name);
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateUserMoney = function(name, newMoney, reason, cb) {
    var sql = 'UPDATE user_manager SET money = ? WHERE name = BINARY ?';
    var args = [newMoney, name];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.addUserGold = function(name, bonusGold, reason, cb) {
    var sql = 'UPDATE user_manager SET gold = gold + ? WHERE name = BINARY ?';
    var args = [bonusGold, name];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateUserGold = function(name, newGold, reason, cb) {
    var sql = 'UPDATE user_manager SET gold = ? WHERE name = BINARY ?';
    var args = [newGold, name];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateUserInfoWhenLoginSuccess = function(name, version, last_device, cb) {
    var sql = "UPDATE user_manager SET version = ?, last_device = ?, online_state = 1, last_login = now() WHERE name = ?";
    var args = [version, last_device, name];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.getMaxUserId = function(cb) {
    var sql =  "SELECT max(id) maxId FROM user_manager";
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0].maxId);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getUserTopRich = function(cb) {
    var sql = 'SELECT * FROM user_manager WHERE account_state = ' + Consts.ACCOUNT_STATE.ACTIVE + ' ORDER BY money DESC LIMIT ' + Consts.TOP_SIZE;
    var args = [];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getUserTopMammonMoney = function(cb) {
    var sql = 'SELECT m.*, s.fish_mammon_money FROM user_statistic s, user_manager m WHERE s.user_name = m.name AND m.account_state = ' + Consts.ACCOUNT_STATE.ACTIVE + ' ORDER BY s.fish_mammon_money DESC LIMIT ' + Consts.TOP_SIZE;
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

// ==============================================================
// TABLE FISH
// ==============================================================

db.getFishByCode = function(id, cb) {
    var sql = 'SELECT * FROM fish WHERE code = ?';
    var args = [id];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getFishByName = function(name, cb) {
    var sql = 'SELECT * FROM fish WHERE name = ?';
    var args = [name];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getAllFish = function(cb) {
    var sql = 'SELECT * FROM fish';
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

// ===================================================================
// TABLE QUICK ROOM MANAGER
// ===================================================================

db.getAllQuickRoom = function(cb) {
    var sql = 'SELECT * FROM quick_room_manager';
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getQuickRoomByName = function(name, cb) {
    var sql = 'SELECT * FROM quick_room_manager WHERE name = ?';
    var args = [name];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.updateQuickRoom = function(name, field, value, cb) {
    var sql = 'UPDATE quick_room_manager SET ' + field + ' = ?, time_updated = now() WHERE name = ?';
    var args = [value, name];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.insertQuickPlayRoom = function(name, title, max_players, min_amount_fish, max_amount_fish, win_lost_ratio, min_money, max_money, cb) {
    var sql = "INSERT INTO quick_room_manager(name, title, max_players, min_amount_fish, max_amount_fish, win_lost_ratio, min_money, max_money, time_created, time_updated) " +
        "VALUES(?, ?, ?, ?, ?, ?, ?, ?, now(), now())";
    var args = [name, title, max_players, min_amount_fish, max_amount_fish, win_lost_ratio, min_money, max_money];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.addQuickRoomInterest = function(name, bonus, cb) {
    var sql = "UPDATE quick_room_manager SET interest = interest + ?, time_updated = now() WHERE name = ?";
    var args = [bonus, name];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateQuickRoomInterest = function(name, interest, cb) {
    this.updateQuickRoom(name, 'interest', interest, cb);
};

db.updateQuickRoomCountPlayer = function(name, countPlayer, cb) {
    this.updateQuickRoom(name, 'current_player', countPlayer, cb);
};

db.updateQuickRoomListPlayers = function(name, listPlayers, cb) {
    this.updateQuickRoom(name, 'list_players', listPlayers, cb);
};

db.updateQuickRoomPlayState = function(name, play_state, cb) {
    this.updateQuickRoom(name, 'play_state', play_state, cb);
};

db.updateQuickRoomRoomState = function(name, room_state, cb) {
    this.updateQuickRoom(name, 'room_state', room_state, cb);
};

db.resetQuickRoomManager = function(cb) {
    var sql = "UPDATE banca.quick_room_manager SET list_players = '[]', play_state = 0";
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// ===============================================================
// TABLE USER_MONEY_TRACE
// ===============================================================

db.insertUserMoneyTrace = function(user_name, user_title, game_id, room_name, list_players, table_fee, money_before,
                                   money_after, money_change, server_fee, partner, match_id, cb) {
    var sql = "INSERT INTO user_money_trace(user_name, user_title, game_id, room_name, list_players, table_fee, money_before, money_after, money_change, server_fee, gen_date, partner, match_id) " +
        "VALUES(?,?,?,?,?,?,?,?,?,?,now(),?,?)";
    var args = [user_name, user_title, game_id, room_name, list_players, table_fee, money_before,
        money_after, money_change, server_fee, partner, match_id];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
            console.log("Args : " + JSON.stringify(args));
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// ===============================================================
// TABLE CHALLENGE_FEE_LOG
// ===============================================================

db.insertChallengeFeeLog = function(game_id, user_name, fee, partner, cb) {
    var sql = 'INSERT INTO challenge_fee_log(game_id, user_name, fee, gen_date, partner) ' +
        'VALUES(?, ?, ?, now(), ?)';
    var args = [game_id, user_name, fee, partner];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.insertChallengeFeeBotLog = function(game_id, user_name, fee, partner, cb) {
    var sql = 'INSERT INTO challenge_fee_bot_log(game_id, user_name, fee, gen_date, partner) ' +
        'VALUES(?, ?, ?, now(), ?)';
    var args = [game_id, user_name, fee, partner];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// =================================================================
// TABLE QUICKPLAY_INTEREST_LOG
// =================================================================

db.insertQuickPlayInterestLog = function(user_name, user_title, game_id, u_money_start, u_money_end, u_money_change,
                                         room_interest, room_name, time_start, time_end, partner, cb) {
    var sql = 'INSERT INTO quickplay_interest_log(user_name, user_title, game_id, u_money_start, u_money_end, u_money_change, room_interest, room_name, time_start, time_end, partner) ' +
        'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    var args = [user_name, user_title, game_id, u_money_start, u_money_end, u_money_change, room_interest, room_name, time_start, time_end, partner];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// ======================================================================
// TABLE USER_STATISTIC
// ======================================================================

db.insertUserStatistic = function(user_name, cb) {
    var sql = 'INSERT INTO user_statistic(user_name) VALUES (?)';
    var args = [user_name];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateUserStatistic = function(user_name, field, value, cb) {
    var sql = 'UPDATE user_statistic SET ' + field + ' = ? WHERE user_name = ?';
    var args = [value, user_name];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.addUserStatistic = function(user_name, bonus, field, cb) {
    var sql = 'UPDATE user_statistic SET ' + field + '=' + field + ' + ? WHERE user_name = ?';
    var args = [bonus, user_name];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateUserStatisticChallenge = function(user_name, level, challenge_win, challenge_lost, challenge_money_win, challenge_money_lost, cb) {
    var sql = 'UPDATE user_statistic SET level = ?, challenge_win = ?, challenge_lost = ?, challenge_money_win = ?, challenge_money_lost = ? WHERE user_name = ?';
    var args = [level, challenge_win, challenge_lost, challenge_money_win, challenge_money_lost, user_name];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log("updateUserStatisticChallenge SQL : " + sql + ", Args : " + JSON.stringify(args) + err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateUserStatisticLevel = function(user_name, level, cb) {
    this.updateUserStatistic(user_name, 'level', level, cb);
};

db.updateUserStatisticQuickPlay = function(user_name, level, quickplay_money_win, quickplay_money_lost, fish_dead, cb) {
    var sql = 'UPDATE user_statistic SET level = ?, quickplay_money_win = ?, quickplay_money_lost = ?, fish_dead = ? WHERE user_name = ?';
    var args = [level, quickplay_money_win, quickplay_money_lost, fish_dead, user_name];
    this.dbclient.query(sql, args, function(err, res){
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.getUserStatistic = function(user_name, cb) {
    var sql = 'SELECT * FROM user_statistic WHERE user_name = ?';
    var args = [user_name];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

// ==========================================================================================
// TABLE POPUP_MANAGER
// ==========================================================================================

db.getAllPopupActive = function(cb) {
    var sql = 'SELECT * FROM popup_manager WHERE state = ' + Consts.POPUP_STATE.ACTIVE;
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// =======================================================================================
// TABLE CHALLENGE_MATCH_ID
// =======================================================================================

db.insertMatchId = function(match_id, game_id, server_fee, players, table_fee, start_time, room_name, cb) {
    var sql = 'INSERT INTO challenge_match_id(match_id, game_id, server_fee, players, table_fee, start_time, room_name) ' +
        'VALUES(?, ?, ?, ?, ?, ?, ?)';
    var args = [match_id, game_id, server_fee, players, table_fee, start_time, room_name];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.updateMatchId = function(match_id, server_fee, end_time, cb) {
    var sql = "UPDATE challenge_match_id SET server_fee = ?, end_time = ? WHERE match_id = ?";
    var args = [server_fee, end_time, match_id];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
            console.log(err.message + ", " + err.stack);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// =======================================================================================
// TABLE ITEM
// =======================================================================================

db.getAllItems = function(cb) {
    var sql = 'SELECT * FROM item';
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

// ========================================================================================
// TABLE USER MESSAGE + SYSTEM MESSAGE
// ========================================================================================

db.getUserMessage = function(message_type, message_state, username, cb) {
    var sql = 'SELECT * FROM user_message WHERE ';
    var where = '';
    var whereClause = [];
    whereClause.push('user_recept_name=' + "'" + username + "'");
    if (message_type && message_type >= 0) {
        whereClause.push('type=' + message_type);
    }
    if (message_state && message_state >= 0) {
        whereClause.push('state=' + message_state);
    }
    for (var i = 0; i < whereClause.length; i++) {
        where += whereClause[i];
        if (i !== whereClause.length - 1) {
            where += ' AND ';
        }
    }
    sql += where + ' ORDER BY gen_date DESC LIMIT ' + Consts.USER_MESSAGE.MAX_MSG_TO_USER;
    this.dbclient.query(sql, [], function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.updateMessageState = function(message_id, state, cb) {
    var sql = 'UPDATE user_message SET state = ? WHERE id = ?';
    var args = [state, message_id];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.getSystemMessage = function(cb) {
    var sql = 'SELECT * FROM system_message WHERE state = 1 ORDER BY gen_date DESC LIMIT ' + Consts.USER_MESSAGE.MAX_MSG_TO_USER;
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.insertUserMessage = function(user_recept_name, message_title, message_content, type, user_sent_name, cb) {
    var sql = 'INSERT INTO user_message(user_recept_name, message_title, message_content, type, user_sent_name, gen_date) ' +
        'VALUES(?, ?, ?, ?, ?, now())';
    var args = [user_recept_name, message_title, message_content, type, user_sent_name];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.countUnreadMessage = function(username, cb) {
    var sql = 'SELECT count(id) count FROM user_message WHERE user_recept_name = ? AND state = ?';
    var args = [username, Consts.USER_MESSAGE.STATE.UNREAD];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0].count);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

// ========================================================================================
// TABLE CARD....
// ========================================================================================

db.getCardTelco = function(cb) {
    var sql = 'SELECT * FROM card_telco WHERE active = 1';
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.getCardExchangeRate = function(cb) {
    var sql = 'SELECT * FROM card_exchange_rate';
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.logCardExchange = function(cardCode, cardSerial, telco, money_recharge, user_name, money_before, money_after, reason,
                              trans_id, amount, partner, cb) {
    var sql = 'INSERT INTO card_exchange_log(code, serial, telco, money_recharge, user_name, money_before, money_after, reason, trans_id, amount, partner) ' +
              'VALUES(?,?,?,?,?,?,?,?,?,?,?)';
    var args = [cardCode, cardSerial, telco, money_recharge, user_name, money_before, money_after, reason, trans_id, amount, partner];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.getCardExchangeLog = function(username, cb) {
    var sql = 'SELECT * FROM card_exchange_log WHERE user_name = ? AND amount > 0 ORDER BY gen_date DESC LIMIT 50';
    var args = [username];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

// ========================================================================================
// TABLE GIFT....
// ========================================================================================

db.getAllGiftInfo = function(cb) {
    var sql = 'SELECT * FROM gift_info WHERE is_active = 1  ORDER BY gift_order asc';
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    })
};

db.getGift = function(id, cb) {
    var sql = 'SELECT * FROM gift_info WHERE id = ?';
    var args = [id];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.insertGiftRequest = function(gift_id, user, money_before, money_after, request_id, money_change, cb) {
    var sql = 'INSERT INTO gift_exchange_request(gift_id, user, money_before, money_after, gen_date, request_id, money_change) ' +
        'VALUES(?, ?, ?, ?, now(), ?, ?)';
    var args = [gift_id, user, money_before, money_after, request_id, money_change];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.getAllGiftRequest = function(username, cb) {
    var sql = 'SELECT g.id, g.gen_date, g.state, i.des FROM gift_exchange_request g, gift_info i WHERE g.gift_id = i.id AND user = ? ORDER BY g.gen_date DESC LIMIT 50';
    var args = [username];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

// ========================================================================================
// TABLE PARTNER_MANAGER
// ========================================================================================

db.loadAllPartnerManager = function(cb) {
    var sql = 'SELECT * FROM partner_manager';
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

// ========================================================================================
// TABLE CCU
// ========================================================================================

db.logCCU = function(partner, platform, ccu, cb) {
    var sql = "INSERT INTO ccu_log(ccu, gen_date, platform, partner) VALUES(?, now(), ?, ?)";
    var args = [ccu, platform, partner];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.logCCUGame = function(ccu, game_type, cb) {
    var sql = "INSERT INTO ccu_game_log(ccu, game_type, gen_date) VALUES(?, ?, now())";
    var args = [ccu, game_type];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// ========================================================================================
// TABLE EDITION MANAGER
// ========================================================================================

db.insertEdition = function(edition_id, platform, partner, cb) {
    var sql = "INSERT INTO edition_manager(edition_id, platform, partner) VALUES(?, ?, ?)";
    var args = [edition_id, platform, partner];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.getEdition = function(edition_id, cb) {
    var sql = "SELECT * FROM edition_manager WHERE edition_id = ?";
    var args = [edition_id];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

// ========================================================================================
// TABLE MONEY_BONUS
// ========================================================================================

db.getMoneyBonusQueue = function(username, cb) {
    var sql = "SELECT * FROM money_bonus_queue WHERE user_name = ?";
    var args = [username];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.insertMoneyBonusLog = function(user_name, user_title, money_bonus, money_before, money_after, type, partner, admin_name, message, cb) {
    var sql = "INSERT INTO money_bonus_log(user_name, user_title, money_bonus, money_before, money_after, type, gen_date, partner, admin_name, message) " +
        "VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?)";
    var args = [user_name, user_title, money_bonus, money_before, money_after, type, partner, admin_name, message];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.deleteMoneyBonusQueue = function(id, cb) {
    var sql = "DELETE FROM money_bonus_queue WHERE id = ?";
    var args = [id];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.insertMoneyBonusQueue = function(money_bonus, user_name, type, admin_name, message, cb) {
    var sql = 'INSERT INTO money_bonus_queue(money_bonus, user_name, type, admin_name, message, gen_date) VALUES(?, ?, ?, ?, ?, now())';
    var args = [money_bonus, user_name, type, admin_name, message];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// ========================================================================================
// TABLE GOLD_BONUS
// ========================================================================================

db.getGoldBonusQueue = function(username, cb) {
    var sql = "SELECT * FROM gold_bonus_queue WHERE user_name = ?";
    var args = [username];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

db.insertGoldBonusLog = function(user_name, user_title, gold_bonus, gold_before, gold_after, type, partner, admin_name, message, cb) {
    var sql = "INSERT INTO gold_bonus_log(user_name, user_title, gold_bonus,gold_before, gold_after, type, gen_date, partner, admin_name, message) " +
        "VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?)";
    var args = [user_name, user_title, gold_bonus, gold_before, gold_after, type, partner, admin_name, message];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.deleteGoldBonusQueue = function(id, cb) {
    var sql = "DELETE FROM gold_bonus_queue WHERE id = ?";
    var args = [id];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

db.insertGoldBonusQueue = function(gold_bonus, user_name, type, admin_name, message, cb) {
    var sql = 'INSERT INTO gold_bonus_queue(gold_bonus, user_name, type, admin_name, message, gen_date) VALUES(?, ?, ?, ?, ?, now())';
    var args = [gold_bonus, user_name, type, admin_name, message];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// ========================================================================================
// TABLE MONEY_BULLET_LOG
// ========================================================================================

db.insertBulletMoneyLog = function(user_name, user_title, money_bullet, type, cb) {
    var sql = 'INSERT INTO money_bullet_log(user_name, user_title, money_bullet, type, gen_date) VALUES(?, ?, ?, ?, now())';
    var args = [user_name, user_title, money_bullet, type];
    this.dbclient.query(sql, args, function(err, res) {
        if(err !== null){
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows>0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

// ========================================================================================
// TABLE EVENT_MANAGER
// ========================================================================================

db.getAllEventManager = function(cb) {
    var sql = 'SELECT * FROM event_manager';
    var args = [];
    this.dbclient.query(sql, args, function(err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};