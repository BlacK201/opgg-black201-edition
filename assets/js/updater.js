window.api.on("progress", function(event, data) {
    $(".progress-inner").css("width", `${data}%`);
});

let url = "https://opgg-desktop-patch.akamaized.net/latest.yml";
if (window.api.platform() === "darwin") {
    url = "https://opgg-desktop-patch.akamaized.net/latest-mac.yml";
}

$.ajax({
    url: url,
    method: "GET",
    success: (res) => {
        let version = res.split("version: ")[1].split("\n")[0];

        let downloadUrl1 = `https://opgg-desktop-patch.akamaized.net/OP.GG+Setup+${version}.exe`;
        let downloadUrl2 = `https://desktop-patch.op.gg/OP.GG+Setup+${version}.exe`;

        if (window.api.platform() === "darwin") {
            downloadUrl1 = `https://opgg-desktop-patch.akamaized.net/OP.GG-${version}.dmg`;
            downloadUrl2 = `https://desktop-patch.op.gg/OP.GG-${version}.dmg`;
        }

        $(".download1").on("click", () => {
            window.api.send("openLink", downloadUrl1);
        });

        $(".download2").on("click", () => {
            window.api.send("openLink", downloadUrl2);
        });
    }
});
