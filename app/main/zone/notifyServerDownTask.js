var pomelo = require('pomelo');
var messageService = require('../../domain/messageService');
var Commands = require('../../lib/constants/commands');
var Debug = require('../../log/debug');

var NotifyTask = function(opts) {
    this.interval = 1000;
    this.count = 6;
    this.startTime = Date.now();
};

module.exports = NotifyTask;

var prototype = NotifyTask.prototype;

prototype.run = function() {
    this.count = 6;
    this.startTime = Date.now();
    this.interval = setInterval(this.tick.bind(this), this.interval);
};

prototype.close = function () {
    clearInterval(this.interval);
};

prototype.tick = function() {
    var deltaTime = (Date.now() - this.startTime) / 1000;
    if (Date.now() - this.startTime > 60000) {
        this.count--;
        this.startTime = Date.now();
        var reqInfo = {};
        reqInfo["content"] = "Xin thông báo server sẽ tắt sau " + this.count + " phút nữa để bảo trì. Các bạn sẽ bị mất kết nối  khi kết thúc ván chơi!";
        var allUser = pomelo.app.get('userManagerService').getAllUsers();
        for (var k in allUser) {
            var u = allUser[k];
            messageService.pushMessageToUser(u, Commands.NOTIFY_ALL, reqInfo);
        }
        Debug.isShutdown = true;
    }
    if (this.count === 0) {
        this.close();
    }
};

