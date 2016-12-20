var Consts = require('../../../consts/consts.js');
var Debug = require('../../../log/debug');
var ParamsKey = require('../../../lib/constants/paramsKey');
var GameConfig = require('../../../lib/config/gameConfig');
var Common = require('../../../lib/common/common');
var Database = require('../../../lib/database/database');
var pomelo = require('pomelo');
var utils = require('../../../util/utils');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

// ========================================================
// BEGIN CLIENT REQUEST
// ========================================================

/**
 * Use for tool login
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.guest_login = function(msg, session, next) {
	session.bind(Consts.PREFIX.GUEST_ + session.id);
	next(null, {code : Consts.OK, uid : Consts.PREFIX.GUEST_ + session.id});
};

/**
 * New client login.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 */
Handler.prototype.login = function(msg, session, next) {
	session.unbind(Consts.PREFIX.GUEST_ + session.id);
	var self = this;
	var loginName = msg[ParamsKey.NAME] || '';
	var loginType = msg[ParamsKey.LOGIN_TYPE] || Consts.LOGIN_TYPE.NORMAL;
	var loginData = msg;
	//Debug.login('User login ' + loginName + ', data ' + JSON.stringify(msg));
	//console.log('User login ' + loginName + ', data ' + JSON.stringify(msg));
	if (loginName.length > 0) {
		var isDuplicate = self.checkDuplicateUserLogin(loginName);
		if (isDuplicate) {
			self.doNotifyDuplicatePlaying(session, next);
		} else if (GameConfig.getInstance().serverIsShuttingDown) {
			self.doNotifyMaintance(session, next);
		} else {
			var database = Database.getInstance();
			database.getUserByName(loginName, function(err, userData) {
				if (loginType === Consts.LOGIN_TYPE.NORMAL) {
					self.doLoginNormal(session, next, userData, loginData);
				} else if (loginType === Consts.LOGIN_TYPE.FACEBOOK) {
					self.doLoginFaceBook(session, next, userData, loginData);
				} else if (loginType === Consts.LOGIN_TYPE.QUICK_LOGIN) {
					self.doLoginQuick(session, next, userData, loginData);
				}
			});
		}
	} else {
		if (loginType === Consts.LOGIN_TYPE.QUICK_LOGIN) {
			self.doLoginQuick(session, next, null, loginData);
		} else {
			self.doNotifyNameNotExists(session, next);
		}
	}
};

/**
 * New client register.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 */
