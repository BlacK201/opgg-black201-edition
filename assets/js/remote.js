let currentSummoner = window.api.invoke("current-summoner").then((summoner) => {
    if (summoner) {
        setSummonerInfo(summoner);
    }
});

const setSummonerInfo = (summoner) => {
    if (summoner) {
        document.querySelector(".info-summoner-name").innerHTML = summoner.displayName;

        if (summoner.profileIconId) {
            document.querySelector(".info-profile-image").src = `https://opgg-static.akamaized.net/images/profile_icons/profileIcon${summoner.profileIconId}.jpg?image=q_auto:best&v=1518361200`;
        }
    }
}

window.api.on("logged-in", (event, data) => {
    setSummonerInfo(data);
});

window.api.on("menu", (event, data) => {
    setActive(`#menu${data}`);
});

const setActive = (t) => {
    document.querySelector("#menu1").classList.remove("remote-menu-active");
    document.querySelector("#menu2").classList.remove("remote-menu-active");
    document.querySelector("#menu3").classList.remove("remote-menu-active");
    document.querySelector(t).classList.add("remote-menu-active");
}

document.querySelector("#menu1").addEventListener("click", function() {
    setActive("#menu1");
    window.api.send("mini-menu-clicked", "menu1");
});

document.querySelector("#menu2").addEventListener("click", function() {
    setActive("#menu2");
    window.api.send("mini-menu-clicked", "menu2");
});

document.querySelector("#menu3").addEventListener("click", function() {
    setActive("#menu3");
    window.api.send("mini-menu-clicked", "menu3");
});