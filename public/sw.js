// Service Worker - Actualizar CACHE_NAME al hacer cambios para forzar refresh en móviles
const CACHE_NAME = 'asisport-v4';
const IMAGE_CACHE_NAME = 'sasport-images-v1';
const MAX_IMAGE_ENTRIES = 500;

// Limitar el tamaño del caché de imágenes
async function limitCacheSize(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        if (keys.length > maxItems) {
            for (let i = 0; i < keys.length - maxItems; i++) {
                await cache.delete(keys[i]);
            }
        }
    } catch (e) {
        console.error('Error al limitar tamaño de caché:', e);
    }
}

self.addEventListener('install', (event) => {
    // Activar inmediatamente sin esperar a que se cierre la pestaña
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Eliminar cachés viejos al activar la nueva versión, preservando el de imágenes
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Estrategia Cache-First para imágenes del bucket de Supabase
    if (url.includes('supabase.co/storage/v1/object/public/avatars/')) {
        event.respondWith(
            caches.match(event.request).then(async (cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && networkResponse.status === 200) {
                        const cache = await caches.open(IMAGE_CACHE_NAME);
                        await cache.put(event.request, networkResponse.clone());
                        limitCacheSize(IMAGE_CACHE_NAME, MAX_IMAGE_ENTRIES);
                    }
                    return networkResponse;
                } catch (error) {
                    throw error;
                }
            })
        );
        return;
    }

    // No interceptar otras peticiones a Supabase o externas (Auth, DB, etc)
    if (url.includes('supabase.co') || !url.startsWith(self.location.origin)) {
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
