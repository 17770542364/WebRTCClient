'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnStart = document.querySelector('button#start');
var btnCall = document.querySelector('button#call');
var btnHangup = document.querySelector('button#hangup');

var offer = document.querySelector('textarea#offer');
var answer = document.querySelector('textarea#answer');

var localStream;
var pc1, pc2;

function getMediaStream(stream){
	localVideo.srcObject = stream;
	localStream = stream;
}

function handleError(err){
	console.error('Failed to get Media Stream!', err);
}

function start(){

	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
		console.error('the getUserMedia is not supported!');
		return;
	}else {
		var constraints = {
			video: true,
			audio: false
		}
		navigator.mediaDevices.getUserMedia(constraints).then(getMediaStream).catch(handleError);
	}
	
}

function getRemoteStream(e){
	remoteVideo.srcObject = e.streams[0];
}

function getOffer(desc){
	pc1.setLocalDescription(desc);
	offer.value = desc.sdp;

	// send desc to signal
	// receive desc from signal
	
	pc2.setRemoteDescription(desc);

	pc2.createAnswer()
		.then(getAnswer)
		.catch(handleAnswerError);
}

function getAnswer(desc){
	pc2.setLocalDescription(desc);
	answer.value = desc.sdp;
	// send desc to signal
	// receive desc from dignal
	
	pc1.setRemoteDescription(desc);
}

function handleOfferError(err){
	console.error('Failed to create offer:', err);
}

function handleAnswerError(err){
	console.error('Failed to create answer: ', err);
}

function call(){
	pc1 = new RTCPeerConnection();
	pc2 = new RTCPeerConnection();

	// 收到ice 的candidate列表后交给对方
	pc1.onicecandidate = (e) => {
		pc2.addIceCandidate(e.candidate);
	}
	pc2.onicecandidate = (e) => {
		pc1.addIceCandidate(e.candidate);
	}

	pc2.ontrack = getRemoteStream;

	// 将本地采集到的流添加到pc1
	localStream.getTracks().forEach((track)=>{
		pc1.addTrack(track, localStream);
	});
	
	// 进行媒体协商
	var offerOptions = {
		offerToRecieveAudio: 0,
		offerToRecieveVideo: 1
	}
	pc1.createOffer(offerOptions)
			.then(getOffer)
			.catch(handleOfferError);
}

function handup(){
	pc1.close();
	pc2.close();
	pc1 = null;
	pc2 = null;
}

btnStart.onclick = start;
btnCall.onclick = call;
btnHangup.onclick = hangup;
