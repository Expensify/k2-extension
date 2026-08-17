import React, {useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import CONST from '../../CONST';

const LABELS = {
    [CONST.AGENT_DISPATCHER.BATCH_ACTIONS.TRIAGE]: 'Triage',
    [CONST.AGENT_DISPATCHER.BATCH_ACTIONS.REVIEW_QUEUE]: 'Review queue',
};

const propTypes = {
    /** The batch skill every item in the panel is handed to as one job */
    action: PropTypes.oneOf(_.keys(LABELS)).isRequired,

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
            const response = await fetch(CONST.AGENT_DISPATCHER.ENDPOINT, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action,
                    title: `${LABELS[action]} — ${items.length} items`,
                    items: _.map(items, item => ({url: item.url, title: item.title})),
                }),
            });
            setResult(response.ok ? 'success' : 'error');
        } catch (error) {
            setResult('error');
        } finally {
            setIsSending(false);
            resultTimeoutRef.current = setTimeout(() => setResult(null), 3000);
        }
    };

    let label = `🤖 ${LABELS[action]} (${items.length})`;
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
                : `Run /${action} over every item in this panel as one local Claude job. The result lands in the Agent Drafts panel.`}
        >
            {label}
        </button>
    );
}

DispatchAllButton.propTypes = propTypes;
DispatchAllButton.displayName = 'DispatchAllButton';

export default DispatchAllButton;
