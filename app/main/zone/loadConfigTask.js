var pomelo = require('pomelo');
var Database = require('../../lib/database/database');

var LoadConfigTask = function(opts) {
    this.interval = opts.interval || 60 * 1000;
    this.gameZone = opts.gameZone;
};

module.exports = LoadConfigTask;

var prototype = LoadConfigTask.prototype;

prototype.run = function() {
    this.interval = setInterval(this.tick.bind(this), this.interval);
};

prototype.close = function () {
    clearInterval(this.interval);
};

prototype.tick = function() {
    //
    try {
        if (this.gameZone) {
            this.gameZone.reload();
        }
    } catch (e) {
        console.log(e.stack);
    }
};