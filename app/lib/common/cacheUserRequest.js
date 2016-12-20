var CacheUserRequest = function() {
    this.stores = {};
};

module.exports = CacheUserRequest;

CacheUserRequest.prototype.add = function(username, requestId) {
    var key = username + ":" + requestId;
    this.stores[key] = 1;
};

CacheUserRequest.prototype.remove = function(username, requestId) {
    var key = username + ":" + requestId;
    if (this.stores.hasOwnProperty(key)) {
        delete  this.stores[key];
    }
};

CacheUserRequest.prototype.has = function(username, requestId) {
    var key = username + ":" + requestId;
    return this.stores.hasOwnProperty(key);
};