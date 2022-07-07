import React from 'react';
import {withOnyx} from 'react-native-onyx';
import * as Issues from '../../lib/actions/Issues';
import ONYXKEYS from '../../ONYXKEYS';

class ListIssuesEngineering extends React.Component {
    componentDidMount() {
        Issues.getEngineering();
    }

    render() {
        console.log(this.props.issues);
        return (
            <h1>List Issues Engineering</h1>
        );
    }
}

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.ENGINEERING,
    },
})(ListIssuesEngineering);