Handler.prototype.register = function(msg, session, next) {
	session.bind(Consts.PREFIX.GUEST_ + session.id);
	var self = this;
	var database = Database.getInstance();
	var username = msg[ParamsKey.NAME];
	var password = msg[ParamsKey.PASSWORD];
	var platform = msg[ParamsKey.PLATFORM] || Consts.PLATFORM.ANDROID;
	var reg_type = Consts.LOGIN_TYPE.NORMAL;
	var version = msg[ParamsKey.VERSION] || 1;
	var device_name = msg[ParamsKey.DEVICE_NAME] || '';
	var device_id = msg[ParamsKey.DEVICE_ID] || '';
	var accoun_state = Consts.ACCOUNT_STATE.EVER_LOGIN;
	var partner = msg[ParamsKey.PARTNER] || Consts.PARTNER_DEFAULT;
	platform = platform.toLowerCase();
	var isFoundSpecial = /^[a-zA-Z0-9- ]*$/.test(username);
	var checkPassObj = isOkPass(password);
	if (username.indexOf('admin') >= 0 || username.indexOf('system') >= 0) {
		next(null, {code : Consts.FAILED, message : 'Tên đăng nhập không được chứa kí tự đặc biệt'});
		return;
	}
	if (!username || !password || username.length < 6 || password.length < 6) {
		next(null, {code : Consts.FAILED, message : 'Tên đăng nhập và password ít nhất phải có 6 kí tự'});
	} else if (!isFoundSpecial) {
		next(null, {code : Consts.FAILED, message : 'Tên đăng nhập không được chứa kí tự đặc biệt'});
	} else if (device_id.length === 0) {
		next(null, {code : Consts.FAILED, message : 'Thiết bị đăng ký không hợp lệ'});
	} /*else if (!checkPassObj.result) {
		next(null, {code : Consts.FAILED, message : checkPassObj.error});
	}*/ else {
		var enctyptedPassword = Common.MD5(password);
		database.getUserByDeviceId(device_id, function(err, users) {
			if (users && users.length >= GameConfig.getInstance().getMax_account_device_id()) {
				next(null, {code : Consts.FAILED, message : 'Thiết bị này đã đăng ký quá nhiều tài khoản'});
			} else {
				database.getUserByName(username, function(err, res) {
					if (res) {
						next(null, {code : Consts.FAILED, message : 'Tên tài khoản đã tồn tại'});
					} else {
						self.createUser(username, enctyptedPassword, username, '', platform, reg_type, version, device_name, device_id, accoun_state, partner, function(err, res) {
							if (res) {
								//if (GameConfig.getInstance().getRegister_bonus() > 0) {
								//	database.addUserMoney(username, GameConfig.getInstance().getRegister_bonus(), 'register bonus');
								//	database.insertMoneyBonusLog(username, username, GameConfig.getInstance().getRegister_bonus(), 0,
								//		GameConfig.getInstance().getRegister_bonus(), 1, partner, 'system', 'register bonus');
								//}
								self.bonusMoneyCreateUser(username, partner, device_id, reg_type);
								self.checkOpenGameModeRegister(platform, username);
								database.addUserGold(username, GameConfig.getInstance().register_default_gold, 'register bonus');
								self.createInviteCode(device_id, username);
								next(null, {code : Consts.OK, message : 'Đăng ký tài khoản thành công'});
							} else {
								next(null, {code : Consts.FAILED, message : 'Error when create account'});
							}

						});
					}
				});
			}
		});
	}
};

Handler.prototype.loginSuccess = function(uid, session, next, data) {
	session.bind(uid);
	var self = this;
	// session.set('user', new User(session, uid));
	session.on('closed', onUserLeave.bind(null, self.app));
	session.pushAll();
	try {
		var sessionService = pomelo.app.get('sessionService').service;
		var ipAddress = sessionService.getClientAddressBySessionId(session.id).ip;
		Database.getInstance().updateUserByName(uid, 'ip_address', ipAddress);
	} catch (e) {
	}
	//
	Database.getInstance().updateUserByName(uid, 'online_state', 1);
	if (!data) {
		next(null, {
			code : Consts.OK,
			message : 'Login success'
		});
	} else {
		next(null, data);
	}
	Debug.game(uid, "Login success " + JSON.stringify(data));
};

/**
 * Khi session cua user bi dong. Goi ham nay de cho user thoat ra khoi server
 */
var onUserLeave = function(app, session) {
	if (!session || !session.uid) {
		return;
	}
	//console.log('User ' + session.uid + ' Leave Room');
	//Goi ham remote cua room de cho user thoat ra khoi room
	var params = {userId : session.uid, sessionId : session.id, roomId : session.get('roomName')};
	app.rpc.room.playerRemote.playerLeave(session, params, function(err) {
		if (!!err) {
			console.log('user leave room error ' + err);
		}
	});
	try {
		Database.getInstance().updateUserByName(session.uid, 'online_state', 0);
		//Remove from chat channel
		app.rpc.chat.chatRemote.kick(session, session.uid, null);
		Debug.logDisconnect("Session id " + session.id + " user " + session.uid + " disconnect params " + JSON.stringify(params));
		Debug.game(session.uid, "Session id " + session.id + " user " + session.uid + " disconnect params " + JSON.stringify(params));
	} catch (e) {

	}
};

// ========================================================
// END CLIENT REQUEST
// ========================================================

// ========================================================
// BEGIN IMPORTANT METHODS
// ========================================================

