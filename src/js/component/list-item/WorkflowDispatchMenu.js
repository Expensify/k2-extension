import React, {useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import * as API from '../../lib/api';

const APP_OWNER = 'Expensify';
const APP_REPO = 'App';

const OPTIONS = [
    {
        key: 'all-except-cache',
        label: 'Test build (all except cache)',
        workflowId: 'testBuild.yml',
        buildInputs: prUrl => ({
            APP_PULL_REQUEST_URL: prUrl,
            REVIEWED_CODE: true,
            WEB: true,
            IOS: true,
            ANDROID: true,
            FORCE_NATIVE_BUILD: false,
        }),
    },
    {
        key: 'web-only',
        label: 'Test build (web only)',
        workflowId: 'testBuild.yml',
        buildInputs: prUrl => ({
            APP_PULL_REQUEST_URL: prUrl,
            REVIEWED_CODE: true,
            WEB: true,
            IOS: false,
            ANDROID: false,
            FORCE_NATIVE_BUILD: false,
        }),
    },
    {
        key: 'native-with-cache',
        label: 'Test build (native + cache)',
        workflowId: 'testBuild.yml',
        buildInputs: prUrl => ({
            APP_PULL_REQUEST_URL: prUrl,
            REVIEWED_CODE: true,
            WEB: false,
            IOS: true,
            ANDROID: true,
            FORCE_NATIVE_BUILD: true,
        }),
    },
    {
        key: 'translations',
        label: 'Generate translations',
        workflowId: 'generateTranslations.yml',
        buildInputs: prUrl => ({
            PULL_REQUEST_URL: prUrl,
        }),
    },
];

const propTypes = {
    prUrl: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(['inline', 'sidebar']),
};

const defaultProps = {
    variant: 'inline',
};

function WorkflowDispatchMenu({prUrl, variant}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDispatching, setIsDispatching] = useState(false);
    const [result, setResult] = useState(null);
    const containerRef = useRef(null);
    const resultTimeoutRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }
        const handleClickOutside = (event) => {
            if (
                !containerRef.current
                || containerRef.current.contains(event.target)
            ) {
                return;
            }
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => () => clearTimeout(resultTimeoutRef.current), []);

    const handleSelect = async (option) => {
        setIsOpen(false);
        setIsDispatching(true);
        setResult(null);
        try {
            await API.triggerWorkflow(option.workflowId, {
                owner: APP_OWNER,
                repo: APP_REPO,
                ref: 'main',
                inputs: option.buildInputs(prUrl),
            });
            setResult('success');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to trigger ${option.workflowId}:`, error);
            setResult('error');
        } finally {
            setIsDispatching(false);
            resultTimeoutRef.current = setTimeout(() => setResult(null), 3000);
        }
    };

    const isSidebar = variant === 'sidebar';

    let summaryContent;
    if (isDispatching) {
        summaryContent = <span className="k2-workflow-menu-loader" />;
    } else if (result === 'success') {
        summaryContent = isSidebar ? '✓ Workflow triggered' : '✓';
    } else if (result === 'error') {
        summaryContent = isSidebar ? '✗ Failed to trigger' : '✗';
    } else {
        summaryContent = isSidebar ? 'Run workflow ▾' : '⚡';
    }

    const containerClassName = _.compact([
        'k2-workflow-menu',
        isSidebar && 'k2-workflow-menu--sidebar',
    ]).join(' ');

    const buttonClassName = _.compact([
        isSidebar
            ? 'btn btn-sm k2-workflow-menu-button-block'
            : 'k2-workflow-menu-button',
        result === 'success' && 'k2-translation-success',
        result === 'error' && 'k2-translation-failed',
    ]).join(' ');

    const Container = isSidebar ? 'div' : 'span';

    return (
        <Container className={containerClassName} ref={containerRef}>
            <button
                type="button"
                className={buttonClassName}
                disabled={isDispatching}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsOpen(open => !open);
                }}
                title="Run an Expensify/App workflow on this PR"
            >
                {summaryContent}
            </button>
            {isOpen && (
                <ul className="k2-workflow-menu-panel">
                    {_.map(OPTIONS, option => (
                        <li key={option.key}>
                            <button
                                type="button"
                                className="k2-workflow-menu-item"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleSelect(option);
                                }}
                            >
                                {option.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </Container>
    );
}

WorkflowDispatchMenu.propTypes = propTypes;
WorkflowDispatchMenu.defaultProps = defaultProps;
WorkflowDispatchMenu.displayName = 'WorkflowDispatchMenu';

export default WorkflowDispatchMenu;
