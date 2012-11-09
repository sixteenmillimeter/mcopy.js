/*
__/\\\\____________/\\\\________/\\\\\\\\\_______/\\\\\_______/\\\\\\\\\\\\\____/\\\________/\\\_        
 _\/\\\\\\________/\\\\\\_____/\\\////////______/\\\///\\\____\/\\\/////////\\\_\///\\\____/\\\/__       
  _\/\\\//\\\____/\\\//\\\___/\\\/_____________/\\\/__\///\\\__\/\\\_______\/\\\___\///\\\/\\\/____      
   _\/\\\\///\\\/\\\/_\/\\\__/\\\______________/\\\______\//\\\_\/\\\\\\\\\\\\\/______\///\\\/______     
	_\/\\\__\///\\\/___\/\\\_\/\\\_____________\/\\\_______\/\\\_\/\\\/////////__________\/\\\_______    
	 _\/\\\____\///_____\/\\\_\//\\\____________\//\\\______/\\\__\/\\\___________________\/\\\_______   
	  _\/\\\_____________\/\\\__\///\\\___________\///\\\__/\\\____\/\\\___________________\/\\\_______  
	   _\/\\\_____________\/\\\____\////\\\\\\\\\____\///\\\\\/_____\/\\\___________________\/\\\_______ 
		_\///______________\///________\/////////_______\/////_______\///____________________\///________
*/

var machineName = location.hostname,
	socket,
	arduino = {};
//--------------------------------------------------------------
// arduino Class
//-------------------------------------------------------------- 
arduino.serial = {
	'c' : 'cu.usbserial-A800f8dk',
	'p' : 'cu.usbserial-A900cebm'
};
arduino.cmd = ['f', 'b', 'c', 'x', 'p', 'd'];
arduino.timing = {
	'f' : 1300, //Projector Forward
	'b' : 2000, //Projector Backward
	'c' : 1000, //Camera (Forward only now)
	'x' : 2500, //Black Frame
	'p' : 1000, //Projector (alternate, for JK)
	'd' : 1000 //Pause machine (for 1 second)
};

/* arduino.post
* Posts to PHP-based controls located at arduino.php,
* falback for when node is not running or cannot be
* conected to. 
*
* @param	arr 	Array 	All commands sent to Arduinos
* @param	delegate function Callback for ajax
*/
arduino.post = function (arr, delegate) {
	'use strict';
	var arrOut = [],
		i;
	for (i in arr) {
		if ($.inArray(arr[i], arduino.cmd) !== -1) {
			arrOut = arrOut.concat(arr[i]);
		}
	}
	var data = {
		'serial' : this.serial,
		'val' : arrOut,
		'timing' : this.timing
	},
		dataString = JSON.stringify(data);
	$.ajax({
		url: './php/arduino.php',
		type: 'POST',
		data: dataString,
		dataType: 'json',
		success : delegate
	});
};

/* arduino.finder
* Makes an ajax get of php/arduinoFinder.php and
* returns an array of likely arduinos connected to
* the host machine. Used for both php-based and node-based
* controls but will likely be replaced entirely by node.
*
* @param	delegate 	function	ajax callback
*/
arduino.finder = function (delegate) {
	$.ajax({
		url: './php/arduinoFinder.php',
		type: 'GET',
		success: delegate
	});
 };

 /* arduino.finderResponse
 * The callback for arduino.finder, determines
 * the correct orientation of the arduinos connected
 * to the host machine. Evaluates the returned array
 * based on length. Currently two detected arduinos
 * on host machine results in controls being set to
 * default configuration of hard-coded devices.
 *
 * @param 	data 	Array 	listed arduinos
 */
