
var sys = require("sys"), 
	fs = require('fs'),
	exec = require('child_process').exec,
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

var noduino = {};
//--------------------------------------------------------------
// noduino Class
//-------------------------------------------------------------- 

noduino.serial = null;
noduino.arduinoC = null;
noduino.arduinoP = null;
noduino.cmd = ['f', 'x', 'c', 'b', 'p', 'd'];
noduino.allSockets = function (){};
noduino.init = function (arr) {
	'use strict';
	console.log('noduino.init <!--');
	console.dir(arr);
	console.log('noduino.init -->');
	if (noduino.serial === null && noduino.arduinoC === null) {
		noduino.sp = require("serialport");
		noduino.serial = noduino.sp.SerialPort;
		var parseObj = {parser : noduino.sp.parsers.readline("\n")};
		if (arr.length === 1) {
			noduino.arduinoC = new noduino.serial('/dev/' + arr[0], parseObj);
			noduino.arduinoC.on('data', function (data){
				var first = data.substring(0, 1);
				if (first === 'f' || first === 'x' || first === 'c' || first === 'b' || first === 'p' || first === 'd') {
				//if ($.inArray(first, noduino.cmd) > -1) {
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
				console.log('Raw return:' + data);
				var first = data.substring(0, 1),
					sec = data.substring(0,2);
				if (first === 'f' || first === 'x' || first === 'b' || first === 'p' || first === 'd') {
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
};
noduino._disconnect = function () {
	'use strict';
	noduino.serial = null;
	noduino.arduinoC = null;
	noduino.arduinoP = null;
};
noduino.time = function (){
	'use strict';
	//TODO: time responses
};

//--------------------------------------------------------------
// noduino sequence functions
//--------------------------------------------------------------   
noduino.sequence = [];
noduino.which = 0;

noduino.write = function (arr) {
	'use strict';
	console.dir(arr);
	noduino.sequence = arr;
	noduino.writeAction();
};

noduino.writeAction = function (){
	'use strict';
	noduino.writeCases(noduino.sequence[noduino.which]);
	console.log('sent ' + noduino.sequence[noduino.which]);
	noduino.allSockets('uiSentCmd', {'sequence': noduino.sequence, 'which': noduino.which});
};

noduino.writeResponse = function (source, data){
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
	} else if (source = 'mono') {
		//RIGHT NOW DEBUG IS THE ONLY CASE
		noduino.allSockets('uiRcdCmd', data);
		noduino.which += 1;
		if (noduino.which !== noduino.sequence.length) {
			noduino.writeAction();
		} else {
			noduino.sequenceCompleted();
		}
	}
};

noduino.sequenceCompleted = function (){
	'use strict';
	console.log('sequence completed:');
	console.log(noduino.sequence);
	noduino.allSockets('sequenceComplete', noduino.sequence);
	noduino.sequence = [];
	noduino.which = 0;
};

noduino.writeCases = function (c) {
	'use strict';
	if (noduino.arduinoP === null) {
		noduino.arduinoC.write(c);
	} else if (noduino.arduinoC !== null && noduino.arduinoP !== null ){
		if (c === 'c') {
			noduino.arduinoC.write('3');
		} else if (c === 'f' || c === 'b' || c === 'd') {
			noduino.arduinoP.write(c);
		} else if (c === 'x') {
			noduino.arduinoP.write(c);
			setTimeout(function () {
				noduino.arduinoC.write('3');
			}, 300);
		}
	}
};

//ported from arduinoFinder.php
noduino.find = function (callback) {
	'use strict';
		//LIBRARY of known arduinos
	var known = [
			'/dev/tty.usbmodem1a161', 
			'/dev/tty.usbserial-A800f8dk', 
			'/dev/tty.usbserial-A900cebm', 
			'/dev/tty.usbmodem1a131',
			'/dev/tty.usbserial-a900f6de'
			];
	var puts = function(error, stdout, stderr) { 
		if (error === null) {
			var arduino = [],
				arr = stdout.split("\n");
			for (var i = 0; i < arr.length; i++) {
				var check = arr[i].toLowerCase();
				if (known.indexOf(check) !== -1 || check.indexOf('usbmodem') !== -1 || check.indexOf('usbserial') !== -1) {
					arduino.push(arr[i]);
				}
			}
			callback(arduino);
		} else {
			callback(error);
		}
	};
	exec('ls /dev/*', puts);
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