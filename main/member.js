const {default: axios} = require("axios");
const { LocalStorage } = require("node-localstorage");
const {app} = require("electron");
const nodeStorage = new LocalStorage(`${app.getPath("userData")}/session`);

let memberAPI = function(method, url, data=null, options={}) {
    return new Promise(function(resolve, reject) {
        let uri = "https://member-api.op.gg";

        let _ot = nodeStorage.getItem("_ot");

        let axiosOptions = {
            method: method,
            url: `${uri}${url}`,
            data: data,
            headers: {
                "Authorization": `Bearer ${_ot}`,
                "X-OPGG-Service": "fPnBvZz8X4MJu3Z2RrfDcLTZFKUre77K"
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

function member() {
    return memberAPI("GET", `/v1/member`);
}

function renewal() {
    return memberAPI("POST", "/v1/authentication/token/renewal?isRememberMe=true");
}

module.exports = {
    member,
    renewal
}