arduino.finderResponse = function (data) {
	data = JSON.parse(data);
	if (data.length === 1) {
		//jk mode or blink
		arduino.serial.c = data[0];
		arduino.serial.p = data[0];
		$('#serialNameCam').val(arduino.serial.c);
		$('#serialNameProj').val(arduino.serial.p);
		if (arduinoNode.socketsOn) {
			arduinoNode.connect(data);
		}
	} else if (data.length === 2) {
		//mcopy detected.
		data[0] = 'cu.usbserial-A800f8dk';
		data[1] = 'cu.usbserial-A900cebm';
		arduino.serial.c = data[0];
		arduino.serial.p = data[1];
		$('#serialNameCam').val(arduino.serial.c);
		$('#serialNameProj').val(arduino.serial.p);
		if (arduinoNode.socketsOn) {
			arduinoNode.connect(data);
		}
	} else if (data.length === 0) {
		//debug mode
	}
	//console.dir(data);
};

var arduinoNode = {};
//--------------------------------------------------------------
// arduinoNode Class
//-------------------------------------------------------------- 

/* arduinoNode.connect
* Connects to node server. Is called by
* arduino.finderResponse if socket.io script
* is served to client properly. Declares listening
* sockets for socket.io. Currently: sequenceComplete.
* uiSentCmd, uiRcdCmd
*
* @param	data 	Array 	List of arduinos
*/
arduinoNode.connect = function (data){
	socket = io.connect(machineName + ':8080');
	socket.emit('connectPrinter', data);
	console.log('connected to socket.io');
	//OPEN SOCKETS
	socket.on('sequenceComplete', function (data){
		//console.log('completed sequence:');
		//console.dir(data);
		mcopy_ui.response(data);
		if (mcopy.isLoop){
			if(mcopy.loopTimes !== null){
				if (mcopy.loopTimes === mcopy.loopCount)
				mcopy.loopCount++;
			}
			mcopy.runSequence();
		}
	});
	socket.on('uiSentCmd', function (data) {
		//console.dir(data);
		mcopy_ui.highlight.sent(data);
	});
	socket.on('uiRcdCmd', function (data) {
		//console.dir(data);
		mcopy_ui.highlight.response(data);
	});
};
/* arduinoNode.socketsOn
*
*/
arduinoNode.socketsOn = function () {
	if (io !== undefined) {
		return true;
	}
	return false;
};
/* arduinoNode.write
*
*/
arduinoNode.write = function (cmd){
	socket.emit('printerWrite', cmd);
	//console.log('submitted sequence:');
	//console.dir(cmd);
};

var mcopy = {};
//--------------------------------------------------------------
// mcopy Class
//-------------------------------------------------------------- 
mcopy.sequence = [];
mcopy.camTotal = 0;
mcopy.projTotal = 0;

mcopy.isLoop = false;
mcopy.loopTimes = null;
mcopy.loopCount = null;
/* mcopy.write
*
*/
mcopy.write = function (cmd) {
	'use strict';
	if (arduinoNode.socketsOn) {
		arduinoNode.write([cmd], this.response);
	} else {
		arduino.post([cmd], this.response);
	}
};
/* mcopy.runSequence
*
*/
mcopy.runSequence = function () {
	'use strict';
	var writeArr = [];
	for(var i in this.sequence){
		if(this.sequence[i] === 'f' || this.sequence[i] === 'c' || this.sequence[i] === 'b' || this.sequence[i] === 'x' || this.sequence[i] === 'p' || this.sequence[i] === 'd'){
		//if($.inArray(this.sequence[i], arduino.cmd) > -1) {
			writeArr.push(this.sequence[i]);
		}
	}
	if (arduinoNode.socketsOn) {
		arduinoNode.write(writeArr);
	} else {
		arduino.post(writeArr, this.response);
	}
};
/* mcopy.response
*
*/
mcopy.response = function (data) {
	'use strict';
	//console.dir(data);
	if(data.success){
		if (mcopy.isLoop) {
			var delay = 0;
			for(var i in data.val){
				delay += arduino.timing[data.val[i]];
			}
			delay + 300;
			setTimeout('mcopy.runSequence()', delay);
		}
		mcopy_ui.response(data);
	}
};

