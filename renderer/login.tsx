import React from "react";
import "tippy.js/dist/tippy.css";
import "toastr/build/toastr.min.css";
import {default as Menu} from "./renewal/components/layouts/Menu";
import {default as Login} from "./renewal/pages/login";

const render = () => {
    const Login = require("./renewal/pages/login").default;
    const Menu = require("./renewal/components/layouts/Menu").default;

    return (
        <>
            <Menu />
            <Login />
        </>
    )
};

export default render;