Handler.prototype.doLoginNormal = function(session, next, userData, loginData) {
	var self = this;
	var msg = loginData;
	var database = Database.getInstance();
	var password = loginData[ParamsKey.PASSWORD];
	if (!userData) {
		self.doNotifyNameNotExists(session, next);
	} else {
		var passEncrypted = userData.password;
		if (Common.MD5(password) !== passEncrypted) {
			self.doNotifyNameNotExists(session, next);
		} else if (userData.account_state === Consts.ACCOUNT_STATE.INACTIVE) {
			self.doNotifyAccountInActive(session, next);
		} else if (userData.account_state === Consts.ACCOUNT_STATE.BLOCKED) {
			self.doNotifyAccountBlocked(session, next);
		} else {
			var loginName = msg[ParamsKey.NAME] || '';
			var device_name = loginData[ParamsKey.DEVICE_NAME] || '';
			var device_id = msg[ParamsKey.DEVICE_ID] || '';
			var version = msg[ParamsKey.VERSION] || 1;
			database.updateUserInfoWhenLoginSuccess(loginName, version, device_name + '|' + device_id);
			if (device_id && device_id !== '0' && userData.device_id === '0') {
				database.updateUserByName(loginName, 'device_id', device_id);
			}
			//self.loginSuccess(loginName, session, next, outData);
			self.checkOpenGameModeLogin(userData, loginData, loginData[ParamsKey.PLATFORM], function(listGameMode) {
				var isshow_user_money_info = true;
				if (!(listGameMode.indexOf(Consts.GAME_TYPE.CHALLENGE) >= 0 && listGameMode.indexOf(Consts.GAME_TYPE.QUICK_PLAY) >= 0)) {
					isshow_user_money_info = false;
				}
				var outData = {
					code: Consts.OK,
					message: 'Login success',
					mode_play: listGameMode,
					show_user_money_info : isshow_user_money_info
				};
				self.loginSuccess(loginName, session, next, outData);
			});
		}
	}
};

Handler.prototype.doLoginFaceBook = function(session, next, userData, loginData) {
	var self = this;
	var database = Database.getInstance();
	if (!!userData) {
		if (userData.account_state === Consts.ACCOUNT_STATE.INACTIVE) {
			self.doNotifyAccountInActive(session, next);
		} else if (userData.account_state === Consts.ACCOUNT_STATE.BLOCKED) {
			self.doNotifyAccountBlocked(session, next);
		} else {
			var loginName = loginData[ParamsKey.NAME] || '';
			var device_name = loginData[ParamsKey.DEVICE_NAME] || '';
			var device_id = loginData[ParamsKey.DEVICE_ID] || '';
			var version = loginData[ParamsKey.VERSION] || 1;
			database.updateUserInfoWhenLoginSuccess(loginName, version, device_name + '|' + device_id);
			if (device_id && device_id !== '0' && userData.device_id === '0') {
				database.updateUserByName(loginName, 'device_id', device_id);
			}
			//self.loginSuccess(loginName, session, next);
			self.checkOpenGameModeLogin(userData, loginData, loginData[ParamsKey.PLATFORM], function(listGameMode) {
				var isshow_user_money_info = true;
				if (!(listGameMode.indexOf(Consts.GAME_TYPE.CHALLENGE) >= 0 && listGameMode.indexOf(Consts.GAME_TYPE.QUICK_PLAY) >= 0)) {
					isshow_user_money_info = false;
				}
				var outData = {
					code: Consts.OK,
					message: 'Login success',
					mode_play: listGameMode,
					show_user_money_info : isshow_user_money_info
				};
				self.loginSuccess(loginName, session, next, outData);
			});
		}
	} else {
		var username = loginData[ParamsKey.NAME];
		var title = loginData[ParamsKey.TITLE] || username;
		var avatar = loginData[ParamsKey.AVATAR] || '';
		var platform = loginData[ParamsKey.PLATFORM] || Consts.PLATFORM.ANDROID;
		var reg_type = Consts.LOGIN_TYPE.FACEBOOK;
		var version = loginData[ParamsKey.VERSION] || 1;
		var device_name = loginData[ParamsKey.DEVICE_NAME] || '';
		var device_id = loginData[ParamsKey.DEVICE_ID] || '';
		var accoun_state = Consts.ACCOUNT_STATE.EVER_LOGIN;
		var partner = loginData[ParamsKey.PARTNER] || Consts.PARTNER_DEFAULT;
		platform = platform.toLowerCase();
		self.createUser(username, '', title, avatar, platform, reg_type, version, device_name, device_id, accoun_state, partner, function(err, res) {
			if (res) {
				//if (GameConfig.getInstance().getRegister_bonus() > 0) {
				//	database.addUserMoney(username, GameConfig.getInstance().getRegister_bonus(), 'facebook created bonus');
				//	database.insertMoneyBonusLog(username, title, GameConfig.getInstance().getRegister_bonus(), 0,
				//		GameConfig.getInstance().getRegister_bonus(), 1, partner, 'system', 'facebook created bonus');
				//}
				self.bonusMoneyCreateUser(username, partner, device_id, reg_type);
				database.addUserGold(username, GameConfig.getInstance().register_default_gold, 'facebook created bonus');
				self.createInviteCode(device_id, username);
				//
				var listGameMode = self.checkOpenGameModeRegister(platform, username);
				var isshow_user_money_info = true;
				if (!(listGameMode.indexOf(Consts.GAME_TYPE.CHALLENGE) >= 0 && listGameMode.indexOf(Consts.GAME_TYPE.QUICK_PLAY) >= 0)) {
					isshow_user_money_info = false;
				}
				var outData = {
					code: Consts.OK,
					message: 'Create new user success',
					mode_play: listGameMode,
					show_user_money_info : isshow_user_money_info
				};
				self.loginSuccess(username, session, next, outData);
			} else {
				self.doNotifyErrorCreateUser(session, next);
			}
		});
	}
};

