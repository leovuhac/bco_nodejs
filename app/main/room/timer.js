var Timer = function(opts){
  this.gameController = opts.gameController;
  this.interval = opts.interval||100;
};

module.exports = Timer;

Timer.prototype.run = function () {
  this.interval = setInterval(this.tick.bind(this), this.interval);
};

Timer.prototype.close = function () {
  clearInterval(this.interval);
};

Timer.prototype.tick = function() {
    var gameController = this.gameController;
    gameController.doLoop();
}