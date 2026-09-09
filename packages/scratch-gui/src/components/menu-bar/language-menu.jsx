import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';
import {useIntl, FormattedMessage, defineMessage} from 'react-intl';
import {connect} from 'react-redux';
import locales from '../../lib/supported-locales';

import check from './check.svg';
import Modal from '../modal/modal.jsx';
import languageIcon from '../language-selector/language-icon.svg';
import {selectLocale} from '../../reducers/locales.js';

import menuBarStyles from './menu-bar.css';
import styles from './language-menu.css';

const languageMenu = defineMessage({
    id: 'gui.aria.languageMenu',
    defaultMessage: 'Language menu',
    description: 'accessibility label for language menu'
});

const LanguageMenu = ({
    currentLocale,
    isRtl,
    onChangeLanguage
}) => {
    const intl = useIntl();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
    }, []);
    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);
    const handleChangeLanguage = useCallback(locale => {
        setIsOpen(false);
        onChangeLanguage(locale);
    }, [onChangeLanguage]);

    return (
        <React.Fragment>
            <button
                aria-label={intl.formatMessage(languageMenu)}
                className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
                onClick={handleOpen}
            >
                <img
                    className={styles.languageIcon}
                    src={languageIcon}
                />
                <span className={menuBarStyles.collapsibleLabel}>
                    <FormattedMessage
                        defaultMessage="Language"
                        description="Button to open the language dialog"
                        id="gui.menuBar.language"
                    />
                </span>
            </button>
            {isOpen && <Modal
                className={styles.languageDialog}
                contentLabel={intl.formatMessage({
                    id: 'gui.menuBar.language',
                    defaultMessage: 'Language'
                })}
                isRtl={isRtl}
                onRequestClose={handleClose}
            >
                <div className={styles.languageList}>
                    {Object.keys(locales).map(locale => {
                        const isSelected = currentLocale === locale;
                        return (<button
                            key={locale}
                            aria-pressed={isSelected}
                            className={classNames(styles.languageOption, {
                                [styles.selectedOption]: isSelected
                            })}
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => handleChangeLanguage(locale)}
                        >
                            <img
                                aria-hidden
                                className={classNames(styles.check, {
                                    [styles.selectedCheck]: isSelected
                                })}
                                src={check}
                            />
                            <span>{locales[locale].name}</span>
                        </button>);
                    })}
                </div>
            </Modal>}
        </React.Fragment>
    );
};

LanguageMenu.propTypes = {
    currentLocale: PropTypes.string,
    isRtl: PropTypes.bool,
    onChangeLanguage: PropTypes.func
};

const mapStateToProps = state => ({
    currentLocale: state.locales.locale,
    isRtl: state.locales.isRtl,
    messagesByLocale: state.locales.messagesByLocale
});

const mapDispatchToProps = dispatch => ({
    onChangeLanguage: locale => {
        dispatch(selectLocale(locale));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LanguageMenu);
