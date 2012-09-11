<?php
//arduino finder
function arduinoFinder() {
	//LIBRARY of known arduinos
	$known = array(
		'/dev/tty.usbmodem1a161', 
		'/dev/tty.usbserial-A800f8dk', 
		'/dev/tty.usbserial-A900cebm', 
		'/dev/tty.usbmodem1a131',
		'/dev/tty.usbserial-a900f6de'
		);

	$result=shell_exec('ls /dev/tty.*');
	$str = trim($result, "\n");
	$arr = preg_split('/\s+/', $str); 
	$arduino = array();
	foreach ($arr as $a) {
		//echo($a . '<br />');
		if (in_array(strtolower($a), $known) || strpos($a, 'usbmodem') || strpos($a, 'usbserial')) {
			$a = substr($a, 8, strlen($a));
			$a = 'cu' . $a;
			array_push($arduino, stripslashes($a));
		}
	}
	echo json_encode($arduino);
}

arduinoFinder();
?>