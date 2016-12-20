var FishConfig = require('./fishConfig');
var ItemConfig = require('./itemConfig');
var utils = require('../../util/utils');

var instance;

var ItemGenerator = function() {

};

function getInstance () {
    if (!instance) {
        instance = new ItemGenerator();
    }
    return instance;
};

module.exports = {
    getInstance : getInstance
};

var prot = ItemGenerator.prototype;

prot.genItemWhenFishDead = function(fish, player, extras) {
    var result = {has_item : false, item_id : 0};

    var dataFish = FishConfig.getInstance().mapper[fish.fishTypeId];
    if (!dataFish) {
        return result;
    }
    var listItems = dataFish.list_items;
    var maxRandomGenItem = extras.maxRandomGenItem || 120/*1*/; //tien ca vang + ca than tai ban chet dc ti le item lon nhat
    var idRandom = utils.random(maxRandomGenItem);
    var fish_prize_min = dataFish.prize_min;
    if (idRandom < fish.fishTypeId) {
        var percentItemsAppear = [];
        var itemsValid = [];
        var totalPercentItemsAppear = 0;
        for (var i = 0; i < listItems.length; i++) {
            var dataItem = ItemConfig.getInstance().getItemData(listItems[i]);
            if (dataItem && dataItem.active === 1) {
                percentItemsAppear[i] = dataItem.percent_appear;
                itemsValid[i] = listItems[i];
                totalPercentItemsAppear += dataItem.percent_appear;
            }
        }
        //Cong tong percent_appear cac item active lai roi random sau do xem item_id xuat hien o khoang nao
        var itemId = 0;
        var randomAppearItem = utils.random(totalPercentItemsAppear);
        for (var i = 0; i < percentItemsAppear.length; i++) {
            if (randomAppearItem < percentItemsAppear[i]) {
                itemId = itemsValid[i];
                break;
            } else {
                randomAppearItem -= percentItemsAppear[i];
            }
        }
        if (itemId > 0) {
            result = {has_item : true, item_id : itemId};
        }
    }

    return result;
};
