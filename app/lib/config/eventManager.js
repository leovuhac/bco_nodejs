var EventManager = function(opts) {
    this.id = opts.id;
    this.eventId = opts.event_id;
    this.name = opts.name;
    this.content = opts.content;
    this.time_start = opts.time_start;
    this.time_end = opts.time_end;
    this.extras_info = opts.extras_info;
    this.state = opts.state || 0;
};

module.exports = EventManager;

var prot = EventManager.prototype;

prot.isAvailable = function() {
    var bl = false;
    if (this.state === 1 && Date.now() < this.time_end.getTime()) {
        bl = true;
    }
    return bl;
};