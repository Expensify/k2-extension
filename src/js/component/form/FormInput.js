import React from 'react';

export default React.createClass({
    componentDidMount() {
        if (!this.props.data.focus) {
            return;
        }
        this.input.focus();
    },
    render() {
        return (
            <input
                ref={el => this.input = el}
                type={this.props.type || 'text'}
                htmlId={this.props.data.id}
                name={this.props.data.id}
                required={this.props.data.required}
                className={this.props.data.className}
            />
        );
    },
});
