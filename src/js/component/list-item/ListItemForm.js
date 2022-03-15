import React from 'react';
import FormInput from '../form/FormInput';

export default React.createClass({
    render() {
        let element;
        let hint;

        switch (this.props.data.type) {
            case 'password': element = <FormInput data={this.props.data} type="password" />; break;
            default: element = null;
        }

        if (this.props.data.hint) {
            hint = <p>{this.props.data.hint}</p>;
        }


        return (
            <div className="panel-item">
                <label htmlFor={this.props.data.id}>{this.props.data.label}</label>
                {element}
                {hint}
            </div>
        );
    },
});
