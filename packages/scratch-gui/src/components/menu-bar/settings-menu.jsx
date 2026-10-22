import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useMemo} from 'react';
import {useIntl, FormattedMessage, defineMessage} from 'react-intl';
import {connect} from 'react-redux';
import useMenuNavigation from '../../hooks/use-menu-navigation';

import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuSection, MenuItem} from '../menu/menu.jsx';
import PreferenceMenu from './preference-menu.jsx';

import {DEFAULT_MODE, HIGH_CONTRAST_MODE, colorModeMap} from '../../lib/settings/color-mode/index.js';
import {themeMap} from '../../lib/settings/theme/index.js';
import {persistColorMode} from '../../lib/settings/color-mode/persistence.js';
import {persistTheme} from '../../lib/settings/theme/persistence.js';
import {setColorMode, setTheme, setPreventStageDrag} from '../../reducers/settings.js';
import {isAndroidStageDragAvailable, persistPreventStageDrag} from '../../lib/android-stage-drag';
import check from './check.svg';

import menuBarStyles from './menu-bar.css';
import styles from './settings-menu.css';

import dropdownCaret from './dropdown-caret.svg';
import settingsIcon from './icon--settings.svg';
import themeIcon from '../../lib/assets/icon--theme.svg';

const settingsMenuAriaMessage = defineMessage({
    id: 'gui.aria.settingsMenu',
    defaultMessage: 'Settings menu',
    description: 'accessibility label for settings menu'
});

const enabledColorModes = [DEFAULT_MODE, HIGH_CONTRAST_MODE];

const SettingsMenu = ({
    canChangeColorMode,
    canChangeTheme,
    hasActiveMembership,
    isRtl,
    activeColorMode,
    onChangeColorMode,
    activeTheme,
    onChangeTheme,
    preventStageDrag,
    onChangePreventStageDrag,
    depth
}) => {
    const intl = useIntl();
    const handleTogglePreventStageDrag = useCallback(event => {
        event.stopPropagation();
        onChangePreventStageDrag(!preventStageDrag);
    }, [onChangePreventStageDrag, preventStageDrag]);

    const enabledColorModesMap = useMemo(() => Object.keys(colorModeMap).reduce((acc, colorMode) => {
        if (enabledColorModes.includes(colorMode)) {
            acc[colorMode] = colorModeMap[colorMode];
        }
        return acc;
    }, {}), []);
    const availableThemesMap = useMemo(() => Object.keys(themeMap).reduce((acc, themeKey) => {
        const theme = themeMap[themeKey];
        if (theme.isAvailable?.({hasActiveMembership})) {
            acc[themeKey] = theme;
        }
        return acc;
    }, {}), [hasActiveMembership]);
    const availableThemesLength = useMemo(() => Object.keys(availableThemesMap).length, [availableThemesMap]);

    const {
        isExpanded,
        handleOnOpen,
        handleOnClose,
        handleKeyDown,
        menuRef
    } = useMenuNavigation({
        depth,
        isRtl
    });

    return (<button
        className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable, menuBarStyles.themeMenu, {
            [menuBarStyles.active]: isExpanded()
        })}
        aria-expanded={isExpanded()}
        aria-label={intl.formatMessage(settingsMenuAriaMessage)}
        onClick={handleOnOpen}
        onKeyDown={handleKeyDown}
        ref={menuRef}
    >
        <img src={settingsIcon} />
        <span className={styles.dropdownLabel}>
            <FormattedMessage
                defaultMessage="Settings"
                description="Settings menu"
                id="gui.menuBar.settings"
            />
        </span>
        <img src={dropdownCaret} />
        <MenuBarMenu
            className={menuBarStyles.menuBarMenu}
            open={isExpanded()}
            place={isRtl ? 'left' : 'right'}
            onRequestClose={handleOnClose}
        >
            <MenuSection>
                {canChangeTheme &&
                    // TODO: Consider always showing the theme menu, even if there is a single available theme
                    availableThemesLength > 1 &&
                    <PreferenceMenu
                        itemsMap={availableThemesMap}
                        onChange={onChangeTheme}
                        defaultMenuIconSrc={themeIcon}
                        submenuLabel={{
                            defaultMessage: 'Theme',
                            description: 'Theme sub-menu',
                            id: 'gui.menuBar.theme'
                        }}
                        selectedItemKey={activeTheme}
                        isRtl={isRtl}
                        depth={depth + 1}
                    />}
                {canChangeColorMode && <PreferenceMenu
                    itemsMap={enabledColorModesMap}
                    onChange={onChangeColorMode}
                    submenuLabel={{
                        defaultMessage: 'Color Mode',
                        description: 'Color mode sub-menu',
                        id: 'gui.menuBar.colorMode'
                    }}
                    selectedItemKey={activeColorMode}
                    isRtl={isRtl}
                    depth={depth + 1}
                />}
                {isAndroidStageDragAvailable() && <MenuItem
                    isDataMenuItem
                    ariaRole="menuitemcheckbox"
                    aria-checked={Boolean(preventStageDrag)}
                    onClick={handleTogglePreventStageDrag}
                    onParentKeyDown={handleKeyDown}
                >
                    <div className={styles.option}>
                        <img
                            className={classNames(styles.check, {[styles.selected]: preventStageDrag})}
                            src={check}
                            alt=""
                        />
                        <FormattedMessage
                            id="gui.menuBar.preventStageDrag"
                            defaultMessage="Prevent dragging sprites while playing"
                            description="Android touch setting to lock sprite dragging from green flag until stop"
                        />
                    </div>
                </MenuItem>}
            </MenuSection>
        </MenuBarMenu>
    </button>);
};

SettingsMenu.propTypes = {
    preventStageDrag: PropTypes.bool,
    onChangePreventStageDrag: PropTypes.func,
    canChangeColorMode: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    hasActiveMembership: PropTypes.bool,
    isRtl: PropTypes.bool,
    activeColorMode: PropTypes.string,
    onChangeColorMode: PropTypes.func,
    activeTheme: PropTypes.string,
    onChangeTheme: PropTypes.func,
    depth: PropTypes.number
};

const mapStateToProps = state => ({
    preventStageDrag: state.scratchGui.settings.preventStageDrag,
    activeColorMode: state.scratchGui.settings.colorMode,
    activeTheme: state.scratchGui.settings.theme,
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = dispatch => ({
    onChangePreventStageDrag: enabled => {
        dispatch(setPreventStageDrag(enabled));
        persistPreventStageDrag(enabled);
    },
    onChangeColorMode: colorMode => {
        dispatch(setColorMode(colorMode));
        persistColorMode(colorMode);
    },
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        persistTheme(theme);
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SettingsMenu);
