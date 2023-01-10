import React from "react";
import Side from "./Side";

interface LayoutProps {
  children: JSX.Element;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <div className="layout-side">
        <Side />
      </div>
      <div className="layout-main">{children}</div>
    </div>
  );
};

export default Layout;
