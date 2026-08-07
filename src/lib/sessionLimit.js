const APP = 'asisport';
const DEVICE_ID_KEY = 'asisport-device-id';

const getDeviceId = () => {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const generated = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
};

const getDeviceLabel = () => {
    const browser = navigator.userAgent.includes('Edg') ? 'Edge'
        : navigator.userAgent.includes('Chrome') ? 'Chrome'
            : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Navegador';
    const platform = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'móvil' : 'computadora';
    return `${browser} · ${platform}`;
};

export const registerCurrentAsiSportSession = async (session) => {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-gate`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ application: APP, deviceId: getDeviceId(), deviceLabel: getDeviceLabel() }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.reason === 'session_revoked'
            ? 'Esta sesión de AsiSport ya no está activa en este dispositivo.'
            : payload?.reason === 'application_not_allowed'
                ? 'Tu rol no tiene acceso a AsiSport.'
                : payload?.error || 'No se pudo validar la sesión de AsiSport.');
    }
};

export const getAsiSportLoginPayload = () => ({
    application: APP,
    deviceId: getDeviceId(),
    deviceLabel: getDeviceLabel(),
});
