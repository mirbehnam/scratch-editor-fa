import React, {useCallback, useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl} from 'react-intl';
import intlShape from '../../lib/intlShape.js';
import log from '../../lib/log';
import Modal from '../modal/modal.jsx';
import {createPackagerSnapshot, clearPackagerSnapshot} from '../../lib/packager-snapshot.js';
import {exportPackagedFile, isPackagerMessage} from '../../lib/quality-run-export.js';
import styles from '../quality-run/quality-run.css';
import PackagerPlayer from '../quality-run/packager-player.jsx';

const messages = defineMessages({
    title: {id: 'gui.packager.title', defaultMessage: 'Package project'},
    preparing: {id: 'gui.packager.preparing', defaultMessage: 'Saving a temporary copy of the current project…'},
    ready: {id: 'gui.packager.ready', defaultMessage: 'HTML file is ready'},
    save: {id: 'gui.packager.save', defaultMessage: 'Save'},
    share: {id: 'gui.packager.share', defaultMessage: 'Share'},
    run: {id: 'gui.packager.run', defaultMessage: 'Run directly'},
    working: {id: 'gui.packager.working', defaultMessage: 'Please wait…'},
    saved: {id: 'gui.packager.saved', defaultMessage: 'Saved to Downloads: {name}'},
    stored: {id: 'gui.packager.stored', defaultMessage: 'Saved in My Projects: {name}'},
    downloading: {id: 'gui.packager.downloading', defaultMessage: 'Download requested: {name}'},
    shared: {id: 'gui.packager.shared', defaultMessage: 'The sharing window was opened.'},

    explanation: {
        id: 'gui.packager.explanation',
        defaultMessage: 'When you export as html, your game runs much more smoothly and faster 😍 ' +
            'and you can easily share it with your friends.'
    },

    engine: {
        id: 'gui.packager.engine',
        defaultMessage: 'Please note that html files can no longer be edited in Scratch ' +
            'and are only suitable for running.'
    },

    failed: {
        id: 'gui.packager.failed',
        defaultMessage: 'The operation could not be completed. Your project has not been changed; please try again.'
    }
});

