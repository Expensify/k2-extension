import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import _ from 'underscore';
import {
    Button, Heading, Label, Stack, Text,
} from '@primer/react';
import {IssueOpenedIcon, SignOutIcon} from '@primer/octicons-react';
import * as Preferences from '../../lib/actions/Preferences';
import * as GitHubOAuth from '../../lib/GitHubOAuth';
import ToggleOpenAll from '../ToggleOpenAll/Toggle';

const statusItems = [
    {label: 'Under review', variant: 'secondary'},
    {label: 'Overdue', variant: 'danger'},
    {label: 'Planning', variant: 'attention'},
    {label: 'Contributor assigned', variant: 'accent'},
    {label: 'External', variant: 'secondary'},
    {label: 'Improvement', variant: 'done'},
    {label: 'Task', variant: 'attention'},
    {label: 'New feature', variant: 'sponsors'},
];

const priorityItems = [
    {label: 'Hourly', variant: 'danger'},
    {label: 'Daily', variant: 'severe'},
    {label: 'Weekly', variant: 'success'},
    {label: 'Monthly', variant: 'sponsors'},
    {label: 'First Pick', variant: 'accent'},
    {label: 'WhatsNext', variant: 'done'},
];

async function signOut() {
    try {
        if (Preferences.getAuthType() === 'oauth') {
            await GitHubOAuth.revokeToken();
        }
    } catch (error) {
        // Token revocation is best effort; local credentials must still be cleared.
    }

    Preferences.clearAuth();
    ReactNativeOnyx.clear();
    window.location.reload();
}

function Legend() {
    return (
        <Stack className="k2-legend" gap="normal">
            <Stack gap="condensed">
                <Button
                    as="a"
                    href="https://github.com/Expensify/Expensify/issues/new/choose"
                    target="_blank"
                    rel="noopener noreferrer"
                    leadingVisual={IssueOpenedIcon}
                    variant="primary"
                >
                    New issue
                </Button>
                <Button
                    as="a"
                    href="https://github.com/Expensify/App/issues/new/choose"
                    target="_blank"
                    rel="noopener noreferrer"
                    leadingVisual={IssueOpenedIcon}
                >
                    New /app issue
                </Button>
                <Button leadingVisual={SignOutIcon} onClick={signOut}>Sign out</Button>
            </Stack>
            <ToggleOpenAll />
            <div>
                <Heading as="h3" className="k2-legend-heading">Status</Heading>
                <Stack gap="condensed">
                    {_.map(statusItems, item => (
                        <Stack key={item.label} direction="horizontal" align="center" gap="condensed">
                            <Label variant={item.variant} size="small">{item.label}</Label>
                        </Stack>
                    ))}
                    <Text className="k2-owner-key">★ You own the issue</Text>
                    <Text>☆ Owned by someone else</Text>
                </Stack>
            </div>
            <div>
                <Heading as="h3" className="k2-legend-heading">Priority</Heading>
                <Stack gap="condensed">
                    {_.map(priorityItems, item => (
                        <Label key={item.label} variant={item.variant} size="small">{item.label}</Label>
                    ))}
                </Stack>
            </div>
        </Stack>
    );
}

Legend.displayName = 'Legend';

export default Legend;
