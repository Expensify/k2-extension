import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    /** The text to display */
    text: PropTypes.string.isRequired,

    /** Number of panel issues */
    count: PropTypes.number,

    /** Callback to open all items in new tabs */
    onOpenAll: PropTypes.func,
};

const defaultProps = {
    count: null,
    onOpenAll: null,
};

function Title(props) {
    return (
        <div>
            <h3 className="panel-title panel-title-with-actions">
                <span>{`${props.text} ${props.count !== null ? `(${props.count})` : ''}`}</span>
                {props.onOpenAll && props.count > 0 && (
                    <button
                        type="button"
                        className="btn btn-sm"
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