const PackagerModal = ({intl, vm, title, dark, onClose}) => {
    const frame = useRef(null);
    const snapshot = useRef(null);
    const session = useRef(`${Date.now()}-${Math.random()}`);
    const [prepared, setPrepared] = useState(false);
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState(false);
    const [playing, setPlaying] = useState(false);
    const format = (message, values) => intl.formatMessage(message, values);
    const messageOrigin = location.protocol === 'file:' ? 'null' : location.origin;
    const messageTarget = location.protocol === 'file:' ? '*' : messageOrigin;
    const configure = () => {
        if (frame.current) {
            frame.current.contentWindow.postMessage({p4: {
                type: 'configure',
                locale: intl.locale,
                theme: dark ? 'dark' : 'light',
                accent: '#855cd6'
            }}, messageTarget);
        }
    };
    useEffect(() => {
        let closed = false;
        const controller = new AbortController();
        createPackagerSnapshot(vm, title, session.current, controller.signal).then(value => {
            if (!closed) {
                snapshot.current = value;
                setPrepared(true);
            }
        })
            .catch(err => {
                if (closed) return;
                log.error('Packager snapshot failed:', err);
                if (!closed) setError(true);
            });
        return () => {
            closed = true;
            controller.abort();
            clearPackagerSnapshot(session.current).catch(err => log.warn('Packager snapshot cleanup failed:', err));
        };
    }, []);
    useEffect(() => {
        configure();
    }, [intl.locale, dark]);
    useEffect(() => {
        const receive = event => {
            if (!isPackagerMessage(event, frame.current, messageOrigin)) return;
            const data = event.data.p4;
            if (data.type === 'ready-for-import' && snapshot.current) {
                configure();
                const {buffer, name} = snapshot.current;
                snapshot.current = null;
                event.source.postMessage({p4: {type: 'start-import'}}, messageTarget);
                event.source.postMessage({p4: {type: 'finish-import', name, data: buffer}}, messageTarget, [buffer]);
            } else if (data.type === 'export-ready' && data.blob instanceof Blob && /\.html$/i.test(data.name)) {
                setResult({blob: data.blob, name: data.name});
                setError(false);
                setStatus('');
            } else if (data.type === 'settings-export' && data.blob instanceof Blob) {
                exportPackagedFile(data.blob, data.name, 'save', intl.locale).catch(err => {
                    log.error('Packager settings export failed:', err);
                    setError(true);
                });
            }
        };
        window.addEventListener('message', receive);
        return () => window.removeEventListener('message', receive);
    }, [intl.locale, dark]);
    const perform = async action => {
        setBusy(true);
        setError(false);
        setStatus('');
        try {
            const response = await exportPackagedFile(result.blob, result.name, action, intl.locale);
            const message = action === 'share' ? messages.shared :
                (response.location === 'library' ? messages.stored :
                    (response.downloadStarted ? messages.downloading : messages.saved));
            setStatus(format(message, {name: response.name || result.name}));
        } catch (err) {
            if (err.name !== 'AbortError') {
                log.error('Packager file action failed:', action, err);
                setError(true);
            }
        } finally {
            setBusy(false);
        }
    };
    const save = useCallback(() => perform('save'), [result, intl.locale]);
    const share = useCallback(() => perform('share'), [result, intl.locale]);
    const play = useCallback(async () => {
        if (!window.AndroidProjectSaver && !window.AndroidPackagedExport) {
            setPlaying(true);
            return;
        }
        setBusy(true);
        setError(false);
        try {
            await exportPackagedFile(result.blob, result.name, 'preview', intl.locale, {dark: dark});
        } catch (err) {
            log.error('Packager Android direct play failed:', err);
            setError(true);
        } finally {
            setBusy(false);
        }
    }, [result, intl.locale, dark]);
    const closePlayer = useCallback(() => setPlaying(false), []);
    const params = new URLSearchParams({import_from: messageOrigin,
        locale: intl.locale,
        theme: dark ? 'dark' : 'light'});
    const source = useRef(new URL(`quality-packager/index.html?${params}`, document.baseURI).href);
    return (
        <Modal
            className={playing ? styles.playerModal : styles.modalContent}
            headerClassName={playing ? styles.hidden : null}
            fullScreen={playing}
            contentLabel={format(result ? messages.ready : messages.title)}
            onRequestClose={playing ? closePlayer : onClose}
            shouldCloseOnOverlayClick={false}
            isRtl={intl.locale !== 'en'}
            id="embeddedPackager"
        >
            <div className={styles.body}>
                {playing && <PackagerPlayer
                    blob={result.blob}
                    name={result.name}
                    onClose={closePlayer}
                />}
                <div className={playing ? styles.hidden : styles.workspace}>
                    {!prepared && <p className={styles.result}>{format(messages.preparing)}</p>}
                    {prepared && <iframe
                        ref={frame}
                        title={format(messages.title)}
                        src={source.current}
                        className={result ? styles.hidden : styles.frame}
                    />}
                    {result && <div className={styles.result}>
                        <p className={styles.filename}>{result.name}</p>
                        <div className={styles.actions}>
                            <button
                                className={styles.button}
                                disabled={busy}
                                onClick={play}
                            >
                                {format(messages.run)}
                            </button>
                            <button
                                className={styles.button}
                                disabled={busy}
                                onClick={save}
                            >
                                {format(messages.save)}
                            </button>
                            <button
                                className={styles.button}
                                disabled={busy}
                                onClick={share}
                            >
                                {format(messages.share)}
                            </button>
                        </div>
                        <p>{format(messages.explanation)}</p>
                        <p>{format(messages.engine)}</p>
                        {busy && <p role="status">{format(messages.working)}</p>}
                        {status && <p role="status">{status}</p>}
                    </div>}
                    {error && <p
                        className={styles.error}
                        role="alert"
                    >{format(messages.failed)}</p>}
                </div>
            </div>
        </Modal>
    );
};
PackagerModal.propTypes = {
    intl: intlShape.isRequired,
    vm: PropTypes.shape({saveProjectSb3: PropTypes.func.isRequired}).isRequired,
    title: PropTypes.string,
    dark: PropTypes.bool,
    onClose: PropTypes.func.isRequired
};
export default injectIntl(PackagerModal);
