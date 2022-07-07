import React from 'react';
import _ from 'underscore';
import {withOnyx} from 'react-native-onyx';
import * as Issues from '../../lib/actions/Issues';
import ONYXKEYS from '../../ONYXKEYS';
import PanelListRaw from '../../component/panel/PanelListRaw';

class ListIssuesEngineering extends React.Component {
    componentDidMount() {
        Issues.getEngineering();
    }

    render() {
        console.log(this.props.issues);
        return null;
        if (!this.props.issues) {
            return (
                <div className="blankslate capped clean-background">
                    Loading
                </div>
            );
        }

        if (!_.size(this.props.issues)) {
            return (
                <div className="blankslate capped clean-background">
                    No engineering issues
                </div>
            );
        }

        return (
            <PanelListRaw
                title="Engineering"
                extraClass="none"
                item="issue"
                data={this.props.issues}
            />
        );
    }
}

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.ENGINEERING,
    },
})(ListIssuesEngineering);
