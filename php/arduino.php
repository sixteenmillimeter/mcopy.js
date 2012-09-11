<?php 
	//Arduino 2
	//configuration header
	ini_set('max_execution_time', 86400);

	$rawPost = file_get_contents('php://input');
	$postObj = json_decode($rawPost,true);
	$total = count($postObj['val']);
	$timing = $postObj['timing'];
	$time = 0;
	$mcopyMode = false;
	$response = new response();

	if ($postObj != undefined && $postObj != null && $total != 0) {
		$fpc = fopen("/dev/".$postObj['serial']['c'], "w");
		if($postObj['serial']['c'] != $postObj['serial']['p']){
			$fpp = fopen("/dev/".$postObj['serial']['p'], "w");
			$mcopyMode = true;
			usleep(2100000);	//Pause in to allow for multiple arduino reset
			$time += 2100;
		} else {
			usleep(1100000);	//Pause in to allow for arduino reset
			$time += 1100;
		}
		//perform actions
		for ($i = 0; $i < $total; $i++){
			if ($postObj['val'][$i] != "" && $postObj['val'][$i] != null) {
				$cmd = $postObj['val'][$i];
				if ($mcopyMode) {
					if ($cmd == 'f' || $cmd == 'b') {
						fwrite($fpp, $cmd);
					} else if ($cmd == 'c') {
						fwrite($fpc, '3');
					} else if ($cmd == 'x'){
						fwrite($fpp, $cmd);
						usleep(400000);
						fwrite($fpc, '3');
					}
				} else {
					fwrite($fpc, $cmd);
				}
				usleep($timing[$cmd] * 1000);
				$time += $timing[$cmd];
			}
		}
		$response->val = $postObj['val'];
		$response->time = $time;
		$response->success = 'true';
		if ($mcopyMode) {
			fclose($fpc);
			fclose($fpp);
		} else {
			fclose($fpc);
		}
	} else if ($total == 0) {
		$response->error = 'No commands submitted';
	}
	/*
	$myFile = "sessionLog.txt";
	$fh = fopen($myFile, 'w') or die("can't open file");
	$data = fread($fh);
	echo $data;
	fclose($fh);
	*/
	$printOut = json_encode($response);
	echo $printOut;
?>	

<?php 

//RESPONSE CLASS
class response {
	public $val = array();
	public $success = 'false';
	public $error = null;
	public $time = 0;
}

/*
Copyleft 2012 Matthew McWilliams matt@sixteenmillimeter.com

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