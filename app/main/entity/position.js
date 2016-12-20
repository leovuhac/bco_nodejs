var Position = function(opts) {
    this.x = 0;
    this.y = 0;
    if (opts) {
        this.x = opts.x;
        this.y = opts.y;
    }
};

module.exports = Position;
