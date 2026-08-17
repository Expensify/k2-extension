import React, {useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import CONST from '../../CONST';

const LABELS = {
    [CONST.AGENT_DISPATCHER.ACTIONS.REPLY]: 'Draft reply',
    [CONST.AGENT_DISPATCHER.ACTIONS.REVIEW]: 'Review',
    [CONST.AGENT_DISPATCHER.ACTIONS.BABYSIT]: 'Babysit',
};

const propTypes = {
    action: PropTypes.oneOf(_.keys(LABELS)).isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string,
};

const defaultProps = {
    title: '',
};

function AgentDispatchButton({action, url, title}) {
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState(null);
    const resultTimeoutRef = useRef(null);

    useEffect(() => () => clearTimeout(resultTimeoutRef.current), []);

    const dispatch = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsSending(true);
        setResult(null);
        try {
            const response = await fetch(CONST.AGENT_DISPATCHER.ENDPOINT, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action, url, title}),
            });
            setResult(response.ok ? 'success' : 'error');
        } catch (error) {
            setResult('error');
        } finally {
            setIsSending(false);
            resultTimeoutRef.current = setTimeout(() => setResult(null), 3000);
        }
    };

    let content = `🤖 ${LABELS[action]}`;
    if (isSending) {
        content = <span className="k2-workflow-menu-loader" />;
    } else if (result === 'success') {
        content = '✓ Dispatched';
    } else if (result === 'error') {
        content = '✗ No dispatcher';
    }

    const buttonTitle = result === 'error'
        ? 'Could not reach the local dispatcher. Start it with: node tools/k2Dispatcher.mjs'
        : `Hand this off to a local Claude agent (${LABELS[action]})`;

    return (
        <button
            type="button"
            className={`k2-agent-dispatch-button${result ? ` k2-agent-dispatch-${result}` : ''}`}
            disabled={isSending}
            onClick={dispatch}
            title={buttonTitle}
        >
            {content}
        </button>
    );
}

AgentDispatchButton.propTypes = propTypes;
AgentDispatchButton.defaultProps = defaultProps;
AgentDispatchButton.displayName = 'AgentDispatchButton';

export default AgentDispatchButton;