Handler.prototype.doLoginQuick = function(session, next, userData, loginData) {
	var self = this;
	var database = Database.getInstance();
	var msg = loginData;
	if (!!userData) {
		if (userData.account_state === Consts.ACCOUNT_STATE.INACTIVE) {
			self.doNotifyAccountInActive(session, next);
		} else if (userData.account_state === Consts.ACCOUNT_STATE.BLOCKED) {
			self.doNotifyAccountBlocked(session, next);
		} else if (userData.device_id && userData.device_id !== '0' && userData.device_id !== loginData[ParamsKey.DEVICE_ID]) {
			self.doNotifyErrorDeviceIdInvalid(session, next);
		} else {
			var loginName = msg[ParamsKey.NAME] || '';
			var device_name = loginData[ParamsKey.DEVICE_NAME] || '';
			var device_id = msg[ParamsKey.DEVICE_ID] || '';
			var version = msg[ParamsKey.VERSION] || 1;
			database.updateUserInfoWhenLoginSuccess(loginName, version, device_name + '|' + device_id);
			//self.loginSuccess(loginName, session, next);
			self.checkOpenGameModeLogin(userData, loginData, loginData[ParamsKey.PLATFORM], function(listGameMode) {
				var isshow_user_money_info = true;
				if (!(listGameMode.indexOf(Consts.GAME_TYPE.CHALLENGE) >= 0 && listGameMode.indexOf(Consts.GAME_TYPE.QUICK_PLAY) >= 0)) {
					isshow_user_money_info = false;
				}
				var outData = {
					code: Consts.OK,
					message: 'Login success',
					mode_play: listGameMode,
					show_user_money_info : isshow_user_money_info
				};
				self.loginSuccess(loginName, session, next, outData);
			});
		}
	} else {
		var device_id = loginData[ParamsKey.DEVICE_ID] || '';
		if (device_id.length === 0) {
			self.doNotifyErrorDeviceIdInvalid(session, next);
			return;
		}
		database.getUserQuickLoginByDeviceId(device_id, function(err, res) {
			if (!res) {
				database.getMaxUserId(function(err, max) {
					var loginName = Consts.PREFIX.QUICK_ + (max + 1);
					var title = loginName;
					var avatar = '';
					var platform = loginData[ParamsKey.PLATFORM] || Consts.PLATFORM.ANDROID;
					var reg_type = Consts.LOGIN_TYPE.QUICK_LOGIN;
					var version = loginData[ParamsKey.VERSION] || 1;
					var device_name = loginData[ParamsKey.DEVICE_NAME] || '';
					var device_id = loginData[ParamsKey.DEVICE_ID] || '';
					var accoun_state = Consts.ACCOUNT_STATE.EVER_LOGIN;
					var partner = loginData[ParamsKey.PARTNER] || Consts.PARTNER_DEFAULT;
					platform = platform.toLowerCase();
					self.createUser(loginName, '', title, avatar, platform, reg_type, version, device_name, device_id, accoun_state, partner, function(err, res) {
						if (res) {
							var listGameMode = self.checkOpenGameModeRegister(platform, loginName);
							var isshow_user_money_info = true;
							if (!(listGameMode.indexOf(Consts.GAME_TYPE.CHALLENGE) >= 0 && listGameMode.indexOf(Consts.GAME_TYPE.QUICK_PLAY) >= 0)) {
								isshow_user_money_info = false;
							}
							var outData = {
								code: Consts.OK,
								message: 'Create new user success',
								name: loginName,
								mode_play : listGameMode,
								show_user_money_info : isshow_user_money_info
							};
							//if (GameConfig.getInstance().getRegister_bonus() > 0) {
							//	database.addUserMoney(loginName, GameConfig.getInstance().getRegister_bonus(), 'quickuser created bonus');
							//	database.insertMoneyBonusLog(loginName, title, GameConfig.getInstance().getRegister_bonus(), 0,
							//		GameConfig.getInstance().getRegister_bonus(), 1, partner, 'system', 'quickuser created bonus');
							//}
							self.bonusMoneyCreateUser(loginName, partner, device_id, reg_type);
							database.addUserGold(loginName, GameConfig.getInstance().register_default_gold, 'quickuser created bonus');
							self.createInviteCode(device_id, loginName);
							self.loginSuccess(loginName, session, next, outData);
						} else {
							self.doNotifyErrorCreateUser(session, next);
						}
					});
				});
			} else {
				userData = res;
				if (userData.account_state === Consts.ACCOUNT_STATE.INACTIVE) {
					self.doNotifyAccountInActive(session, next);
				} else if (userData.account_state === Consts.ACCOUNT_STATE.BLOCKED) {
					self.doNotifyAccountBlocked(session, next);
				} else {
					var loginName = userData.name;
					//var outData = {
					//	code: Consts.OK,
					//	message: 'Login success',
					//	name: loginName
					//};
					//self.loginSuccess(loginName, session, next, outData);
					self.checkOpenGameModeLogin(userData, loginData, loginData[ParamsKey.PLATFORM], function(listGameMode) {
						var isshow_user_money_info = true;
						if (!(listGameMode.indexOf(Consts.GAME_TYPE.CHALLENGE) >= 0 && listGameMode.indexOf(Consts.GAME_TYPE.QUICK_PLAY) >= 0)) {
							isshow_user_money_info = false;
						}
						var outData = {
							code: Consts.OK,
							message: 'Login success',
							name: loginName,
							mode_play: listGameMode,
							show_user_money_info : isshow_user_money_info
						};
						self.loginSuccess(loginName, session, next, outData);
					});
 				}
			}
		});
	}
};

