const { desktopCapturer, shell } = require('electron');
const { ipcRenderer } = require('electron')

const fs = require('fs');
const os = require('os');
const path = require('path');

const screenshot = $('#screenshot');

ipcRenderer.on('take-screenshot', (event, arg) => {
    fullscreenScreenshot(function(base64data){},'image/png');
});

function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(',');
    let mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);

    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }

    return u8arr;
}

screenshot.on("click", function () {
    fullscreenScreenshot(function(base64data){},'image/png');
});

function fullscreenScreenshot(callback, imageFormat) {
    var _this = this;
    this.callback = callback;
    imageFormat = imageFormat || 'image/jpeg';

    this.handleStream = (stream) => {
        var video = document.createElement('video');
        video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

        // Event connected to stream
        video.onloadedmetadata = function () {
            // Set video ORIGINAL height (screenshot)
            video.style.height = this.videoHeight + 'px'; // videoHeight
            video.style.width = this.videoWidth + 'px'; // videoWidth

            video.play();

            // Create canvas
            var canvas = document.createElement('canvas');
            canvas.width = this.videoWidth;
            canvas.height = this.videoHeight;
            var ctx = canvas.getContext('2d');
            // Draw video on canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (_this.callback) {
                // Save screenshot to base64
                let file = dataURLtoFile(canvas.toDataURL(imageFormat), "screenshot.png");
                const screenshotPath = path.join(os.tmpdir(), 'screenshot.png');
                fs.writeFile(screenshotPath, file, (error) => {
                    if (error) return console.log(error);
                    shell.openExternal(`file://${screenshotPath}`);
                });

                // _this.callback(canvas.toDataURL(imageFormat));
            } else {
                console.log('Need callback!');
            }

            // Remove hidden video tag
            video.remove();
            try {
                // Destroy connect to stream
                stream.getTracks()[0].stop();
            } catch (e) {}
        }

        video.srcObject = stream;
        // document.body.appendChild(video);
    };

    this.handleError = function(e) {
        console.log(e);
    };

    desktopCapturer.getSources({ types: ['window', 'screen', 'fullscreen'] }).then(async sources => {
        console.log(sources);
        for (const source of sources) {
            if ((source.name === "Entire Screen") || (source.name === "League of Legends (TM) Client") || (source.name === "Screen 2")) {
                try{
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: source.id,
                                minWidth: 1280,
                                maxWidth: 4000,
                                minHeight: 720,
                                maxHeight: 4000
                            }
                        }
                    });

                    _this.handleStream(stream);
                } catch (e) {
                    _this.handleError(e);
                }
            }
        }
    });
}