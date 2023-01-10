import React from "react";
import ReactDOM from "react-dom";
import Modal from "react-modal";
import App from "./App";
import i18n from "./lib/i18n";
import { Provider } from "react-redux";
import store from "./redux/store";
import { HashRouter } from "react-router-dom";
import { initToastr } from "./lib/toastr";
import "tippy.js/dist/tippy.css";
import "toastr/build/toastr.min.css";

const render = () => {
  i18n.then(() => {
    const App = require("./App").default;

    Modal.setAppElement("#root");
    initToastr();

    ReactDOM.render(
      <React.StrictMode>
        <Provider store={store}>
          <HashRouter basename={"OP.GG"}>
            <App />
          </HashRouter>
        </Provider>
      </React.StrictMode>,
      document.getElementById("root")
    );
  });
};

render();

if (process.env.NODE_ENV === "development" && module.hot) {
  module.hot.accept("./App", render);
}