Handler.prototype.createUser = function(username, password, title, avatar, platform, reg_type, version, device_name,
										device_id, account_state, partner, callback) {
	platform = platform.toLowerCase();
	var secret_key = Common.MD5(username + device_id + partner);
	var last_device = device_name + '|' + device_id;
	var database = Database.getInstance();
	database.createUser(username, title, avatar, password, platform, reg_type, '', version, device_name, device_id,
		last_device, secret_key, account_state, 0, partner, callback);
};

Handler.prototype.createInviteCode = function(device_id, username) {
	var database = Database.getInstance();
	database.getUserByDeviceId(device_id, function(err, users) {
		if (users) {
			var countUserHasInviteCode = 0;
			for (var i = 0; i < users.length; i++) {
				var uData = users[i];
				if (uData.invite_code && uData.invite_code.length > 3) {
					countUserHasInviteCode ++;
				}
			}
			if (countUserHasInviteCode === 0) {
				if (users.length === 1) {
					//Chi co 1 user tuc la user dau tien duoc tao boi device_id -> Tao code invite cho thang nay
					var oneUserData = users[0];
					var inviteCode = Common.generateInviteCode(oneUserData.id);
					database.updateUserById(oneUserData.id, 'invite_code', inviteCode);
				} /*else if (username) {
					var inviteCode = Common.generateInviteCode(oneUserData.id);
					database.updateUserByName(username, 'invite_code', inviteCode);
				}*/
			}
		}
	});
};

