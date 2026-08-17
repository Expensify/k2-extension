import React, {useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import CONST from '../../CONST';

const propTypes = {
    /** The agent action every item is dispatched to */
    action: PropTypes.oneOf(_.values(CONST.AGENT_DISPATCHER.ACTIONS)).isRequired,

    /** The items currently shown in the panel */
    items: PropTypes.arrayOf(PropTypes.shape({
        url: PropTypes.string.isRequired,
        title: PropTypes.string,
    })).isRequired,
};

function DispatchAllButton({action, items}) {
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState(null);
    const resultTimeoutRef = useRef(null);

    useEffect(() => () => clearTimeout(resultTimeoutRef.current), []);

    const dispatchAll = async (event) => {
        event.preventDefault();
        setIsSending(true);
        setResult(null);
        try {
            const responses = await Promise.all(_.map(items, item => fetch(CONST.AGENT_DISPATCHER.ENDPOINT, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action, url: item.url, title: item.title}),
            })));
            setResult(_.every(responses, response => response.ok) ? 'success' : 'error');
        } catch (error) {
            setResult('error');
        } finally {
            setIsSending(false);
            resultTimeoutRef.current = setTimeout(() => setResult(null), 3000);
        }
    };

    let label = `🤖 Dispatch all (${items.length})`;
    if (isSending) {
        label = 'Dispatching…';
    } else if (result === 'success') {
        label = '✓ Dispatched';
    } else if (result === 'error') {
        label = '✗ No dispatcher';
    }

    return (
        <button
            type="button"
            className="btn btn-sm"
            disabled={isSending}
            onClick={dispatchAll}
            title={result === 'error'
                ? 'Could not reach the local dispatcher. Start it with: node tools/k2Dispatcher.mjs'
                : 'Hand every item in this panel to a local Claude agent. Results land in the Agent Drafts panel.'}
        >
            {label}
        </button>
    );
}

DispatchAllButton.propTypes = propTypes;
DispatchAllButton.displayName = 'DispatchAllButton';

export default DispatchAllButton;
