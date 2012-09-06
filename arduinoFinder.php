<?php
//arduino finder
function arduinoFinder() {
		//LIBRARY of known arduinos
		$known = array('usbmodem1a161', 'usbserial-A800f8dk', 'usbserial-A900cebm', 'usbmodem1a131');



		$result=shell_exec('ls /dev/tty.*');
		$str = trim($result, "\n");
		$arr = preg_split('/\s+/', $str); 
		$arduino = '';
		foreach ($arr as $a) {
			echo($a . '<br />');
			if ($a) {

			}
		}
		return $arduino;
	}
arduinoFinder();
?>