Handler.prototype.bonusMoneyCreateUser = function(username, partner, device_id, reg_type) {
	var database = Database.getInstance();
	database.getUserByDeviceIdAndRegType(device_id, reg_type, function(err, res) {
		if (res) {
			if (res.length <= GameConfig.getInstance().getNumber_acc_per_device_register_bonus()) {
				if (GameConfig.getInstance().getRegister_bonus() > 0) {
					database.addUserMoney(username, GameConfig.getInstance().getRegister_bonus(), 'register bonus');
					database.insertMoneyBonusLog(username, username, GameConfig.getInstance().getRegister_bonus(), 0,
						GameConfig.getInstance().getRegister_bonus(), 1, partner, 'system', 'register bonus');
				}
			}
		}
	});
};

//Xem nick nay o che do nao : full_mode hay free_mode
Handler.prototype.checkOpenGameModeLogin = function(userData, loginData, platform, cb) {
	var database = Database.getInstance();
	var listPlatFormFullModes = GameConfig.getInstance().getPlatform_default_full_mode();
	if (listPlatFormFullModes.indexOf(platform) >= 0) {
		var listGameModes = [Consts.GAME_TYPE.FREE_PLAY, Consts.GAME_TYPE.CHALLENGE, Consts.GAME_TYPE.QUICK_PLAY];
		utils.invokeCallback(cb, listGameModes);
		return;
	} else if (userData.mode_play === 1) {
		var listGameModes = [Consts.GAME_TYPE.FREE_PLAY, Consts.GAME_TYPE.CHALLENGE, Consts.GAME_TYPE.QUICK_PLAY];
		utils.invokeCallback(cb, listGameModes);
		return;
	} else {
		var user_name = userData.name;
		var gen_dateTime = userData.gen_date.getTime();
		var listGameModes = [Consts.GAME_TYPE.FREE_PLAY, Consts.GAME_TYPE.CHALLENGE, Consts.GAME_TYPE.QUICK_PLAY];
		database.getUserStatistic(user_name, function (err, res) {
			var freeplay_match = 0;
			if (res) {
				freeplay_match = res.freeplay_match;
			}
			if (freeplay_match >= GameConfig.getInstance().freeplay_valid_open_full_mode
				&& Date.now() - gen_dateTime > GameConfig.getInstance().getHour_active_full_mode() * 60 * 60 * 1000) {
				listGameModes = [Consts.GAME_TYPE.FREE_PLAY, Consts.GAME_TYPE.CHALLENGE, Consts.GAME_TYPE.QUICK_PLAY];
				database.updateUserByName(user_name, 'mode_play', 1);
			} else {
				listGameModes = [Consts.GAME_TYPE.FREE_PLAY];
			}
			utils.invokeCallback(cb, listGameModes);
		});
	}
};

Handler.prototype.checkOpenGameModeRegister = function(platform, user_name) {
	var database = Database.getInstance();
	var listPlatFormFullModes = GameConfig.getInstance().getPlatform_default_full_mode();
	if (platform && listPlatFormFullModes) {
		if (listPlatFormFullModes.indexOf(platform) >= 0) {
			database.updateUserByName(user_name, 'mode_play', 1);
			return [Consts.GAME_TYPE.FREE_PLAY, Consts.GAME_TYPE.CHALLENGE, Consts.GAME_TYPE.QUICK_PLAY];
		} else {
			return [Consts.GAME_TYPE.FREE_PLAY];
		}
	} else {
		database.updateUserByName(user_name, 'mode_play', 1);
		return [Consts.GAME_TYPE.FREE_PLAY, Consts.GAME_TYPE.CHALLENGE, Consts.GAME_TYPE.QUICK_PLAY];
	}
};

