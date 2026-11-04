export const MINIMUM_BUILD_TIME = 5000;

export const waitForMinimumBuildTime = (started, signal, now = () => performance.now(), timers = globalThis) => {
  if (signal.aborted) return Promise.reject(new DOMException('Cancelled', 'AbortError'));
  const remaining = Math.max(0, MINIMUM_BUILD_TIME - (now() - started));
  if (!remaining) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cancel = () => {
      timers.clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = timers.setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, remaining);
    signal.addEventListener('abort', cancel, {once: true});
  });
};
