var arduino = {
	serial : {
		'c' : 'cu.usbserial-A800f8dk',
		'p' : 'cu.usbserial-A900cebm'
	},
	cmd : ['f', 'b', 'c', 'x', 'p'],
	timing : {
		'f' : 1000,
		'b' : 2000,
		'c' : 1000,
		'x' : 2000,
		'p' : 1000
	},
	post : function(arr, delegate){
		'use strict';
		var arrOut = [];
		for (var i in arr) {
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
			url : 'arduino.php',
			type : 'POST',
			data: dataString,
			dataType:'json',
			success : delegate
		});
     }
}

var mcopy = {
	//Set the sequence, then run.
	sequence : [],
	camTotal : 0,
	projTotal : 0,
	run : function () {
		'use strict';
		arduino.post(this.sequence, this.response);

	},
	isLoop : false,
	response : function (data) {
		'use strict';
		console.dir(data);
		if(data.success){
			if (mcopy.isLoop) {
				var delay = 0;
				for(var i in data.val){
					delay += arduino.timing[data.val[i]];
				}
				delay + 300;
				setTimeout('mcopy.run()',delay);
				//this.run();
			}
			//ui.response(data);
			mcopy_ui.response(data);
		}
	}
};

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
			mcopy.run();
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
		loggedd = loggedd.substring(0, loggedd.length-3)
		//$('').text(mcopy.camTotal);
		//$('').text(mcopy.camTotal);
		if (data.success !== false){
			$('#log .container').append('<li><pre>' + loggedd + '</pre>');
		}
	},
	more : function (many) {
		'use strict';
		if(many===undefined||many===null){

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
} //

var mcopy_ui = {
	projector : 0,
	camera:0,
	next : 0,
	_init : function () {
		'use strict';
		$('#serialNameCam').val(arduino.serial.c);
		$('#serialNameProj').val(arduino.serial.p);
		$('#serialNameCam').change(function () {
			arduino.serial.c = $(this).val();
		});
		$('#serialNameCam').focus(function () {
			//console.log('on');
			mcopy_ui.deleteRelease = true;
		});
		$('#serialNameCam').focusout(function () {
			//console.log('off');
			mcopy_ui.deleteRelease = false;
		});
		$('#serialNameProj').change(function () {
			arduino.serial.p = $(this).val();
		});
		$('#serialNameProj').focus(function () {
			//console.log('on');
			mcopy_ui.deleteRelease = true;
		});
		$('#serialNameProj').focusout(function () {
			//console.log('off');
			mcopy_ui.deleteRelease = false;
		});

		$('.labels').html('c<br />f<br />b<br />x');

		for (var i = 0; i < 24; i++) {
			mcopy.sequence[i] = '';
			$('#p').hide();
			$('#c').append('<span></span>');
			$('#f').append('<span></span>');
			$('#b').append('<span></span>');
			$('#x').append('<span></span>');
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
		$('#run').bind('click', function () {
			$(this).addClass('on');
			mcopy.run();
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
	_iPadinit : function () {
		'use strict';
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
			$(this).addClass('on');
			mcopy.run();
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
		$('#more').bind('touchend',function () {
			$(this).removeClass('on');
		});

		//ipad triggers
		$('#backward').bind('touchstart', function () {
			$(this).addClass('on');
			arduino.post(['b'], mcopy.response);
			setTimeout(function () {
				$('#backward').removeClass('on')
			}, arduino.timing['b']);
		});
		$('#forward').bind('touchstart', function () {
			$(this).addClass('on');
			arduino.post(['f'], mcopy.response);
			setTimeout(function () {
				$('#forward').removeClass('on')
			}, arduino.timing['f']);
		});
		$('#black').bind('touchstart', function () {
			$(this).addClass('on');
			arduino.post(['x'], mcopy.response);
			setTimeout(function () {
				$('#black').removeClass('on')
			}, arduino.timing['x']);
		});
		$('#camera').bind('touchstart', function () {
			$(this).addClass('on');
			arduino.post(['c'], mcopy.response);
			setTimeout(function () {
				$('#camera').removeClass('on')
			}, arduino.timing['c']);
		});

	},
	//@param: row - char
	//@param: col - char
	//@param: alll
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
	response : function (data){
		'use strict';
		$('#run').removeClass('on');
		var loggedd = '';
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
		loggedd = loggedd.substring(0, loggedd.length-3)
		//$('').text(mcopy.camTotal);
		//$('').text(mcopy.camTotal);
		if (data.success !== false){
			$('#log .container').append('<li><pre>' + loggedd + '</pre>');
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
	},
	deleteRelease: false


};

var jk = {
	mem : [],
	PGM : function () {
		'use strict';
		if (this.mem.length === 0 || this.mem.length < 2) {
			this.mem.push('PGM MODE');
		}
	},
	compile : {
		total : 0,
		sequence : function () {
			'use strict';
		}
	},
	RUN : function () {
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
	},
	CAM_INDIV : function () {
		'use strict';
	},
	PROJ_INDIV : function () {
		'use strict';
	},
	KEY : function (val) {
		'use strict';
	},
	EXE : function (cmd, num) {
		'use strict';	
	}
}

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

/*

*/

$(document).ready(function () {
	//ui._init();
	if (iOS.isiPad) {
		mcopy_ui._iPadinit();
		return false;
	} else if (iOS.isiPad) {

	}
	mcopy_ui._init();
});

var JSON;if(!JSON){JSON={}}(function(){'use strict';function f(n){return n<10?'0'+n:n}if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key)}if(typeof rep==='function'){value=rep.call(holder,key,value)}switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null'}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null'}v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v}if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v)}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v)}}}}v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v}}if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' '}}else if(typeof space==='string'){indent=space}rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify')}return str('',{'':value})}}if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j}throw new SyntaxError('JSON.parse')}}}());

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};