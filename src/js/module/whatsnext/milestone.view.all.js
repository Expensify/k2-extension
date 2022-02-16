import React from 'react';
import * as API from '../../lib/api';

module.exports = React.createClass({
    getInitialState() {
        return {
            isLoading: true,
            milestones: [],
        };
    },

    componentDidMount() {
    // Fetch our milestones
        API.getMilestones('all', (err, milestones) => {
            if (err) {
                console.error(err);
                return;
            }

            this.setState({
                isLoading: false,
                milestones,
            });
        });
    },

    render() {
        if (this.state.isLoading) {
            return (
                <div>
                    Loading...
                </div>
            );
        }

        if (!this.state.milestones.length) {
            return (
                <div>
                    No milestones today.
                </div>
            );
        }

        return (
            <div>
                {this.state.milestones.length}
                {' '}
                milestone(s)
            </div>
        );
    },
});
