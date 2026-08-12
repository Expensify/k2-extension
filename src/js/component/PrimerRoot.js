import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {BaseStyles, ThemeProvider} from '@primer/react';
import '@primer/primitives/dist/css/functional/themes/light.css';
import '@primer/primitives/dist/css/functional/themes/light-high-contrast.css';
import '@primer/primitives/dist/css/functional/themes/dark.css';
import '@primer/primitives/dist/css/functional/themes/dark-dimmed.css';
import '@primer/primitives/dist/css/functional/themes/dark-high-contrast.css';

const propTypes = {
    children: PropTypes.node.isRequired,
};

function getGitHubTheme() {
    const documentElement = document.documentElement;
    const requestedColorMode = documentElement.getAttribute('data-color-mode');
    const colorMode = requestedColorMode === 'dark'
        || (requestedColorMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark'
        : 'light';
    const themeAttribute = colorMode === 'dark' ? 'data-dark-theme' : 'data-light-theme';
    const supportedThemes = colorMode === 'dark'
        ? ['dark', 'dark_dimmed', 'dark_high_contrast']
        : ['light', 'light_high_contrast'];
    const requestedTheme = documentElement.getAttribute(themeAttribute);
    let colorScheme = requestedTheme;
    if (!supportedThemes.includes(colorScheme)) {
        if (requestedTheme && requestedTheme.includes('high_contrast')) {
            colorScheme = `${colorMode}_high_contrast`;
        } else if (colorMode === 'dark' && requestedTheme && requestedTheme.includes('dimmed')) {
            colorScheme = 'dark_dimmed';
        } else {
            colorScheme = colorMode;
        }
    }

    return {colorMode, colorScheme};
}

function PrimerRoot({children}) {
    const [theme, setTheme] = useState(getGitHubTheme);

    useEffect(() => {
        const observer = new MutationObserver(() => setTheme(getGitHubTheme()));
        const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateTheme = () => setTheme(getGitHubTheme());
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-color-mode', 'data-light-theme', 'data-dark-theme'],
        });
        colorSchemeQuery.addEventListener('change', updateTheme);

        return () => {
            observer.disconnect();
            colorSchemeQuery.removeEventListener('change', updateTheme);
        };
    }, []);

    const isDark = theme.colorMode === 'dark';

    return (
        <ThemeProvider
            colorMode={isDark ? 'night' : 'day'}
            dayScheme={isDark ? 'light' : theme.colorScheme}
            nightScheme={isDark ? theme.colorScheme : 'dark'}
        >
            <BaseStyles
                className="k2-primer-root"
                data-color-mode={theme.colorMode}
                data-light-theme={isDark ? 'light' : theme.colorScheme}
                data-dark-theme={isDark ? theme.colorScheme : 'dark'}
            >
                {children}
            </BaseStyles>
        </ThemeProvider>
    );
}

PrimerRoot.propTypes = propTypes;
PrimerRoot.displayName = 'PrimerRoot';

export default PrimerRoot;
