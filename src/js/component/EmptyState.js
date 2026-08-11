import React from 'react';
import PropTypes from 'prop-types';
import {Spinner, Text} from '@primer/react';

const propTypes = {
    isLoading: PropTypes.bool,
    message: PropTypes.string,
};

const defaultProps = {
    isLoading: false,
    message: 'No items',
};

function EmptyState({isLoading, message}) {
    return (
        <div className="k2-empty-state" role={isLoading ? 'status' : undefined}>
            {isLoading && <Spinner size="small" />}
            <Text>{isLoading ? 'Loading' : message}</Text>
        </div>
    );
}

EmptyState.propTypes = propTypes;
EmptyState.defaultProps = defaultProps;
EmptyState.displayName = 'EmptyState';

export default EmptyState;
