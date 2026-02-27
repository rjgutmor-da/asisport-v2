// Service Worker - Actualizar CACHE_NAME al hacer cambios para forzar refresh en móviles
const CACHE_NAME = 'asisport-v2';

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
    // Estrategia: Siempre red primero (Network First) para garantizar contenido fresco
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
