// TODO add methods to enable/disable it, eg when game paused or over
if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
    const getWakeLock = () => navigator.wakeLock.request('screen');
    getWakeLock();

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            getWakeLock();
        }
    });
}