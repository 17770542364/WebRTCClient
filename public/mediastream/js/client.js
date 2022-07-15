'use strict'

var videoplay = document.querySelector('video#player');
// var audioplay = document.querySelector('audio#audioplayer');
var audioInput = document.querySelector('select#audioInput');
var audioOutput = document.querySelector('select#audioOutput');
var videoInput = document.querySelector('select#videoInput');
var filtersSelect = document.querySelector('select#filter');

var snapshot = document.querySelector('button#snapshot');
var picture = document.querySelector('canvas#picture');
picture.width = 320;
picture.height = 240;

var divConstraints = document.querySelector('div#constraints');

// record
var recvideo = document.querySelector('video#recplayer');
var btnRecord = document.querySelector('button#record');
var btnPlay = document.querySelector('button#recplay');
var btnDownload = document.querySelector('button#download');

var buffer;
var mediaRecorder;


function gotMediaStream(stream){
	videoplay.srcObject = stream;
	window.stream = stream;
	
	var videoTrack = stream.getVideoTracks()[0];
	var videoConstraints = videoTrack.getSettings();
	divConstraints.textContent = JSON.stringify(videoConstraints, null, 2);

	// audioplay.srcObject = stream;
	return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos){
	deviceInfos.forEach(function(deviceinfo){
		var option = document.createElement('option');
		option.text = deviceinfo.label;
		option.value = deviceinfo.deviceId;

		if (deviceinfo.kind === 'audioinput'){
			audioInput.appendChild(option);	
		}else if (deviceinfo.kind === 'audiooutput'){
			audioOutput.appendChild(option);	
		}else if (deviceinfo.kind === 'videoinput'){
			videoInput.appendChild(option);	
		}
	})
}

function handleError(err){
	console.log('getUserMedia error:', err);
}

function start(){
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
		console.log('getUserMedia is not supported!');
		return;
	}else{
		var deviceId = videoInput.value;
		var constraints = {
			
			video : {
				width: 640,
				height: 480,
				deviceId: deviceId ? deviceId : undefined
			},
			audio : {
				noiseSuppression: true,
				echoCancellation: true
			},
		}

		// navigator.mediaDevices.getDisplayMedia(constraints)
		navigator.mediaDevices.getUserMedia(constraints)
					.then(gotMediaStream)
					.then(gotDevices)
					.catch(handleError);
	}
}

start();

videoInput.onchange = start;

filtersSelect.onchange = function(){
	videoplay.className = filtersSelect.value;
}

snapshot.onclick = function() {
	picture.className = filtersSelect.value;
	picture.getContext('2d').drawImage(videoplay, 0, 0, picture.width, picture.height);

}

function handleDataAvailable(e){
	if (e && e.data && e.data.size>0)
	{
		buffer.push(e.data);
	}
}

function startRecord(){
	buffer = [];
	var options = {
		mimeType: 'video/webm;codecs=vp8'
	}
	
	if (!MediaRecorder.isTypeSupported(options.mimeType)){
		console.error('${options.mimeType} is not supported');
		return;
	}

	try {
		mediaRecorder = new MediaRecorder(window.stream, options);
	} catch(e){
		console.error('Failed to create MediaRecorder:', e);
		return;
	}

	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.start(10);

}

function stopRecord(){
	mediaRecorder.stop();
}

btnRecord.onclick = ()=>{
	if (btnRecord.textContent === 'Start Record'){
		startRecord();
		btnRecord.textContent = 'Stop Record';
		btnPlay.disabled = true;
		btnDownload.disabled = true;
	} else {
		stopRecord();
		btnRecord.textContent = 'Start Record';
		btnPlay.disabled = false;
		btnDownload.disabled = false;
	}
}

btnPlay.onclick = ()=> {
	var blob = new Blob(buffer, {type: 'video/webm'});
	recvideo.src = window.URL.createObjectURL(blob);
	recvideo.srcObject = null;
	recvideo.controls = true;
	recvideo.play();
}

btnDownload.onclick = ()=> {
	var blob = new Blob(buffer, {type: 'video/webm'});
	var url = window.URL.createObjectURL(blob);
	var a = document.createElement('a');

	a.href = url;
	a.style.display = 'none';
	a.download = 'aaa.webm';
	a.click();
}
