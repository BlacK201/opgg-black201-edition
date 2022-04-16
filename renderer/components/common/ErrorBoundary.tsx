import React, { ReactNode } from "react";

interface IProps {
    errorComponent?: ReactNode
}

interface IState {
    hasError: boolean
}

export class ErrorBoundary extends React.Component<IProps, IState> {
    state = {
        hasError: false
    }

    constructor(props: any) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError() {
        return {hasError: true};
    }

    componentDidCatch(error: any, errorInfo: any) {
        // 에러 리포팅 서비스에 에러를 기록할 수도 있습니다.
        console.log(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.errorComponent) {
                return this.props.errorComponent;
            }
            return <div>error</div>
        }

        return this.props.children;
    }
}