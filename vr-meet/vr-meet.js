
const signalingServerUrl = 'ws://localhost:8080';
let ws, pc, localStream;
let isUsingCamera = false, isMicEnabled = true;

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// 获取页面元素
const meetingOptions = document.getElementById('meetingOptions');
const joinOptions = document.getElementById('joinOptions');
const meetingRoom = document.getElementById('meetingRoom');

const joinMeeting = document.getElementById('joinMeeting');
const startMeeting = document.getElementById('startMeeting');
const enableMic = document.getElementById('enableMic');
const videoOptions = document.getElementsByName('videoOption');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const exitCall = document.getElementById('exitCall');
const toggleMedia = document.getElementById('toggleMedia');
const toggleMic = document.getElementById('toggleMic');
// 为按钮添加点击事件
joinMeeting.addEventListener('click', () => {
    meetingOptions.classList.add('hidden');
    joinOptions.classList.remove('hidden');
});

startMeeting.addEventListener('click', () => {
    const selectedVideo = [...videoOptions].find(option => option.checked).value;
    startConference(enableMic.checked, selectedVideo);
});

exitCall.addEventListener('click', exitMeeting);
toggleMedia.addEventListener('click', toggleMediaStream);
toggleMic.addEventListener('click', toggleMicrophone);
//开始会议
async function startConference(enableAudio, videoType) {
    joinOptions.classList.add('hidden');
    meetingRoom.classList.remove('hidden');

    connectSignaling();
    pc = new RTCPeerConnection(configuration);

    localStream = await getMediaStream(enableAudio, videoType);
    if (!localStream) return;

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    localVideo.srcObject = localStream;

    pc.onicecandidate = (e) => {
        if (e.candidate) {
            ws.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate }));
        }
    };

    pc.ontrack = (e) => {
        console.log('🔹 Received remote track:', e.streams[0]);
        remoteVideo.srcObject = e.streams[0];
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', sdp: offer }));
}

async function getMediaStream(enableAudio, videoType) {
    try {
        let stream;
        if (videoType === "camera") {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: enableAudio });
        } else if (videoType === "screen") {
            stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: enableAudio });
        } else {
            stream = enableAudio ? await navigator.mediaDevices.getUserMedia({ audio: true }) : null;
        }
        return stream;
    } catch (err) {
        console.error('❌ Failed to get media stream:', err);
        return null;
    }
}

function connectSignaling() {
    ws = new WebSocket(signalingServerUrl);
    
    ws.onmessage = async (message) => {
        try {
            if (message.data instanceof Blob) {
                message.data.text().then(text => handleMessage(JSON.parse(text)));
            } else {
                handleMessage(JSON.parse(message.data));
            }
        } catch (err) {
            console.error('❌ WebSocket 解析错误:', err, message.data);
        }
    };
}

function handleMessage(data) {
    console.log('📩 WebSocket 收到消息:', data);

    if (data.type === 'offer') {
        if (!pc) startConference(false, 'none');
        pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
            .then(async () => {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
            });
    } else if (data.type === 'answer') {
        pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === 'ice-candidate' && data.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } else if (data.type === 'leave') {
        console.log('🔹 Remote user left');
        remoteVideo.srcObject = null;
    }
}

function exitMeeting() {
    if (ws) ws.send(JSON.stringify({ type: 'leave' }));

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    localVideo.srcObject = null;
    remoteVideo.srcObject = null;

    if (pc) {
        pc.close();
        pc = null;
    }

    if (ws) {
        ws.close();
        ws = null;
    }

    meetingRoom.classList.add('hidden');
    meetingOptions.classList.remove('hidden');
}
//切换媒体流
async function toggleMediaStream() {
    if (!pc) return;
    
    const newStream = await getMediaStream(enableMic.checked, isUsingCamera ? 'screen' : 'camera');
    if (!newStream) return;

    const videoTrack = newStream.getVideoTracks()[0];
    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
    sender?.replaceTrack(videoTrack);

    localStream?.getTracks().forEach(track => track.stop());
    localStream = newStream;
    localVideo.srcObject = newStream;

    isUsingCamera = !isUsingCamera;
}
//切换麦克风
function toggleMicrophone() {
    const tracks = localStream?.getTracks().filter(track => track.kind === 'audio');
    if (tracks?.length) {
        const audioTrack = tracks[0];
        audioTrack.enabled = !audioTrack.enabled;
        isMicEnabled = audioTrack.enabled;
        toggleMic.innerText = isMicEnabled ? '🔇 关闭麦克风' : '🔊 开启麦克风';
    }
}
