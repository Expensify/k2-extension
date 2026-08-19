import React from 'react';
import PropTypes from 'prop-types';
import {Banner, Button, Stack} from '@primer/react';

const propTypes = {
    children: PropTypes.node.isRequired,
};

class DashboardErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {hasError: false};
        this.reload = this.reload.bind(this);
    }

    static getDerivedStateFromError() {
        return {hasError: true};
    }

    componentDidCatch(error, errorInfo) {
        console.error('K2 dashboard render failed:', error, errorInfo);
    }

    reload() {
        window.location.reload();
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <Stack className="k2-dashboard-error" gap="normal" padding="normal">
                <Banner
                    title="The K2 dashboard could not be displayed"
                    description="Your cached data is still available. Reload to retry the dashboard."
                    variant="critical"
                />
                <Button onClick={this.reload}>Reload dashboard</Button>
            </Stack>
        );
    }
}

DashboardErrorBoundary.propTypes = propTypes;
DashboardErrorBoundary.displayName = 'DashboardErrorBoundary';

export default DashboardErrorBoundary;
