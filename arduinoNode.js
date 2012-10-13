
var sys = require("sys"), 
	fs = require('fs'),
	io = require('socket.io').listen(8080);

	io.configure(function () {
		'use strict';
	io.set('transports', [
			'websocket'
			, 'flashsocket'
			, 'htmlfile'
			, 'xhr-polling'
			, 'jsonp-polling'
	]);
});

//noduino class
 var noduino = {
	serial : null,
	arduinoC : null,
	arduinoP : null,
	allSockets : function (){},
	init : function (arr) {
		'use strict';
		console.dir(arr);
		if (noduino.serial === null && noduino.arduinoC === null) {
			noduino.sp = require("serialport");
			noduino.serial = noduino.sp.SerialPort;
			var parseObj = {parser : noduino.sp.parsers.readline("\n")};
			if (arr.length === 1) {
				noduino.arduinoC = new noduino.serial('/dev/' + arr[0], parseObj);
				noduino.arduinoC.on('data', function (data){
					var first = data.substring(0, 1);
					if (first === 'f' || first === 'x' || first === 'c' || first === 'b' || first === 'p') {
						noduino.writeResponse('mono', first);
					}
				});
				console.log('successfully connected to single arduino');
			} else if (arr.length === 2) {
				noduino.arduinoC = new noduino.serial('/dev/' + arr[0], parseObj);
				console.log('successfully connected to camera arduino');
				noduino.arduinoP = new noduino.serial('/dev/' + arr[1], parseObj);
				console.log('successfully connected to projector arduino');
				noduino.arduinoP.on('data', function (data){
					var first = data.substring(0, 1),
						sec = data.substring(0,2);
					if (first === 'f' || first === 'x' || first === 'b' || first === 'p') {
						noduino.writeResponse('proj', first);
					} else if(sec === 'ca'){
						noduino.writeResponse('cam', data);
					}
				});
			} else if(arr.length === 0) {
				//TODO: debug mode
				//Thought: mono mode works well for debugging if the arduino is set to debug mode
				//might need an additional case, though
			}
		} else {
			console.log('already connected');
		}
	},
	_disconnect : function () {
		'use strict';
		noduino.serial = null;
		noduino.arduinoC = null;
		noduino.arduinoP = null;
	},
	time: function (){
		'use strict';
		//TODO: time responses
	},

//--------------------------------------------------------------
// Write sequence
//--------------------------------------------------------------   
	sequence: [],
	which: 0,
	write : function (arr) {
		'use strict';
		console.dir(arr);
		noduino.sequence = arr;
		noduino.writeAction();
	},
	writeAction: function (){
		'use strict';
		noduino.writeCases(noduino.sequence[noduino.which]);
		console.log('sent ' + noduino.sequence[noduino.which]);
		noduino.allSockets('uiSentCmd', {'sequence': noduino.sequence, 'which': noduino.which});
	},
	writeResponse: function (source, data){
		'use strict';
		var blank = [];
		if (noduino.sequence !== blank) {
			if (source === 'cam') {
				//console.log(data);
				var newData = data.split(':');
				data = newData[1].substring(0, newData[1].length - 1);
			}
			if (noduino.arduinoP === null){
				//Nothing special for now...
				if (data.length > 1) {data = 'c';}
				noduino.allSockets('uiRcdCmd', data);
			} else if (noduino.arduinoC !== null && noduino.arduinoP !== null ) {
				if (source === 'cam' && noduino.sequence[noduino.which] === 'x') {
					console.log(source + ' returned ' + data);
					return false;
				}
			}

			if (noduino.sequence.length === 1){
				console.log(source + ' returned ' + data);
				if (data.length > 1) {data = 'c';}
				noduino.allSockets('uiRcdCmd', data);
				noduino.sequenceCompleted();
			} else if (noduino.sequence.length !== 1 || noduino.sequence.length !== 0) {
				console.log(source + ' returned ' + data);
				if (data.length > 1) {data = 'c';}
				noduino.allSockets('uiRcdCmd', data);
				noduino.which += 1;
				if (noduino.which !== noduino.sequence.length) {
					noduino.writeAction();
				} else {
					noduino.sequenceCompleted();
				}
			}
		}
	},
	sequenceCompleted: function (){
		'use strict';
		console.log('sequence completed:');
		console.log(noduino.sequence);
		noduino.allSockets('sequenceComplete', noduino.sequence);
		noduino.sequence = [];
		noduino.which = 0;
	},
	writeCases : function (c) {
		'use strict';
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
	'use strict';
	socket.on('connectPrinter', function(data){
		noduino.init(data);
		socket.emit('connectPrinterResponse',{
			'success': true
		});
	});
	noduino.allSockets = function (key, data){
		io.sockets.emit(key, data);
	};
	socket.on('printerWrite', function(data){
		noduino.write(data);
	});
});