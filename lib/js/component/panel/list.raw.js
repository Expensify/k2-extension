
const React = require('react');
const Title = require('../panel-title/index');
const ListRaw = require('../list/raw');

module.exports = props => (
    <div className={`panel ${props.extraClass}`}>
        <Title text={props.title} />
        <ListRaw
            type={props.item}
            data={props.data}
        />
    </div>
);
