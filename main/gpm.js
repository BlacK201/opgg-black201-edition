const {default: axios} = require("axios");
const { LocalStorage } = require("node-localstorage");
const {app} = require("electron");
const nodeStorage = new LocalStorage(`${app.getPath("userData")}/session`);

let gpmAPI = function(method, url, data=null, options={}) {
    return new Promise(function(resolve, reject) {
        let uri = "https://gpm-stage-fhc29dh1a.op.gg";
        uri = "https://gpm-stage-fhc29dh1a.op.gg";

        let _ot = nodeStorage.getItem("_ot");

        let axiosOptions = {
            method: method,
            url: `${uri}${url}`,
            data: data,
            headers: {
                "X-OPGG-Member-Token": `${_ot ? `Bearer ${_ot}` : ""}`,
                "X-OPGG-Service": "j6fRyOdTHJEI1yvfbBFgu34QFeSJzSlS"
            }
        };

        Object.keys(options).forEach((key) => {
            axiosOptions[key] = options[key];
        });

        axios(axiosOptions)
            .then(function (response) {
                resolve(response);
            }).catch(function (error) {
            reject(error);
        }).finally(function () {

        });
    });
};

function profiles() {
    return gpmAPI("GET", `/api/v1/member/profiles/all`);
}

module.exports = {
    profiles,
}