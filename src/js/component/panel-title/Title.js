import React, {useState, useEffect, useRef} from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';

const propTypes = {
    /** The text to display */
    text: PropTypes.string.isRequired,

    /** Number of panel issues */
    count: PropTypes.number,

    /** Callback to open all items in new tabs */
    onOpenAll: PropTypes.func,

    /** Items to copy as AI-friendly markdown links */
    items: PropTypes.arrayOf(
        PropTypes.shape({
            url: PropTypes.string,
            title: PropTypes.string,
        }),
    ),
};

const defaultProps = {
    count: null,
    onOpenAll: null,
    items: null,
};

function Title(props) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(
        () => () => {
            if (!timeoutRef.current) {
                return;
            }
            clearTimeout(timeoutRef.current);
        },
        [],
    );

    function handleCopy() {
        const text = _.map(
            props.items,
            item => `- [${item.title}](${item.url})`,
        ).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }

    const showActions = (props.onOpenAll && props.count > 0)
        || (props.items && props.count > 0);

    return (
        <div>
            <h3 className="panel-title panel-title-with-actions">
                <span>{`${props.text} ${props.count !== null ? `(${props.count})` : ''}`}</span>
                {showActions && (
                    <span
                        style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                        }}
                    >
                        {props.items && props.count > 0 && (
                            <button
                                type="button"
                                className="btn btn-sm tooltipped tooltipped-s"
                                aria-label={
                                    copied
                                        ? 'Copied!'
                                        : 'Copy links for AI prompt'
                                }
                                onClick={handleCopy}
                                style={
                                    copied ? {color: '#009800'} : undefined
                                }
                            >
                                <span
                                    className={`octicon ${copied ? 'octicon-check' : 'octicon-clippy'}`}
                                />
                            </button>
                        )}
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
                    </span>
                )}
            </h3>
        </div>
    );
}

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;
Title.displayName = 'Title';

export default Title;
