var sys = require("sys"), 
	fs = require('fs'),
	io = require('socket.io').listen(8080);

//socket server
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
		'f' : 1300,
		'b' : 2000,
		'c' : 1000,
		'x' : 2500,
		'p' : 1000
	},
 	_init : function (arr) {
 		console.dir(arr);
 		if (noduino.serial === null && noduino.arduinoC === null) {
 			noduino.serial = require("serialport").SerialPort;
 			if (arr.length === 1) {
 				noduino.arduinoC = new noduino.serial('/dev/' + arr[0]);
 				console.log('successfully connected');
	 		} else if (arr.length === 2) {
	 			noduino.arduinoC = new noduino.serial('/dev/' + arr[0]);
	 			noduino.arduinoP = new noduino.serial('/dev/' + arr[1]);
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
 				noduino.writeCase(arr[i]);
 		}
 	},
 	writeCase : function (c) {
 		if (noduino.arduinoP === null) {
 			noduino.arduinoC.write(c);
 		} else if (noduino.arduinoC !== null && noduino.arduinoP !== null ){
 			if (c === 'c') {
 				noduino.arduinoC.write('3');
 			} else if (c === 'f' || c === 'b') {
 				noduino.arduinoP.write(c);
 			} else if (c === 'x') {
 				noduino.arduinoP.write(c);
 				setTimeout(function () {
 					noduino.arduinoC.write('3');
 				}, 300);
 			}
 		}
 	}
 };
