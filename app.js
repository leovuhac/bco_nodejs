var pomelo = require('pomelo');
var logger = require('pomelo-logger');
var playerFilter = require('./app/servers/room/filter/playerFilter.js');
var Debug = require('./app/log/debug.js');
var ChatService = require('./app/domain/chatService.js');
var UserManagerService = require('./app/domain/userManagerService');
var GameZone = require('./app/main/zone/gameZone');
var LevelTable = require('./app/lib/constants/levelTable');
//var httpPlugin = require('pomelo-http-plugin');
var path = require('path');
var memwatch = require('memwatch');
var heapdump = require('heapdump');
var routeUtil = require('./app/util/routeUtil');

//var hd;
//memwatch.on('leak', function(info) {
//  console.error('Memory leak detected: ', info);
//  var file = './logs/HeapDiff/' + process.pid + '-' + Date.now() + '.heapsnapshot';
//  heapdump.writeSnapshot(file, function(err){
//    if (err) console.error(err);
//    else console.error('Wrote snapshot: ' + err);
//  });
//  if (!hd) {
//    hd = new memwatch.HeapDiff();
//  } else {
//    var diff = hd.end();
//    console.error(util.inspect(diff, true, null));
//    hd = null;
//  }
//});

memwatch.on('stats', function(info) {
  //console.info('GC stats detected: ', info);
});

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'bancaonline');

app.disable('rpcDebugLog');
//app.enable('systemMonitor');

logger.configure({
  appenders: [
    { type: 'datePartFile',
      filename: '${opts:base}/game-logs/#date_folder#/log',
      pattern: '-yyyy-MM-dd-hh',
      category: 'game-log'
    }
  ]
}, {base : app.getBase(), pattern: '-yyyy-MM-dd-hh'});

// configure for global
app.configure('production|development', function() {
  // proxy configures
  app.set('proxyConfig', {
    cacheMsg: true,
    interval: 30,
    lazyConnection: true
    // enableRpcLog: true
  });

  // remote configures
  app.set('remoteConfig', {
    cacheMsg: true,
    interval: 30
  });

  // route configures
  app.route('room', routeUtil.room);
  app.route('connector', routeUtil.connector);
  //app.before(pomelo.filters.toobusy());
  app.loadConfig('mysql', app.getBase() + '/config/mysql.json');
  //var onlineUser = require('./app/modules/onlineUser');
  //if(typeof app.registerAdmin === 'function'){
  //  app.registerAdmin(onlineUser, {app: app});
  //}
  //app.filter(pomelo.filters.timeout());
});

// Configure database
app.configure('production|development', 'room|chat|gate|connector|master', function() {
  var dbclient = require('./app/lib/database/mysql/mysql').init(app);
  app.set('dbclient', dbclient);
});

app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
      {
        connector : pomelo.connectors.sioconnector,
        //connector : pomelo.connectors.hybridconnector,
        //websocket, htmlfile, xhr-polling, jsonp-polling, flashsocket
        transports : ['websocket'],
        heartbeats : true,
        closeTimeout : 30,
        heartbeatTimeout : 30,
        heartbeatInterval : 15,
        //useDict: true,
        //useProtobuf: true
      });
  var gameZone = new GameZone({inConnector : true});
  gameZone.init();
  app.zone = gameZone;
});

app.configure('production|development', 'gate', function(){
  app.set('connectorConfig',
      {
        connector : pomelo.connectors.sioconnector,
        //connector : pomelo.connectors.hybridconnector,
        transports : ['websocket'],
        heartbeats : true,
        closeTimeout : 30,
        heartbeatTimeout : 30,
        heartbeatInterval : 15
      });
});

app.configure('production|development', 'room', function() {
  app.filter(pomelo.filters.serial());
  app.before(playerFilter());
  app.set('userManagerService', new UserManagerService());
  var gameZone = new GameZone({inConnector : false});
  gameZone.init();
  app.zone = gameZone;
});

app.configure('production|development', 'chat', function() {
  app.set('chatService', new ChatService(app));
});

app.set('errorHandler', function(err, msg, resp, session, cb) {
  Debug.error("app " + msg, err);
});

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
  Debug.error("app", err);
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// start app
app.start();
//FishGenerator.getInstance().generateFish({'totalFish' : 300});

//var Hashids = require('./app/util/hashids');
//var hashids = new Hashids('BancaOnline', 6);
//
//var id = hashids.encode(1); // o2fXhV
//var numbers = hashids.decode(id); // [1, 2, 3]
//console.log("HashIds : " + id);
//console.log("Numbers Decode : " + numbers);