function isOkPass(p){
	var anUpperCase = /[A-Z]/;
	var aLowerCase = /[a-z]/;
	var aCharacter = /[a-zA-Z]/;
	var aNumber = /[0-9]/;
	var aSpecial = /[!|@|#|$|%|^|&|*|(|)|-|_]/;
	var obj = {};
	obj.result = true;

	//if(p.length < 15){
	//	obj.result=false;
	//	obj.error="Not long enough!"
	//	return obj;
	//}

	var numUpper = 0;
	var numLower = 0;
	var numNums = 0;
	var numCharacter = 0;
	var numSpecials = 0;
	for(var i=0; i<p.length; i++){
		/*if(anUpperCase.test(p[i]))
			numUpper++;
		else if(aLowerCase.test(p[i]))
			numLower++;*/
		if(aCharacter.test(p[i]))
			numCharacter++;
		else if(aNumber.test(p[i]))
			numNums++;
		/*else if(aSpecial.test(p[i]))
			numSpecials++;*/
	}

	//if(numUpper < 2 || numLower < 2 || numNums < 2 || numSpecials <2){
	//	obj.result=false;
	//	obj.error="Wrong Format!";
	//	return obj;
	//}
	if (numCharacter < 1 || numNums < 1) {
		obj.result = false;
		obj.error = 'Mật khẩu phải có cả chữ và số';
		return obj;
	}
	return obj;
}

// ========================================================
// END IMPORTANT METHODS
// ========================================================

Handler.prototype.getSession = function(uid) {
	var sessionService = this.app.get('sessionService');
	var sessions = sessionService.getByUid(uid);
	if (sessions) {
		for (var i = 0; i < sessions.length; i++) {
			if (sessions[i].frontendId === this.app.getServerId()) {
				return sessions[i];
			}
		}
	} else {
		return null;
	}
};

Handler.prototype.checkDuplicateUserLogin = function(loginName) {
	var sessionService = this.app.get('sessionService');
	return !!(!!sessionService.getByUid(loginName) && loginName !== "root");
};

Handler.prototype.doNotifyDuplicatePlaying = function(session, callback) {
	var result = {
		code : Consts.FAILED,
		type : 1,
		message : 'Tài khoản này đã đăng nhập ở một thiết bị khác! Hoặc vẫn tồn tại nick trên server.'
	};
	callback(null, result);
};

Handler.prototype.doNotifyMaintance = function(session, callback) {
	var result = {
		code : Consts.FAILED,
		type : 1,
		message : 'Hệ thống đang bảo trì hãy quay lại sau 15 phút nữa. Mong bạn thông cảm !'
	};
	callback(null, result);
};

Handler.prototype.doNotifyNameNotExists = function(session, callback) {
	var result = {
		code : Consts.FAILED,
		type : 2,
		message : 'Mật khẩu hoặc tài khoản không đúng'
	};
	callback(null, result);
};

Handler.prototype.doNotifyAccountInActive = function(session, callback) {
	var result = {
		code : Consts.FAILED,
		type : 3,
		message : 'Tài khoản chưa kích hoạt'
	};
	callback(null, result);
};

Handler.prototype.doNotifyAccountBlocked = function(session, callback) {
	var result = {
		code : Consts.FAILED,
		type : 4,
		message : 'Tài khoản của bạn đã bị khóa'
	};
	callback(null, result);
};

Handler.prototype.doNotifyErrorCreateUser = function(session, callback) {
	var result = {
		code : Consts.FAILED,
		type : 5,
		message : 'Error when create account. Please try again later.'
	};
	callback(null, result);
};

Handler.prototype.doNotifyErrorDeviceIdInvalid = function(session, callback) {
	var result = {
		code : Consts.FAILED,
		type : 6,
		message : 'Device Id bị lỗi. Vui lòng clear data của game hoặc cài lại game'
	};
	callback(null, result);
};