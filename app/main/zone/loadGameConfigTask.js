var pomelo = require('pomelo');

var LoadGameConfigTask = function(opts) {
    this.interval = opts.interval || 60 * 1000;
    this.gameZone = opts.gameZone;
};

module.exports = LoadGameConfigTask;

var prototype = LoadGameConfigTask.prototype;

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
            //console.log('=== Connector ReLoad GameConfig');
            this.gameZone.loadGameConfig();
        }
    } catch (e) {
        console.log(e.stack);
    }
};
