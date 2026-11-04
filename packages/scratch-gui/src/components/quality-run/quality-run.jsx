import React, {useCallback, useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl} from 'react-intl';
import log from '../../lib/log';
import intlShape from '../../lib/intlShape.js';
import Modal from '../modal/modal.jsx';
import PackagerPlayer from './packager-player.jsx';
import {exportPackagedFile, isPackagerMessage} from '../../lib/quality-run-export.js';
import styles from './quality-run.css';

const messages = defineMessages({
    title: {id: 'gui.qualityRun.title', defaultMessage: 'Run with high quality'},
    // eslint-disable-next-line @stylistic/max-len
    preparing: {id: 'gui.qualityRun.preparing', defaultMessage: 'Preparing your project for high-quality playback…'},
    // eslint-disable-next-line @stylistic/max-len
    failed: {id: 'gui.qualityRun.failed', defaultMessage: 'The project could not be prepared. Close this window and try again.'}
});

export const QualityRunModal = ({vm, title, intl, onClose}) => {
    const frame = useRef(null);
    const [prepared, setPrepared] = useState(false);
    const [result, setResult] = useState(null);
    const [failed, setFailed] = useState(false);
    const snapshot = useRef(null);
    const messageOrigin = location.protocol === 'file:' ? 'null' : location.origin;
    const params = new URLSearchParams({import_from: messageOrigin, locale: intl.locale, autobuild: 'high'});
    const source = useRef(new URL(`quality-packager/index.html?${params}`, document.baseURI).href);
    useEffect(() => {
        let closed = false;
        const controller = new AbortController();
        const receive = async event => {
            if (closed || !isPackagerMessage(event, frame.current, messageOrigin)) return;
            const data = event.data.p4;
            if (data.type === 'ready-for-import' && snapshot.current) {
                const buffer = snapshot.current;
                snapshot.current = null;
                const targetOrigin = location.protocol === 'file:' ? '*' : event.origin;
                event.source.postMessage({p4: {type: 'configure', locale: intl.locale}}, targetOrigin);
                event.source.postMessage({p4: {type: 'start-import'}}, targetOrigin);
                event.source.postMessage({p4: {type: 'finish-import', name: `${title || 'Project'}.sb3`, data: buffer}},
                    targetOrigin, [buffer]);
            } else if (data.type === 'build-error') {
                setFailed(true);
                setPrepared(false);
            } else if (data.type === 'export-ready' && data.blob instanceof Blob && /\.html$/i.test(data.name)) {
                // Unmount the builder before starting the independent player.
                setPrepared(false);
                if (window.AndroidPackagedExport || window.AndroidProjectSaver) {
                    try {
                        await exportPackagedFile(data.blob, data.name, 'preview', intl.locale,
                            {signal: controller.signal});
                        if (!closed) onClose();
                    } catch (error) {
                        if (closed) return;
                        log.error('QualityRunModal: Android playback failed', error);
                        setFailed(true);
                    }
                } else {
                    setResult({blob: data.blob, name: data.name});
                }
            }
        };
        window.addEventListener('message', receive);
        (async () => {
            try {
                const blob = await vm.saveProjectSb3();
                const buffer = await blob.arrayBuffer();
                if (closed) return;
                snapshot.current = buffer;
                setPrepared(true);
            } catch (error) {
                if (closed) return;
                log.error('QualityRunModal: snapshot failed', error);
                setFailed(true);
            }
        })();
        return () => {
            closed = true;
            controller.abort();
            snapshot.current = null;
            window.removeEventListener('message', receive);
        };
    }, []);
    return (
        <Modal
            className={result ? styles.playerModal : styles.modalContent}
            headerClassName={result ? styles.hidden : null}
            fullScreen={Boolean(result)}
            contentLabel={intl.formatMessage(messages.title)}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            isRtl={intl.locale !== 'en'}
            id="qualityRun"
        >
            <div className={styles.body}>
                {result ? <PackagerPlayer
                    blob={result.blob}
                    name={result.name}
                    onClose={onClose}
                /> : <div className={styles.loading}>
                    {!failed && <div className={styles.spinner} />}
                    <p role={failed ? 'alert' : 'status'}>
                        {intl.formatMessage(failed ? messages.failed : messages.preparing)}
                    </p>
                </div>}
                {prepared && <iframe
                    ref={frame}
                    title={intl.formatMessage(messages.title)}
                    src={source.current}
                    className={styles.hidden}
                />}
            </div>
        </Modal>
    );
};
QualityRunModal.propTypes = {
    vm: PropTypes.shape({saveProjectSb3: PropTypes.func.isRequired}).isRequired,
    title: PropTypes.string,
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired
};

export const QualityRunButton = ({vm, title, intl, disabled}) => {
    const [open, setOpen] = useState(false);
    const show = useCallback(() => setOpen(true), []);
    const close = useCallback(() => setOpen(false), []);
    return (
        <React.Fragment>
            <button
                className={styles.launch}
                type="button"
                disabled={disabled}
                onClick={show}
            >
                {intl.formatMessage(messages.title)}
            </button>
            {open && <QualityRunModal
                vm={vm}
                title={title}
                intl={intl}
                onClose={close}
            />}
        </React.Fragment>
    );
};
QualityRunButton.propTypes = {
    vm: QualityRunModal.propTypes.vm,
    title: PropTypes.string,
    intl: intlShape.isRequired,
    disabled: PropTypes.bool
};
export default injectIntl(QualityRunButton);
