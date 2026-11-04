import React, {useCallback, useState} from 'react';
import PackagerModal from '../packager-modal/packager-modal.jsx';
import {DARK_MODE} from '../../lib/settings/color-mode';
import {getIsShowingProject, saveProjectAsCopy} from '../../reducers/project-state';
import styles from './menu-bar.css';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import fileIcon from './icon--file.svg';
import {useIntl, FormattedMessage, defineMessage} from 'react-intl';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuItem, MenuSection} from '../menu/menu.jsx';
import SB3Downloader from '../../containers/sb3-downloader.jsx';
import dropdownCaret from './dropdown-caret.svg';
import useMenuNavigation from '../../hooks/use-menu-navigation';

import sharedMessages from '../../lib/shared-messages';


const fileMenu = defineMessage({
    id: 'gui.aria.fileMenu',
    defaultMessage: 'File menu',
    description: 'accessibility label for file menu'
});

const FileMenu = ({
    isRtl,
    canSave,
    canCreateCopy,
    canRemix,
    onClickNew,
    onClickSave,
    onClickSaveAsCopy,
    onClickRemix,
    onStartSelectingFileUpload,
    getSaveToComputerHandler,
    remixMessage,
    depth,
    vm,
    title,
    dark,
    ready
}) => {
    const intl = useIntl();
    const [packagerOpen, setPackagerOpen] = useState(false);

    const {
        menuRef,
        isExpanded,
        handleKeyDown,
        handleKeyDownOpenMenu,
        handleOnOpen,
        handleOnClose
    } = useMenuNavigation({
        depth,
        isRtl
    });

    const openPackager = useCallback(() => {
        if (!ready) return;
        handleOnClose();
        setPackagerOpen(true);
    }, [ready, handleOnClose]);
    const closePackager = useCallback(() => setPackagerOpen(false), []);

    const saveNowMessage = (
        <FormattedMessage
            defaultMessage="Save now"
            description="Menu bar item for saving now"
            id="gui.menuBar.saveNow"
        />
    );
    const createCopyMessage = (
        <FormattedMessage
            defaultMessage="Save as a copy"
            description="Menu bar item for saving as a copy"
            id="gui.menuBar.saveAsCopy"
        />
    );
    const newProjectMessage = (
        <FormattedMessage
            defaultMessage="New"
            description="Menu bar item for creating a new project"
            id="gui.menuBar.new"
        />
    );

    return (
        <React.Fragment>
            <button
                className={classNames(styles.menuBarItem, styles.hoverable, {
                    [styles.active]: isExpanded()
                })}
                onClick={handleOnOpen}
                aria-label={intl.formatMessage(fileMenu)}
                aria-expanded={isExpanded()}
                ref={menuRef}
                onKeyDown={handleKeyDown}
            >
                <img src={fileIcon} />
                <span className={styles.collapsibleLabel}>
                    <FormattedMessage
                        defaultMessage="File"
                        description="Text for file dropdown menu"
                        id="gui.menuBar.file"
                    />
                </span>
                <img src={dropdownCaret} />
                <MenuBarMenu
                    className={classNames(styles.menuBarMenu)}
                    open={isExpanded()}
                    place={isRtl ? 'left' : 'right'}
                    onRequestClose={handleOnClose}
                >
                    <MenuSection>
                        <MenuItem
                            onClick={onClickNew}
                            isDataMenuItem
                            onParentKeyDown={handleKeyDownOpenMenu}
                        >
                            {newProjectMessage}
                        </MenuItem>
                    </MenuSection>
                    {(canSave || canCreateCopy || canRemix) && (
                        <MenuSection>
                            {canSave && (
                                <MenuItem
                                    onClick={onClickSave}
                                    isDataMenuItem
                                    onParentKeyDown={handleKeyDownOpenMenu}
                                >
                                    {saveNowMessage}
                                </MenuItem>
                            )}
                            {canCreateCopy && (
                                <MenuItem
                                    onClick={onClickSaveAsCopy}
                                    isDataMenuItem
                                    onParentKeyDown={handleKeyDownOpenMenu}
                                >
                                    {createCopyMessage}
                                </MenuItem>
                            )}
                            {canRemix && (
                                <MenuItem
                                    onClick={onClickRemix}
                                    isDataMenuItem
                                    onParentKeyDown={handleKeyDownOpenMenu}
                                >
                                    {remixMessage}
                                </MenuItem>
                            )}
                        </MenuSection>
                    )}
                    <MenuSection>
                        <MenuItem
                            onClick={onStartSelectingFileUpload}
                            isDataMenuItem
                            onParentKeyDown={handleKeyDownOpenMenu}
                        >
                            {intl.formatMessage(sharedMessages.loadFromComputerTitle)}
                        </MenuItem>
                        <SB3Downloader>{(className, downloadProjectCallback) => (
                            <MenuItem
                                className={className}
                                onClick={getSaveToComputerHandler(downloadProjectCallback)}
                                isDataMenuItem
                                onParentKeyDown={handleKeyDownOpenMenu}
                            >
                                <FormattedMessage
                                    defaultMessage="Save to your computer"
                                    description="Menu bar item for downloading a project to your computer" // eslint-disable-line @stylistic/max-len
                                    id="gui.menuBar.downloadToComputer"
                                />
                            </MenuItem>
                        )}</SB3Downloader>
                    </MenuSection>
                    <MenuSection>
                        <MenuItem
                            onClick={openPackager}
                            isDisabled={!ready}
                            isDataMenuItem
                            onParentKeyDown={handleKeyDownOpenMenu}
                        >
                            <FormattedMessage
                                id="gui.menuBar.package"
                                defaultMessage="Package project"
                            />
                        </MenuItem>
                    </MenuSection>
                </MenuBarMenu>
            </button>
            {packagerOpen && <PackagerModal
                vm={vm}
                title={title}
                dark={dark}
                onClose={closePackager}
            />}
        </React.Fragment>
    );
};

FileMenu.propTypes = {
    isRtl: PropTypes.bool,
    canSave: PropTypes.bool.isRequired,
    canCreateCopy: PropTypes.bool.isRequired,
    canRemix: PropTypes.bool.isRequired,
    onStartSelectingFileUpload: PropTypes.func.isRequired,
    onClickSave: PropTypes.func,
    onClickSaveAsCopy: PropTypes.func,
    onClickRemix: PropTypes.func,
    onClickNew: PropTypes.func.isRequired,
    getSaveToComputerHandler: PropTypes.func.isRequired,
    remixMessage: PropTypes.node,
    depth: PropTypes.number,
    vm: PropTypes.shape({saveProjectSb3: PropTypes.func}),
    title: PropTypes.string,
    dark: PropTypes.bool,
    ready: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    vm: state.scratchGui.vm,
    title: state.scratchGui.projectTitle,
    dark: state.scratchGui.settings.colorMode === DARK_MODE,
    ready: getIsShowingProject(state.scratchGui.projectState.loadingState)
});

const mapDispatchToProps = dispatch => ({
    onClickSaveAsCopy: () => dispatch(saveProjectAsCopy())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FileMenu);
