import React from 'react';
import ReactNativeOnyx, {useOnyx} from 'react-native-onyx';
import _ from 'underscore';
import {
    ActionList, ActionMenu, Button, ButtonGroup, Heading, Stack, Text,
} from '@primer/react';
import {
    ProjectIcon,
    SignOutIcon,
    TriangleDownIcon,
} from '@primer/octicons-react';
import ToggleOpenAll from '../ToggleOpenAll/Toggle';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';
import * as GitHubOAuth from '../../lib/GitHubOAuth';

const issueDestinations = [
    {
        id: 'expensify',
        label: 'Expensify',
        url: 'https://github.com/Expensify/Expensify/issues/new/choose',
    },
    {
        id: 'app',
        label: 'App',
        url: 'https://github.com/Expensify/App/issues/new/choose',
    },
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

function DashboardHeader() {
    const [preferences = {}] = useOnyx(ONYXKEYS.PREFERENCES);
    const destinationID = preferences.newIssueDestination || Preferences.getNewIssueDestination();
    const selectedDestination = _.findWhere(issueDestinations, {id: destinationID}) || issueDestinations[0];

    function selectDestination(destination) {
        Preferences.setNewIssueDestination(destination.id);
    }

    return (
        <header className="k2-dashboard-header">
            <Stack
                direction="horizontal"
                align="center"
                justify="space-between"
                wrap="wrap"
                gap="normal"
            >
                <Stack direction="horizontal" align="start" gap="condensed">
                    <ProjectIcon className="k2-dashboard-icon" size={24} />
                    <Stack gap="none">
                        <Heading as="h1" className="k2-dashboard-title">
                            K2 dashboard
                        </Heading>
                        <Text className="k2-dashboard-subtitle">
                            Assigned issues and pull requests
                        </Text>
                    </Stack>
                </Stack>
                <Stack
                    className="k2-dashboard-actions"
                    direction="horizontal"
                    align="center"
                    wrap="wrap"
                    gap="condensed"
                >
                    <ToggleOpenAll />
                    <ButtonGroup>
                        <Button
                            as="a"
                            className="k2-new-issue-button"
                            href={selectedDestination.url}
                            rel="noopener noreferrer"
                            target="_blank"
                            variant="primary"
                        >
                            {`New issue: ${selectedDestination.label}`}
                        </Button>
                        <ActionMenu>
                            <ActionMenu.Button
                                aria-label="Choose new issue repository"
                                icon={TriangleDownIcon}
                                variant="primary"
                            />
                            <ActionMenu.Overlay width="medium">
                                <ActionList
                                    selectionVariant="single"
                                    aria-label="New issue repository"
                                >
                                    {_.map(issueDestinations, destination => (
                                        <ActionList.Item
                                            key={destination.id}
                                            selected={destination.id === selectedDestination.id}
                                            onSelect={() => selectDestination(destination)}
                                            role="menuitemradio"
                                            aria-checked={destination.id === selectedDestination.id}
                                        >
                                            {destination.label}
                                        </ActionList.Item>
                                    ))}
                                </ActionList>
                            </ActionMenu.Overlay>
                        </ActionMenu>
                    </ButtonGroup>
                    <Button leadingVisual={SignOutIcon} onClick={signOut}>
                        Sign out
                    </Button>
                </Stack>
            </Stack>
        </header>
    );
}

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
