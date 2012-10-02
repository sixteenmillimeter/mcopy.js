
var sys = require("sys"), 
	fs = require('fs'),
	io = require('socket.io').listen(8080);

//noduino class
 var noduino = {
 	serial : null,
	arduinoC : null,
	arduinoP : null,
 	_init : function (arr) {
 		console.dir(arr);
 		if (noduino.serial === null && noduino.arduinoC === null) {
 			noduino.sp = require("serialport"),
 			noduino.serial = noduino.sp.SerialPort,
 			parseObj = {parser : noduino.sp.parsers.readline("\n")};
 			if (arr.length === 1) {
 				noduino.arduinoC = new noduino.serial('/dev/' + arr[0], parseObj);
 				noduino.arduinoC.on('data', function (data){
 					var first = data.substring(0, 1);
 					if (first === 'f' || first === 'x' || first === 'c' || first === 'b' || first === 'p') {
 						noduino.writeResponse('mono', first);
 					}
 				});
	 		} else if (arr.length === 2) {
	 			noduino.arduinoC = new noduino.serial('/dev/' + arr[0], parseObj);
	 			noduino.arduinoC.on('data', function (data){
 					noduino.writeResponse('cam', data);
 					//var first = data.substring(0, data.length - 1);
 					//if (first === 'f' || first === 'x' || first === 'c' || first === 'b' || first === 'p') {
 						//noduino.writeResponse('cam', first);
 					//}
 				});
	 			noduino.arduinoP = new noduino.serial('/dev/' + arr[1], parseObj);
	 			noduino.arduinoP.on('data', function (data){
 					var first = data.substring(0, 1);
 					if (first === 'f' || first === 'x' || first === 'c' || first === 'b' || first === 'p') {
 						noduino.writeResponse('proj', first);
 					} 				
 				});
	 		} else if(arr.length === 0) {
	 			//TODO: debug mode
	 			//Thought: mono mode works well for debugging if the arduino is set to debug mode
	 			//might need an additional case, thoug
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

//--------------------------------------------------------------
// Write sequence
//--------------------------------------------------------------   
	sequence: [],
	which: 0,
 	write : function (arr) {
 		noduino.sequence = arr;
 		noduino.writeAction();
 	},
 	writeAction: function (){
 		noduino.writeCases(noduino.sequence[noduino.which]);
 	},
 	writeResponse: function (source, data){
 		if (noduino.arduinoP === null){
 			//Nothing special for now...
 		} else if (noduino.arduinoC !== null && noduino.arduinoP !== null ) {
 			if (source === 'cam' && noduino.sequence[noduino.which] === 'x') {
 				console.log(source + ': ' + data);
 				return false;
 			}
 		}
  		if (noduino.sequence.length === 1){
 			console.log(source + ': ' + data);
 			noduino.sequence = [];
 			noduino.which = 0;
 		} else if (noduino.sequence.length !== 1 || noduino.sequence.length !== 0) {
 			console.log(source + ': ' + data);
 			noduino.which++;
 			if (noduino.which !== noduino.sequence.length) {
 				noduino.writeAction();
 			} else {
 				console.log('sequence completed:');
 				console.log(noduino.sequence);
 				noduino.sequence = [];
 				noduino.which = 0;
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