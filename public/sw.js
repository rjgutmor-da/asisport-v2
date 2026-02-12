// Service Worker mínimo para cumplir con los requisitos de PWA (Instalación)
const CACHE_NAME = 'asisport-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Estrategia: Solo red por ahora (o lo que decida el navegador)
    // Esto es solo para que Chrome detecte que hay un SW
});
