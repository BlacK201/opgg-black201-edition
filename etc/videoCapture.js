const { desktopCapturer } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

let recorder;
let blobs = [];
let isRecording = false;

if (isDev()) {
    ipcRenderer.on('record-video', (event, arg) => {
        console.log(isRecording);
        if (isRecording) {
            isRecording = false;
            stopRecording();
        } else {
            isRecording = true;
            recordVideo();
        }
    });

    $(document).ready(() => {
        $("#sb-setting").on("click", () => {
            if (isRecording) {
                isRecording = false;
                stopRecording();
            } else {
                isRecording = true;
                recordVideo();
            }
        });
    });
}

window.recordVideo = () => {
    desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        console.log(sources);
        for (const source of sources) {
            if (source.name === "League of Legends (TM) Client" || source.name === "Screen 1") {
                try {
                    let stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            mandatory: {
                              chromeMediaSource: 'desktop'
                            }
                        },
                        video: {
                            cursor: "always",
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: source.id,
                                minWidth: 1280,
                                maxWidth: 1920,
                                minHeight: 720,
                                maxHeight: 1080,
                            }
                        }
                    });
                    // 마이크 input - 나중에 옵션으로 추가
                    // let audio = await navigator.mediaDevices.getUserMedia({
                    //     audio: true
                    // });
                    // let audioTrack = audio.getAudioTracks()[0];
                    // stream.addTrack(audioTrack);        
                    handleStream(stream);
                } catch (e) {
                    handleError(e);
                }
                return;
            }
        }
    });
};

function handleStream(stream) {
    recorder = new MediaRecorder(stream);
    blobs = [];
    recorder.ondataavailable = function(event) {
        blobs.push(event.data);
    };
    recorder.start();
}

window.stopRecording = () => {
    let saveVideo = () => {
        toArrayBuffer(new Blob(blobs, {type: 'video/mp4'}), function (ab) {
            let buffer = toBuffer(ab);
            const file = path.join(remote.app.getPath("userData")+"/videos", `${Date.now()}.mp4`);
            fs.writeFile(file, buffer, function (err) {
                console.log("saved");
                if (err) {
                    console.error('Failed to save video ' + err);
                } else {
                    console.log('Saved video: ' + file);
                    // shell.openExternal(`file://${file}`);
                    recorder = null;
                    blobs = null;
                }
            });
        });
    };
    recorder.onstop = saveVideo;
    recorder.stop();
    console.log("stopped");
}

function toArrayBuffer(blob, cb) {
    let fileReader = new FileReader();
    fileReader.onload = function() {
        let arrayBuffer = this.result;
        cb(arrayBuffer);
    };
    fileReader.readAsArrayBuffer(blob);
}

function toBuffer(ab) {
    let buffer = new Buffer(ab.byteLength);
    let arr = new Uint8Array(ab);
    for (let i = 0; i < arr.byteLength; i++) {
        buffer[i] = arr[i];
    }
    return buffer;
}

function handleError (e) {
    console.log(e);
}
