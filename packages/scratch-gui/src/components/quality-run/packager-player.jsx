import React, {useCallback, useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl} from 'react-intl';
import intlShape from '../../lib/intlShape.js';
import styles from './quality-run.css';

const messages = defineMessages({
    running: {id: 'gui.qualityRun.running', defaultMessage: 'Direct play'},
    close: {id: 'gui.qualityRun.closePlayer', defaultMessage: 'Close'},
    refresh: {id: 'gui.qualityRun.refreshPlayer', defaultMessage: 'Refresh'}
});

const PackagerPlayer = ({blob, name, intl, onClose}) => {
    const [url, setUrl] = useState(null);
    const [revision, setRevision] = useState(0);
    const frame = useRef(null);
    useEffect(() => {
        const source = URL.createObjectURL(blob);
        setUrl(source);
        return () => URL.revokeObjectURL(source);
    }, [blob]);
    const refresh = useCallback(() => setRevision(value => value + 1), []);
    const focus = useCallback(() => frame.current.focus(), []);
    return (
        <div className={styles.player}>
            <div className={styles.playerToolbar}>
                <button
                    className={styles.playerButton}
                    type="button"
                    onClick={refresh}
                    aria-label={intl.formatMessage(messages.refresh)}
                    title={intl.formatMessage(messages.refresh)}
                >
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M20 7v5h-5M20 12a8 8 0 1 0-2 5M20 12l-4-5" />
                    </svg>
                </button>
                <button
                    className={styles.playerButton}
                    type="button"
                    onClick={onClose}
                    aria-label={intl.formatMessage(messages.close)}
                    title={intl.formatMessage(messages.close)}
                >
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                </button>
            </div>
            {url && <iframe
                key={revision}
                ref={frame}
                className={styles.playerFrame}
                title={`${intl.formatMessage(messages.running)}: ${name}`}
                src={url}
                sandbox="allow-scripts allow-downloads allow-forms allow-modals allow-pointer-lock"
                allow="autoplay; fullscreen; gamepad"
                allowFullScreen
                onLoad={focus}
            />}
        </div>
    );
};

PackagerPlayer.propTypes = {
    blob: PropTypes.instanceOf(Blob).isRequired,
    name: PropTypes.string.isRequired,
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired
};

export default injectIntl(PackagerPlayer);
