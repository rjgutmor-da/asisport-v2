// Service Worker - Actualizar CACHE_NAME al hacer cambios para forzar refresh en móviles
const CACHE_NAME = 'asisport-v3';

self.addEventListener('install', (event) => {
    // Activar inmediatamente sin esperar a que se cierre la pestaña
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Eliminar cachés viejos al activar la nueva versión
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // No interceptar peticiones a Supabase o externas (Auth, DB, etc)
    if (event.request.url.includes('supabase.co') || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Estrategia: Siempre red primero (Network First)
    event.respondWith(
        fetch(event.request).catch(async (error) => {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) return cachedResponse;
            // Si no hay red ni caché, lanzamos el error original para que el navegador lo maneje
            throw error;
        })
    );
});
