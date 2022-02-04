import React from 'react';

export default React.createClass({
    render() {
        return (
            <div className="btn-group">
                {this.props.children}
            </div>
        );
    },
});
