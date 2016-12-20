var instance;

var FishConfig = function() {
    this.mapper = {};
    this.orbits = {};
    this.specialWaves = {};
    this.listSpecialWaveIds = [];
};

function getInstance () {
    return module.exports.instance;
}

module.exports = {
    getInstance : getInstance,
    instance : new FishConfig()
};

var prot = FishConfig.prototype;

prot.addData = function(data) {
    if (data.hasOwnProperty('code')) {
        if (typeof data.orbit === 'string') {
            var orbitArrStr = data.orbit.split('-');
            var orbitArr = [];
            for (var i = 0; i < orbitArrStr.length; i++) {
                orbitArr.push(Number(orbitArrStr[i]));
            }
            data.orbit = orbitArr;
        }
        if (typeof data.list_items === 'string') {
            var itemsArrStr = data.list_items.split(',');
            var itemsArr = [];
            for (var i = 0; i < itemsArrStr.length; i++) {
                itemsArr.push(Number(itemsArrStr[i]));
            }
            data.list_items = itemsArr;
        }
        this.mapper[data.code] = data;
    }
};

prot.getDataFish = function(id) {
    return this.mapper[id];
};

prot.addOrbit = function(orbit) {
    if (orbit.hasOwnProperty('id')) {
        this.orbits[orbit.id] = orbit;
    }
};

prot.getOrbit = function(id) {
    return this.orbits[id];
};

prot.addSpecialWave = function(wave) {
    if (wave.hasOwnProperty('wave_id')) {
        this.specialWaves[wave.wave_id] = wave;
        this.listSpecialWaveIds.push(wave.wave_id);
    }
};

prot.getSpecialWave = function(id) {
    return this.specialWaves[id];
};

prot.clear = function() {
    for (var k1 in this.orbits) {
        delete this.orbits[k1];
    }
    for (var k2 in this.mapper) {
        delete this.mapper[k2];
    }
    for (var k3 in this.specialWaves) {
        delete  this.specialWaves[k3];
    }
    this.listSpecialWaveIds.splice(0, this.listSpecialWaveIds.length);
};