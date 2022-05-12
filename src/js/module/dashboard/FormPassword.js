import $ from 'jquery';
import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import PanelList from '../../component/panel/PanelList';
import * as Preferences from '../../lib/actions/Preferences';

const propTypes = {
    /** A callback function that is triggered after the form is submitted */
    onFinished: PropTypes.func,
};
const defaultProps = {
    onFinished: () => {},
};

class FormPassword extends React.Component {
    constructor(props) {
        super(props);

        this.submitForm = this.submitForm.bind(this);
    }

    /**
     * Get the password and store it as a user preference
     *
     * @param {Object} e React form submit event
     */
    submitForm(e) {
        e.preventDefault();
        const formData = $(this.form).serializeArray();
        const passwordData = _.findWhere(formData, {name: 'password'});

        // Save the github token to our locally stored preferences
        Preferences.setGitHubToken(passwordData.value);

        // Trigger the callback function so we can move on
        this.props.onFinished();
    }

    render() {
        return (
            <div className="columns">
                <div className="one-third column centered">
                    <form ref={el => this.form = el} onSubmit={this.submitForm}>
                        <PanelList
                            title="Enter Credentials"
                            item="form"
                            list={[
                                {
                                    id: 'password',
                                    type: 'password',
                                    label: 'Personal Access Token',
                                    className: 'input-block',
                                    hint: 'A personal access token is required to make custom queries against the GitHub.com API.',
                                    required: true,
                                    focus: true,
                                },
                            ]}
                        >
                            <footer className="panel-footer form-actions">
                                <button className="btn btn-primary" type="submit">
                                    Submit
                                </button>
                            </footer>
                        </PanelList>
                    </form>
                </div>
            </div>
        );
    }
}

FormPassword.propTypes = propTypes;
FormPassword.defaultProps = defaultProps;

export default withOnyx({
    preferences: {
        key: 'preferences',
    },
})(FormPassword);