//--------------------------------------------------------------
// ui Class
//-------------------------------------------------------------- 
var ui = {
	projector : 0,
	camera:0,
	_init : function () {
		'use strict';
		$('#serialNameCam').val(arduino.serial.c);
		$('#serialNameProj').val(arduino.serial.p);
		$('#serialNameCam').change(function () {
			arduino.serial.c = $(this).val();
		});
		$('#serialNameProj').change(function () {
			arduino.serial.p = $(this).val();
		});
		for (var i = 0; i < 24; i++) {
			mcopy.sequence[i] = '';
			$('#p').append('<span></span>');
			$('#c').append('<span></span>');
			$('#num').append('<span>' + i + '</span>');
		}
		$('#ui div span').click(function () {
			var row = $(this).parent().attr('id'),
				col = $(this).index(),
				all = $('#ui').find('.row');
			//console.log(row + ', '+col);
			for (var i = 0; i < all.size(); i++) {
				var thisRow = all.eq(i).attr('id');
				if (thisRow != row) {
					if ($('#' + thisRow + ' span').eq(col).hasClass('on')) {
						$('#' + thisRow + ' span').eq(col).toggleClass('on');
					}
				}
			}
			if ($(this).hasClass('on')) {
				mcopy.sequence[col] = '';
			}else{
				mcopy.sequence[col] = row;
			}
			$(this).toggleClass('on');
		});
		$('#isLoop').click(function () {
			if ($(this).hasClass('on')) {
				mcopy.isLoop = false;
				$(this).text('Loop: off');
			} else {
				mcopy.isLoop = true;
				$(this).text('Loop: on');
			}
			$(this).toggleClass('on');
		});
		$('#run').click(function () {
			$(this).addClass('on');
			mcopy.runSequence();
		});
		$('#clear').click(function () {
			$('.row .on').each(function (){
				$(this).removeClass('on');
			});
			for ( var i in mcopy.sequence) {
				mcopy.sequence[i];
			}
		});
	},
	response : function (data){
		'use strict';
		$('#run').removeClass('on');
		var loggedd = '';
		for (var i in data.val) {
			if (data.val[i] !== ''){
				if (data.val[i] === 'p') {
					mcopy.camTotal++;
					loggedd += data.val[i] + ' > ';
				} else if (data.val[i] === 'c') {
					mcopy.camTotal++;
					loggedd += data.val[i] + ' > ';
				}
			}
		}
		loggedd = loggedd.substring(0, loggedd.length-3);

		//TODO: ADD VISUALIZATION OF AT LEAST CAMERA + PROJECTOR TOTALS
		console.log('CAM: ' + mcopy.camTotal);
		console.log('PROJ: ' + mcopy.camTotal);
		//$('').text(mcopy.camTotal);
		//$('').text(mcopy.camTotal);
		if (data.success !== false){
			$('#log .container').append('<li><pre>' + loggedd + '</pre>');
		}
	},
	more : function (many) {
		'use strict';
		if (many === undefined || many === null) {

		}
	},
	highlight : {
		start : function (){
			'use strict';
			for(var i = 0; i < mcopy.sequence.length; i++){
				if(mcopy.sequence[i] != "") {
					if(i !== 0){
						//setTimeout('ui.highlight.next()', arduino.timing[mcopy.sequence[i]]);
						//console.log(mcopy.sequence[i]+' '+arduino.timing[mcopy.sequence[i]])
					}else{
						//ui.highlight.next();
						//setTimeout('ui.highlight.next()',arduino.timing[mcopy.sequence[i]]);
						//console.log(mcopy.sequence[i]+' '+arduino.timing[mcopy.sequence[i]])
					}
				}
			}
		},
		next : function () {
			'use strict';
			var where = $('#ui #num').find('.on'),
				pos = where.index();
			if (pos != -1) {
				where.removeClass('on');
				pos++;
				$('#ui #num span').eq(pos).addClass('on');
			} else {
				$('#ui #num span').eq(0).addClass('on');
			}
			
		},
		end : function () {
			'use strict';
			$('#ui #num').find('.on').removeClass('on');
		}
	}
} 

