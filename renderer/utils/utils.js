function timeForToday(value) {
    const i18n = localStorage.getItem("i18n");
    const today = new Date();
    const timeValue = new Date(value);

    let l1 = "방금전";
    let l2 = "분 전";
    let l3 = "시간 전";
    let l4 = "일 전";
    let l5 = "년 전";

    if (i18n !== "kr") {
        l1 = "Few seconds ago";
        l2 = " minutes ago";
        l3 = " hours ago";
        l4 = " days ago";
        l5 = " years ago";
    }

    const betweenTime = Math.floor((today.getTime() - timeValue.getTime()) / 1000 / 60);
    if (betweenTime < 1) return l1;
    if (betweenTime < 60) {
        return `${betweenTime}${l2}`;
    }

    const betweenTimeHour = Math.floor(betweenTime / 60);
    if (betweenTimeHour < 24) {
        return `${betweenTimeHour}${l3}`;
    }

    const betweenTimeDay = Math.floor(betweenTime / 60 / 24);
    if (betweenTimeDay < 365) {
        return `${betweenTimeDay}${l4}`;
    }

    return `${Math.floor(betweenTimeDay / 365)}${l5}`;
}

function aprilFoolsDay(year) {
    let today = new Date();
    let start = new Date(year, 3, 1, 0, 0, 0, 0);
    let end = new Date(year, 3, 2, 0, 0, 0, 0);

    return (start <= today) && (today < end);
}

const copyToClipboard = (text) => {
    // @ts-ignore
    if (window.clipboardData && window.clipboardData.setData) {
        // @ts-ignore
        return clipboardData.setData("Text", text);
    } else if (
        document.queryCommandSupported &&
        document.queryCommandSupported("copy")
    ) {
        const textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");
        } catch (ex) {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
};

String.prototype.getBytes = function() {
    return [...new Intl.Segmenter().segment(this)].length;
}

String.prototype.splitBytes = function(length) {
    return [...new Intl.Segmenter().segment(this)].map((a) => {
        return a.segment;
    }).slice(0, length).join("");
}

module.exports = {
    timeForToday,
    aprilFoolsDay,
    copyToClipboard
}