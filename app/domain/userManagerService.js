var UserManagerService = function () {
	this.usersByName = {};
	this.usersById = {};
	this.countUser = 0;	
};

module.exports = UserManagerService;

// function getInstance () {
// 	// if (!module.exports.instance) {
// 	// 	module.exports.instance = new UserManagerService();
// 	// }
// 	return module.exports.instance;
// }

// module.exports = {
// 	getInstance : getInstance,
// 	instance : new UserManagerService()
// }

UserManagerService.prototype.getCountUser = function() {
	return this.countUser;
};

UserManagerService.prototype.addUser = function(user) {
	if (!user) {
		return;
	}
	if (!this.containsUser(user)) {
		this.usersById[user.getId()] = user;
		this.usersByName[user.getName()] = user;
		this.countUser++;
	}	
};

UserManagerService.prototype.containsId = function(userId) {
	return this.usersById.hasOwnProperty(userId);
};

UserManagerService.prototype.containsName = function(name) {
	return this.usersByName.hasOwnProperty(name);
};

UserManagerService.prototype.containsUser = function(user) {
	return this.usersById.hasOwnProperty(user.getId());
};

UserManagerService.prototype.removeUser = function(user) {
	delete this.usersById[user.getId()];
	delete this.usersByName[user.getName()];
	this.countUser--;
};

UserManagerService.prototype.removeUserById = function(userId) {
	var user = this.usersById[userId];
	if (user) {
		this.removeUser(user);
	}
};

UserManagerService.prototype.removeUserByName = function(name) {
	var user = this.usersByName[name];
	if (user) {
		this.removeUser(user);
	}
};

UserManagerService.prototype.getUserById = function(userId) {
	if (this.containsId(userId)) {
		return this.usersById[userId];
	}
	return null;
};

UserManagerService.prototype.getUserByName = function(name) {
	if (this.containsName(name)) {
		return this.usersByName[name];
	}
	return null;
};

UserManagerService.prototype.getAllUsers = function() {
	return this.usersByName;
}

