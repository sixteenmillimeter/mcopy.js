<?php
	// Nonzero number to be sent to Arduino

	$sentObj = file_get_contents('php://input');
	$newObj = json_decode($sentObj,true);

	$mcopyMode = false;

	exec("mode com1: BAUD=9600 PARITY=N data=8 stop=1 xon=off");
	$fpc = fopen("/dev/".$newObj['serial']['c'], "w");
	if($newObj['serial']['c'] != $newObj['serial']['p']){
		$fpp = fopen("/dev/".$newObj['serial']['p'], "w");
		$mcopyMode = true;
	}
	usleep(1100000);

	$total = count($newObj['val']);
	$timing = $newObj['timing'];
	$time = 0;
	$success = 'true';

	$jsonOut = '';
	$jsonOut .= '{"val":';
	$jsonOut .= '[';
	for ($i = 0; $i < $total; $i++){
		if ($newObj['val'][$i] != "") {
			$cmd = $newObj['val'][$i];

			if ($mcopyMode) {
				if ($cmd == 'f' ||$cmd == 'b') {
					fwrite($fpp, $cmd);
				} else if ($cmd == 'c') {
					fwrite($fpc, '3');
				} else if ($cmd == 'x'){
					fwrite($fpp, $cmd);
					usleep(300000);
					fwrite($fpc, '3');
				}
			} else {
				fwrite($fpc, $cmd);
			}
			
			usleep($timing[$cmd] * 1000);

			$time += $timing[$cmd];
			$jsonOut .= '"';
			$jsonOut .= $cmd;
			$jsonOut .= '"';
			if ($i != $total-1 && $newObj['val'][$i+1] != "") {
				$jsonOut .= ',';
			}
		}
	}
	$jsonOut .= '],';

	if ($mcopyMode) {
		fclose($fpc);
		fclose($fpp);
	} else {
		fclose($fpc);
	}
	
	usleep(300000);
	
	if($total < 1){
		$success = 'false';
	}
	$jsonOut .= '"success":' . $success . ',';
	$jsonOut .='"time":' . $time;
	$jsonOut .= '}';

	echo $jsonOut;


/*

Copyright (c) 2012 Matthew McWilliams matt@sixteenmillimeter.com

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/
?>