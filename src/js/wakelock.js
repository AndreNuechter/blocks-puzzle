// TODO add methods to enable/disable it, eg when game paused or over
if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
    const getWakeLock = () => navigator.wakeLock.request('screen');
    // TODO do we actually need to wait here or below?
    await getWakeLock();

    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            await getWakeLock();
        }
    });
}