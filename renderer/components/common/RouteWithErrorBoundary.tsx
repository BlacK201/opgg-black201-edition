import React, { ReactNode } from "react";
import {Route, RouteProps} from "react-router-dom";
import {ErrorBoundary} from "./ErrorBoundary";

const RouteWithErrorBoundary: React.FC<RouteProps> = (props) => {
    return (
        <ErrorBoundary key={props.location?.pathname}>
            <Route {...props} />
        </ErrorBoundary>
    );
};

export default RouteWithErrorBoundary;