//--------------------------------------------------------------
// mcopy_ui Class
//-------------------------------------------------------------- 
var mcopy_ui = {
	clientType: 'default', //default = web, 'iPad', 'iPhone'
	projector : 0,
	camera:0,
	next : 0,
	/* mcopy_ui.init
	*
	*/
	_init : function () {
		'use strict';

		$('#serialNameCam').val(arduino.serial.c);
		$('#serialNameProj').val(arduino.serial.p);

		$('#serialNameCam').change(function () {
			arduino.serial.c = $(this).val();
		});

		$('#serialNameCam').focus(function () {
			mcopy_ui.deleteRelease = true;
		});
		$('#serialNameCam').focusout(function () {
			mcopy_ui.deleteRelease = false;
		});

		$('#serialNameProj').change(function () {
			arduino.serial.p = $(this).val();
		});

		$('#serialNameProj').focus(function () {
			mcopy_ui.deleteRelease = true;
		});
		$('#serialNameProj').focusout(function () {
			mcopy_ui.deleteRelease = false;
		});

		$('.labels').html('c<br />f<br />b<br />x<br/>d');

		for (var i = 0; i < 24; i++) {
			mcopy.sequence[i] = '';
			$('#p').hide();
			$('#c').append('<span></span>');
			$('#f').append('<span></span>');
			$('#b').append('<span></span>');
			$('#x').append('<span></span>');
			$('#d').append('<span></span>');
			$('#num').append('<span>' + i + '</span>');
			$('#result').append('<span></span>');
		}
		$('#ui div span').live('click', function () {
			var row = $(this).parent().attr('id'),
			col = $(this).index();
			mcopy_ui.set(row, col);
		});
		$('#isLoop').bind('click', function () {
			if ($(this).hasClass('on')) {
				mcopy.isLoop = false;
				$(this).text('Loop: off');
			} else {
				mcopy.isLoop = true;
				$(this).text('Loop: on');
			}
			$(this).toggleClass('on');
		});
		$('#loopTimes').bind('click', function (){
			mcopy.loopTimes = parseInt($('#loopTimesVal').val());
			mcopy.loopCount = 0;
			if ($(this).hasClass('on')) {
				mcopy.isLoop = false;
			} else {
				mcopy.isLoop = true;
			}
			$(this).toggleClass('on');
		});
		$('#run').bind('click', function () {
			$(this).addClass('on');
			mcopy.runSequence();
		});
		$('#clear').bind('click', function () {
			$('.row .on').each(function (){
				$(this).removeClass('on');
			});
			for (var i in mcopy.sequence) {
				mcopy.sequence[i] = '';
				$('#result span').eq(i).text('');
			}
			mcopy_ui.next = 0;
		});
		$('#more').bind('click',function () {
			mcopy_ui.more();
		});

		//KEYMAPPING
		$(document).keydown(function (e){
			//console.dir(e);
			var k = {};
			k.c = 67;
			k.f = 70;
			k.b = 66;
			k.x = 88;
			k.d = 100;
			k['delete'] = 46;
			k.back = 8;
			if (e.keyCode === k.c){
				mcopy_ui.set('c', mcopy_ui.next);
			} else if (e.keyCode === k.f) {
				mcopy_ui.set('f', mcopy_ui.next);
			} else if (e.keyCode === k.b) {
				mcopy_ui.set('b', mcopy_ui.next);
			} else if (e.keyCode === k.x) {
				mcopy_ui.set('x', mcopy_ui.next);
			} else if (e.keyCode === k.d) {
				mcopy_ui.set('d', mcopy_ui.next);
			} else if (e.keyCode === k['delete'] || e.keyCode === k.back) {
				if (!mcopy_ui.deleteRelease){
					var c = mcopy.sequence[mcopy_ui.next-1];
					if (c !== ''){
						mcopy_ui.set(c, mcopy_ui.next-1);
					}
					if(mcopy_ui.next-1 !== -1){
						mcopy_ui.next--;
					}
					return false;
				}
			}
		});

	},
	/* mcopy_ui._iPadinit
	*
	*/
	_iPadinit : function () {
		'use strict';
		mcopy_ui.clientType = 'iPad';
		$('body').attr('id', 'iPad');
		$('#more').text('+13');
		$('.labels').html('c<br />f<br />b<br />x');
		for (var i = 0; i < 13; i++) {
			mcopy.sequence[i] = '';
			$('#p').hide();
			$('#c').append('<span></span>');
			$('#f').append('<span></span>');
			$('#b').append('<span></span>');
			$('#x').append('<span></span>');
			$('#num').append('<span>' + i + '</span>');
			$('#result').append('<span></span>');
		}
		$('#ipadButtons').show();

		$('#ui div span').live('touchstart', function () {
			var row = $(this).parent().attr('id'),
			col = $(this).index();
			mcopy_ui.set(row, col);
		});
		$('#isLoop').bind('touchstart', function () {
			if ($(this).hasClass('on')) {
				mcopy.isLoop = false;
				$(this).text('Loop: off');
			} else {
				mcopy.isLoop = true;
				$(this).text('Loop: on');
			}
			$(this).toggleClass('on');
		});

		$('#run').bind('touchstart', function () {
			if (!$(this).hasClass('on')) {
				$(this).addClass('on');
				mcopy.runSequence();
			}
		});
		//touch end doesn't end class on in this case

		$('#clear').bind('touchstart', function () {
			$(this).addClass('on');
			$('.row .on').each(function (){
				$(this).removeClass('on');
			});
			for ( var i in mcopy.sequence) {
				mcopy.sequence[i] = '';
				$('#result span').eq(i).text('');
			}
			mcopy_ui.next = 0;
		});
		$('#clear').bind('touchend', function () {
			$(this).removeClass('on');
		});

		$('#more').bind('touchstart',function () {
			$(this).addClass('on');
			mcopy_ui.more(13);
		});
		$('#more').bind('touchend', function () {
			$(this).removeClass('on');
		});

		//ipad triggers
		$('#backward').bind('touchstart', function () {
			if ($('#ipadButtons').hasClass('locked')){
				console.log('locked!');
			}
			if (!$(this).hasClass('on')) {
				mcopy.write('b');
			}
		});
		$('#forward').bind('touchstart', function () {
			if ($('#ipadButtons').hasClass('locked')){
				console.log('locked!');
			}
			if (!$(this).hasClass('on')) {
				mcopy.write('f');
			}
		});
		$('#black').bind('touchstart', function () {
			if ($('#ipadButtons').hasClass('locked')){
				console.log('locked!');
			}
			if (!$(this).hasClass('on')) {
				mcopy.write('x');
			}
		});
		$('#camera').bind('touchstart', function () {
						if ($('#iPadButtons').hasClass('locked')){
				console.log('locked!');
			}
			if (!$(this).hasClass('on')) {
				mcopy.write('c');
			}
		});

	},
	/* mcopy_ui._iPhoneinit
	*
	*/
	_iPhoneinit : function () {
		'use strict';
		mcopy_ui.clientType = 'iPhone';
		$('body').attr('id', 'iPhone');
		//ipad triggers
		$('#backward').bind('touchstart', function () {
			if (!$(this).hasClass('on')) {
				mcopy.write('b');
				$(this).addClass('on');
			}
		});
		$('#forward').bind('touchstart', function () {
			if (!$(this).hasClass('on')) {
				mcopy.write('f');
				$(this).addClass('on');
			}
		});
		$('#black').bind('touchstart', function () {
			if (!$(this).hasClass('on')) {
				mcopy.write('x');
				$(this).addClass('on');
			}
		});
		$('#camera').bind('touchstart', function () {
			if (!$(this).hasClass('on')) {
				mcopy.write('c');
				$(this).addClass('on');
			}
		});
	},
	/* mcopy_ui.set
	*
	* @param	row 	char
	* @param	col 	char
	* @param	a
	*/

	set : function (row, col) {
		'use strict';
		if (col+1 > $('#num span').size()){
			mcopy_ui.more(1);
		}
		var all = $('#ui').find('.row');
			for (var i = 0; i < all.size(); i++) {
				var thisRow = all.eq(i).attr('id');
				if (thisRow != row) {
					if ($('#' + thisRow + ' span').eq(col).hasClass('on')) {
						$('#' + thisRow + ' span').eq(col).toggleClass('on');
					}
				}
			}
			if ($('#' + row + ' span').eq(col).hasClass('on')) {
				mcopy.sequence[col] = '';
			}else{
				mcopy.sequence[col] = row;
			}
			if (col + 1 > mcopy_ui.next) {
				mcopy_ui.next = col + 1;
			}
			$('#' + row + ' span').eq(col).parent().parent().find('#result span').eq(col).text(mcopy.sequence[col]);
			$('#' + row + ' span').eq(col).toggleClass('on');
	},
	/* mcopy_ui.more
	*
	*/
	more : function (many) {
		'use strict';
		if(many===undefined||many===null){
			many = 24;
		}
		var state = $('.slider #num span').length ,
			w = $('.slider').width();
		$('.slider').width(w + (many * Math.round(960/24)));	
		for(var i = state; i < many+state; i++){
			$('#c').append('<span></span>');
			$('#f').append('<span></span>');
			$('#b').append('<span></span>');
			$('#x').append('<span></span>');
			$('#num').append('<span>' + i + '</span>');
			$('#result').append('<span></span>');
		}
	},
	/* mcopy_ui.response
	*
	* @param	data 	Array 	list of commands
	*/
	response : function (data){
		'use strict';
		$('#run').removeClass('on');
		var loggedd = '';
		if (arduinoNode.socketsOn) {
			for (var i in data) {
				if (data[i] !== ''){
					if (data[i] === 'f') {
						mcopy.projTotal++;
						loggedd += data[i] + ' > ';
					} else if (data[i] === 'b') {
						mcopy.projTotal--;
						loggedd += data[i] + ' > ';
					} else if (data[i] === 'c' || data[i] === 'x') {
						mcopy.camTotal++;
						loggedd += data[i] + ' > ';
					}
				}
			}
		} else {
			for (var i in data.val) {
				if (data.val[i] !== ''){
					if (data.val[i] === 'f') {
						mcopy.projTotal++;
						loggedd += data.val[i] + ' > ';
					} else if (data.val[i] === 'b') {
						mcopy.projTotal--;
						loggedd += data.val[i] + ' > ';
					} else if (data.val[i] === 'c' || data.val[i] === 'x') {
						mcopy.camTotal++;
						loggedd += data.val[i] + ' > ';
					}
				}
			}
		}

		loggedd = loggedd.substring(0, loggedd.length-3);

		console.log('{CAM: ' + mcopy.camTotal + ', PROJ: ' + mcopy.projTotal + '}');

		$('#stats .camera').text('CAM: ' + mcopy.camTotal);
		$('#stats .projector').text('PROJ: ' + mcopy.projTotal);

		if (data.success !== false){
			$('#log .container').append('<li><pre>' + loggedd + '</pre>');
		}
	},
	highlight : {
		last: '',
		/* mcopy_ui.highlight.
		*
		*/
		sent : function (obj){
			'use strict';
			if(mcopy_ui.clientType === 'default' || mcopy_ui.clientType === 'iPad') {
				obj.which = parseInt(obj.which);
				$('#num span').eq(obj.which).addClass('on');
				mcopy_ui.highlight.last = obj.sequence[obj.which];
			}
			if (mcopy_ui.clientType === 'iPhone' || mcopy_ui.clientType === 'iPad') {
				$('#ipadButtons').addClass('locked');
				var cmd = obj.sequence[obj.which];
				if (cmd === 'f') {
					$('#forward').addClass('on');
				} else if (cmd === 'b') {
					$('#backward').addClass('on');
				} else if (cmd === 'c') {
					$('#camera').addClass('on');
				} else if (cmd === 'x') {
					$('#black').addClass('on');
				}
			}
		},
		/* mcopy_ui.highlight.response
		*
		*/
		response : function (cmd) {
			'use strict';
			if(mcopy_ui.clientType === 'default' || mcopy_ui.clientType === 'iPad') {
				if (cmd === mcopy_ui.highlight.last) {
					$('#num').find('.on').removeClass('on');
				}
			}
			if (mcopy_ui.clientType === 'iPhone' || mcopy_ui.clientType === 'iPad') {
				if ($('#ipadButtons').hasClass('locked')) {
					$('#ipadButtons').removeClass('locked');
				}
				if (cmd === 'f') {
					$('#forward').removeClass('on');
				} else if (cmd === 'b') {
					$('#backward').removeClass('on');
				} else if (cmd === 'c') {
					$('#camera').removeClass('on');
				} else if (cmd === 'x') {
					$('#black').removeClass('on');
				}
			}
			
		}
	},
	deleteRelease: false
};

