<?php
	$arduino = fopen("/dev/cu.usbmodem1a131", "w");
	fwrite($arduino, 'f');
	usleep(100000);
	fclose($arduino);
	//fclose($arduino);
	echo "arduino open";
?>