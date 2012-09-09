<?php
//arduino finder
function arduinoFinder() {
	//LIBRARY of known arduinos
	$known = array('usbmodem1a161', 'usbserial-A800f8dk', 'usbserial-A900cebm', 'usbmodem1a131');

	$result=shell_exec('ls /dev/tty.*');
	$str = trim($result, "\n");
	$arr = preg_split('/\s+/', $str); 
	$arduino = array();
	foreach ($arr as $a) {
		//echo($a . '<br />');
		if (in_array($a, $known) || strpos($a, 'usbmodem') || strpos($a, 'usbserial')) {
			array_push($arduino, $a);
		}
	}
	echo json_encode($arduino);
}

arduinoFinder();
?>