const socket = io("https://2409:408c:1d1f:2bcb::bb09:fd00
192.0.0.4:3000");
let peerConnection;
const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const startChatBtn = document.getElementById("startChat");

startChatBtn.addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    myVideo.srcObject = stream;

    socket.on("partnerFound", (partnerId) => {
        peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        peerConnection.ontrack = (event) => {
            partnerVideo.srcObject = event.streams[0];
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("signal", { to: partnerId, signal: event.candidate });
            }
        };

        if (partnerId > socket.id) {
            peerConnection.createOffer().then((offer) => {
                peerConnection.setLocalDescription(offer);
                socket.emit("signal", { to: partnerId, signal: offer });
            });
        }
    });

    socket.on("signal", (data) => {
        if (data.signal.type === "offer") {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
            peerConnection.createAnswer().then((answer) => {
                peerConnection.setLocalDescription(answer);
                socket.emit("signal", { to: data.from, signal: answer });
            });
        } else {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
        }
    });
});
