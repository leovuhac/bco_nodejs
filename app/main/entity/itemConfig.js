var instance;

var ItemConfig = function() {
    this.mapper = {};
};

function getInstance () {
    if (!instance) {
        instance = new ItemConfig();
    }
    return instance;
};

module.exports = {
    getInstance : getInstance
};

var prot = ItemConfig.prototype;

prot.addData = function(data) {
    if (data.hasOwnProperty('item_id')) {
        this.mapper[data.item_id] = data;
    }
};

prot.getArrayItemActive = function() {
    var array = [];
    for (var k in this.mapper) {
        array.push(this.mapper[k]);
    }
    return array;
};

prot.getItemData = function(item_id) {
    return this.mapper[item_id];
};

prot.reset = function() {
    this.mapper = {};
};
