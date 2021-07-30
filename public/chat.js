let socket = io.connect('https://www.videocall.niyonsaba.com');
let divVideoChatLobby = document.getElementById('video-chat-lobby');
let divVideoChat = document.getElementById('video-chat-room');
let joinButton = document.getElementById('join');
let userVideo = document.getElementById('user-video');
let peerVideo = document.getElementById('peer-video');
let roomInput = document.getElementById('roomName');
let bgimg = document.getElementById('sidebar');
let removing = document.getElementById('removing-left-margin');

let divGroupButton = document.getElementById('btn-group');
let muteButtonButton = document.getElementById('muteButton');
let hideCameraButton = document.getElementById('hideCamera');
let leaveRoomButton = document.getElementById('leaveRoom');

let muteFlag = false;
let hideCameraFlag = false;

let roomName;
let creator = false;
let rtcPeerConnection;
let userStream;

// Contains the stun server URL we will be using.
let iceServers = {
	iceServers: [
		{ urls: 'stun:stun.services.mozilla.com' },
		{ urls: 'stun:stun.l.google.com:19302' },
	],
};

joinButton.addEventListener('click', function () {
	if (roomInput.value == '') {
		alert('Please enter a room name');
	} else {
		roomName = roomInput.value;
		socket.emit('join', roomName);
	}
});

muteButtonButton.addEventListener('click', function () {
	muteFlag = !muteFlag;
	if (muteFlag) {
		userStream.getTracks()[0].enabled = false;
		muteButtonButton.innerHTML = `<i class="fa fa-microphone-slash fa-2x" aria-hidden="true" style="color:#DA3B35"></i>`;
	} else {
		userStream.getTracks()[0].enabled = true;
		muteButtonButton.innerHTML = `<i class="fa fa-microphone fa-2x" aria-hidden="true"></i>`;
	}
});

hideCameraButton.addEventListener('click', function () {
	hideCameraFlag = !hideCameraFlag;
	if (hideCameraFlag) {
		userStream.getTracks()[1].enabled = false;
		hideCameraButton.innerHTML = `<i class="fa fa-camera-retro fa-2x" aria-hidden="true" style="color:#DA3B35"></i>`;
	} else {
		userStream.getTracks()[1].enabled = true;
		hideCameraButton.innerHTML = `<i class="fa fa-video-camera fa-2x" aria-hidden="true"></i>`;
	}
});

// Triggered when a room is succesfully created.

socket.on('created', function () {
	creator = true;
	console.log('CREATED!!!!!!!!!');
	navigator.mediaDevices
		.getUserMedia({
			audio: true,
			video: { width: 500, height: 500 },
		})
		.then(function (stream) {
			/* use the stream */
			console.log('CREATED!!!!!!!!!STREAM');
			userStream = stream;
			divVideoChatLobby.style = 'display:none';
			bgimg.style = 'display:none';
			removing.style = 'margin-left:0%';
			divGroupButton.style = 'display:flex';
			divVideoChat.style = 'display:flex';
			document.body.style.background = '#202124';
			userVideo.srcObject = stream;
			userVideo.onloadedmetadata = function (e) {
				userVideo.play();
			};
		})
		.catch(function (err) {
			/* handle the error */
			alert("Couldn't Access User Media");
		});
});

// Triggered when a room is succesfully joined.

socket.on('joined', function () {
	creator = false;
	navigator.mediaDevices
		.getUserMedia({
			audio: true,
			video: { width: 500, height: 500 },
		})
		.then(function (stream) {
			/* use the stream */
			userStream = stream;
			divVideoChatLobby.style = 'display:none';
			bgimg.style = 'display:none';
			divGroupButton.style = 'display:flex';
			divVideoChat.style = 'display:flex';
			document.body.style.background = '#202124';
			userVideo.srcObject = stream;
			userVideo.onloadedmetadata = function (e) {
				userVideo.play();
			};
			socket.emit('ready', roomName);
		})
		.catch(function (err) {
			/* handle the error */
			alert("Couldn't Access User Media");
		});
});

// Triggered when a room is full (meaning has 2 people).

socket.on('full', function () {
	alert("Room is Full, Can't Join");
});

// Triggered when a peer has joined the room and ready to communicate.
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
socket.on('ready', function () {
	if (creator) {
		rtcPeerConnection = new RTCPeerConnection(iceServers);
		rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
		rtcPeerConnection.ontrack = OnTrackFunction;
		rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
		rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
		rtcPeerConnection
			.createOffer()
			.then(offer => {
				rtcPeerConnection.setLocalDescription(offer);
				socket.emit('offer', offer, roomName);
			})

			.catch(error => {
				console.log(error);
			});
	}
});

// Triggered on receiving an ice candidate from the peer.

socket.on('candidate', function (candidate) {
	let icecandidate = new RTCIceCandidate(candidate);
	rtcPeerConnection.addIceCandidate(icecandidate);
});

// Triggered on receiving an offer from the person who created the room.

socket.on('offer', function (offer) {
	if (!creator) {
		rtcPeerConnection = new RTCPeerConnection(iceServers);
		rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
		rtcPeerConnection.ontrack = OnTrackFunction;
		rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
		rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
		rtcPeerConnection.setRemoteDescription(offer);
		rtcPeerConnection
			.createAnswer()
			.then(answer => {
				rtcPeerConnection.setLocalDescription(answer);
				socket.emit('answer', answer, roomName);
			})
			.catch(error => {
				console.log(error);
			});
	}
});

// Triggered on receiving an answer from the person who joined the room.

socket.on('answer', function (answer) {
	rtcPeerConnection.setRemoteDescription(answer);
});

// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.

function OnIceCandidateFunction(event) {
	console.log('Candidate');
	if (event.candidate) {
		socket.emit('candidate', event.candidate, roomName);
	}
}

// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.

function OnTrackFunction(event) {
	peerVideo.srcObject = event.streams[0];
	peerVideo.onloadedmetadata = function (e) {
		peerVideo.play();
	};
}

leaveRoomButton.addEventListener('click', function () {
	socket.emit('leave', roomName);
	document.body.style.background = '#FFFFFF';
	removing.style = 'margin-left:40%';
	bgimg.style = 'display:flex';
	bgimg.style = 'width: 40%';
	divVideoChatLobby.style = 'display:block';
	divVideoChat.style = 'display:none';
	divGroupButton.style = 'display:none';
	if (userStream.srcObject) {
		userStream.srcObject.getTracks()[0].stop();
		userStream.srcObject.getTracks()[1].stop();

		// userStream.srcObject.getTracks().forEach((track) => track.stop()); // similar to the top one
	}
	if (peerVideo.srcObject) {
		peerVideo.srcObject.getTracks()[0].stop();
		peerVideo.srcObject.getTracks()[1].stop();
	}

	if (rtcPeerConnection) {
		rtcPeerConnection.ontrack = null;
		rtcPeerConnection.onicecandidate = null;
		rtcPeerConnection.close();
		rtcPeerConnection = null;
	}
	location.reload();
});

socket.on('leave', function () {
	if (rtcPeerConnection) {
		rtcPeerConnection.ontrack = null;
		rtcPeerConnection.onicecandidate = null;
		rtcPeerConnection.close();
		rtcPeerConnection = null;
	}

	if (peerVideo.srcObject) {
		peerVideo.srcObject.getTracks()[0].stop();
		peerVideo.srcObject.getTracks()[1].stop();
	}
});
