// TODO add methods to enable/disable it
export default (async () => {
    if ('wakelock' in navigator && 'request' in navigator.wakeLock) {
        const getWakeLock = () => navigator.wakeLock.request('screen');
        // TODO do we actually need to wait here or below?
        await getWakeLock();

        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible') {
                await getWakeLock();
            }
        });
    }
})();