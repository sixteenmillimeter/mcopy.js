var sys = require("sys"), 
	fs = require('fs'),
	io = require('socket.io').listen(8080);

io.sockets.on('connection', function (socket) {
  socket.on('connectPrinter', function(data){
  	noduino._init(data);
  	socket.emit('connectPrinterResponse',{
  		'success': true
  	})
  });
  socket.on('printerWrite', function(data){
  	noduino.write(data);
  });
});

//noduino class

 var noduino = {
 	serial : null,
	arduinoC : null,
	arduinoP : null,
	timing : {
		'f' : 1000,
		'b' : 2000,
		'c' : 1000,
		'x' : 2000,
		'p' : 1000
	},
 	_init : function (arr) {
 		console.dir(arr);
 		if (noduino.serial === null && noduino.arduinoC === null) {
 			noduino.serial = require("serialport").SerialPort;
 			if (arr.length === 1) {
 				noduino.arduinoC = new noduino.serial('/dev/' + arr[0]);
 				console.log('successfully connected')
	 		} else if (arr.length === 2) {

	 		}
	 		
 		} else {
 			console.log('already connected');
 		}
 	},
	_disconnect : function () {
		noduino.serial = null;
		noduino.arduinoC = null;
		noduino.arduinoP = null;
	},
 	write : function (arr) {
 		for (var i in arr) {
 			console.log(arr[i]);
 			if ( i === 0) {
 				noduino.arduinoC.write(arr[i]);
 			} else {
 				//setTimeout(function () {
 					noduino.arduinoC.write(arr[i]);
 				//}, noduino.timing[arr[i]]);
 			}
 		}
 	}
 };