var jk = {};
//--------------------------------------------------------------
// jk Class
//-------------------------------------------------------------- 
jk.mem = [];
jk.PGM = function () {
	'use strict';
	if (this.mem.length === 0 || this.mem.length < 1) {
		this.mem.push('PGM MODE');
	}
};
jk.compile = {
	total : 0,
	sequence : function () {
		'use strict';
	}
};
jk.RUN = function () {
	'use strict';
	var prev = null,
		num = '';
	if (jk.mem[0] === 'PGM MODE' && jk.mem[jk.mem.length - 1] === 'PGM MODE') {
		for(var i = 1; i < jk.mem.length - 1; i++){
			//Builds sequence
			if (jk.mem[i] === 'ENTER') {

			} else if(jk.mem[i] === 'VERIFY') {

			} else if(jk.mem[i] === 'PROJ TOTAL') {

			} else if(jk.mem[i] === 'CAM TOTAL') {

			} else if(jk.mem[i] === 'PROJ PRESET') {

			} else if(jk.mem[i] === 'CAM PRESET') {

			} else if(jk.mem[i] === 'PROJ ALT COUNT'){

			} else if(jk.mem[i] === 'CAM ALT COUNT'){

			} else if(jk.mem[i] === 'CAM STEP COUNT'){

			} else if(jk.mem[i] === 'PROJ SKIP COUNT'){

			} else if(jk.mem[i] === 'EXP TIME'){

			} else if (typeof jk.mem[i] === "number") {
				if (typeof jk.mem[i-1] !== "number") {
					prev = jk.mem[i-1];
				}
				num += '' + jk.mem[i];
				if (typeof jk.mem[i + 1] !== "number" && jk.mem[i + 1] === 'ENTER') {
					//execute(prev, num)

				}
			}

			if (typeof jk.mem[i] !== "number") {
				prev = jk.mem[i];
			}
		}
	}
};
jk.CAM_INDIV = function () {
	'use strict';
};
jk.PROJ_INDIV = function () {
	'use strict';
};
jk.KEY = function (val) {
	'use strict';
};
jk.EXE = function (cmd, num) {
	'use strict';	
};

var defaultDelegate  = function (data) {
	'use strict';
	console.dir(data);
}

var iOS = {
	isiPad : navigator.userAgent.match(/iPad/i) !== null,
	isiPhone : navigator.userAgent.match(/iPhone/i) !== null,
	isiPod : navigator.userAgent.match(/iPod/i) !== null,
	isinApp : window.navigator.standalone,
	BlockMove: function (event) {
	// Tell Safari not to move the window.
		event.preventDefault();
	}
}

var socket = null;

$(document).ready(function () {
	arduino.finder(arduino.finderResponse);
	if (iOS.isiPad) {
		mcopy_ui._iPadinit();
		return false;
	} else if (iOS.isiPhone) {
		mcopy_ui._iPhoneinit();
		return false;
	}
	mcopy_ui._init();
});

//JSON2
var JSON;if(!JSON){JSON={}}(function(){'use strict';function f(n){return n<10?'0'+n:n}if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key)}if(typeof rep==='function'){value=rep.call(holder,key,value)}switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null'}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null'}v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v}if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v)}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v)}}}}v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v}}if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' '}}else if(typeof space==='string'){indent=space}rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify')}return str('',{'':value})}}if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j}throw new SyntaxError('JSON.parse')}}}());

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};