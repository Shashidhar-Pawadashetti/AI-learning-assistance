const CACHE_NAME = 'study-buddy-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/main.jsx',
    '/src/App.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
