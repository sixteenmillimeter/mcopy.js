
var sys = require("sys"), 
	fs = require('fs'),
	io = require('socket.io').listen(8080);

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
 				noduino.arduinoC.on('data', function (data){
 					console.log('CAM/PROJ RC:' + data);
 				});
	 		} else if (arr.length === 2) {
	 			noduino.arduinoC = new noduino.serial('/dev/' + arr[0]);
	 			noduino.arduinoC.on('data', function (data){
 					console.log('CAM RC:' + data);
 				});
	 			noduino.arduinoP = new noduino.serial('/dev/' + arr[1]);
	 			noduino.arduinoP.on('data', function (data){
 					console.log('PROJ RC:' + data);
 				});
	 		}
	 		console.log('successfully connected');
 		} else {
 			console.log('already connected');
 		}
 	},
	_disconnect : function () {
		noduino.serial = null;
		noduino.arduinoC = null;
		noduino.arduinoP = null;
	},
	time: function (){
		//TODO: time responses
	},
 	write : function (arr) {
 		for (var i in arr) {
 			if (i === 0) {
 				noduino.writeCases(arr[i]);
 			} else {
 				setTimeout(function () {
 					noduino.writeCases(arr[i]);
 				}, noduino.timing[arr[i - 1]]);
 			}
 			
 		}
 	},
 	writeCases : function (c) {
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