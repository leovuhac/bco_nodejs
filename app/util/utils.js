var utils = module.exports;

// control variable of func "myPrint"
var isPrintFlag = false;
// var isPrintFlag = true;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function(cb) {
  if(!!cb && typeof cb === 'function') {
    cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};

/**
 * clone an object
 */
utils.clone = function(origin) {
  if(!origin) {
    return;
  }

  var obj = {};
  for(var f in origin) {
    if(origin.hasOwnProperty(f)) {
      obj[f] = origin[f];
    }
  }
  return obj;
};

utils.size = function(obj) {
  if(!obj) {
    return 0;
  }

  var size = 0;
  for(var f in obj) {
    if(obj.hasOwnProperty(f)) {
      size++;
    }
  }

  return size;
};

// print the file name and the line number ~ begin
function getStack(){
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack) {
    return stack;
  };
  var err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}

function getFileName(stack) {
  return stack[1].getFileName();
}

function getLineNumber(stack){
  return stack[1].getLineNumber();
}

utils.myPrint = function() {
  if (isPrintFlag) {
    var len = arguments.length;
    if(len <= 0) {
      return;
    }
    var stack = getStack();
    var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
    for(var i = 0; i < len; ++i) {
      aimStr += arguments[i] + ' ';
    }
    console.log('\n' + aimStr);
  }
};
// print the file name and the line number ~ end

utils.create2DArray = function(rows) {
  var arr = [];

  for (var i=0;i<rows;i++) {
     arr[i] = [];
  }

  return arr;
};

utils.create2DIntArray = function(rows, cols) {
  var arr = [];

  for (var i=0;i<rows;i++) {
    arr[i] = utils.initInArray(cols);
  }

  return arr;
};

utils.random = function(n) {
  return Math.floor((Math.random() * n));
};

utils.randomBetween = function(min, max) {
  return Math.floor((Math.random() * (max - min)) + min);
};

utils.initInArray = function(size) {
  var arr = [];
  for (var i = 0; i < size; i++) {
    arr[i] = 0;
  }
  return arr;
};

utils.initBoolArray = function(size) {
  var arr = [];
  for (var i = 0; i < size; i++) {
    arr[i] = false;
  }
  return arr;
};

utils.convertTimestampToDate = function(mysql_string) {
  if(typeof mysql_string === 'string')
   {
      var t = mysql_string.split(/[- :]/);

      //when t[3], t[4] and t[5] are missing they defaults to zero
      return new Date(t[0], t[1] - 1, t[2], t[3] || 0, t[4] || 0, t[5] || 0);          
   } else if (typeof mysql_string === 'number') {
      return new Date(mysql_string);
   }
   return null;
};

utils.removeArray = function(arr1,arr2) {
  //var result = arr1.filter(function(item) {
  //  return arr2.indexOf(item) === -1;
  //});
  //return result;
  if (arr2.length === 0) {
    return arr1;
  }
  for (var i = 0; i < arr1.length; i++) {
    for (var j = 0; j < arr2.length; j++) {
      if (arr1[i] === arr2[j]) {
        arr1.splice(i, 1);
        i--;
      }
    }
  }
  return arr1;
};

utils.removeItem = function(arr, item) {
  var index = arr.indexOf(item);
  arr.splice(index,1);
};

utils.containAll = function(arr1,arr2) {
  var result = arr1.filter(function(item){
    return arr2.indexOf(item) > -1
  });
  return (result.length > 0);
};

utils.create2D = function(rows,cols) {
  var arr = [];
  for(var i = 0; i< rows;i++) {
    var arr2 = [];
    for(var j = 0; j< cols;j++) {
      arr2[j] = 0;
    }
    arr[i] = arr2;
  }
  return arr;
};

utils.convertArrayToString = function(arr) {
  var str = "";
  for (var i = 0; i < arr.length; i++) {
    str += arr[i] + ",";
  }
  return str;
};


