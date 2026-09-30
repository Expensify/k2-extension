import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';

const propTypes = {
    /** The text to display */
    text: PropTypes.string.isRequired,

    /** Number of panel issues */
    count: PropTypes.number,

    /** Callback to open all items in new tabs */
    onOpenAll: PropTypes.func,

    /** Checkboxes to show next to the title */
    checkboxes: PropTypes.arrayOf(PropTypes.shape({
        /** The id and the name of the input */
        id: PropTypes.string.isRequired,

        /** The text to show next to the input */
        label: PropTypes.string.isRequired,

        /** Whether the checkbox is checked */
        isChecked: PropTypes.bool,

        /** Callback when the user toggles the checkbox */
        onChange: PropTypes.func.isRequired,
    })),
};

const defaultProps = {
    count: null,
    onOpenAll: null,
    checkboxes: [],
};

function Title(props) {
    return (
        <div>
            <h3 className="panel-title panel-title-with-actions">
                <span className="panel-title-heading">
                    <span className="panel-title-text">{props.text}</span>
                    {props.count !== null && <span className="Counter panel-title-count">{props.count}</span>}
                </span>
                {_.size(props.checkboxes) > 0 && (
                    <span className="panel-title-options">
                        {_.map(props.checkboxes, checkbox => (
                            <label key={checkbox.id} className="panel-title-checkbox" htmlFor={checkbox.id}>
                                <input
                                    type="checkbox"
                                    id={checkbox.id}
                                    name={checkbox.id}
                                    checked={!!checkbox.isChecked}
                                    onChange={checkbox.onChange}
                                />
                                {checkbox.label}
                            </label>
                        ))}
                    </span>
                )}
                {props.onOpenAll && props.count > 0 && (
                    <button
                        type="button"
                        className="btn btn-sm panel-title-open-all"
                        onClick={props.onOpenAll}
                        title={`Open all ${props.count} items in new tabs`}
                    >
                        Open All
                    </button>
                )}
            </h3>
        </div>
    );
}

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;
Title.displayName = 'Title';

export default Title;
