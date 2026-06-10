const CACHE_NAME = 'nextgen-dls-v2';

// যে ফাইলগুলো অ্যাপ ইনস্টলের সাথেই রেডি থাকবে
const CORE_ASSETS = [
    '/',
    '/index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // ১. HTML পেজগুলোর জন্য (যাতে আপনি লাইভ আপডেট দিলে ইউজার সাথে সাথে পায়)
    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // ২. আইকন, ফন্ট এবং ছবির জন্য (ইন্টারনেট ছাড়াই সুপার ফাস্ট লোড হবে)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // ক্যাশে থাকলে চোখের পলকে দেখিয়ে দেবে
            }
            return fetch(event.request).then((networkResponse) => {
                // ক্যাশে না থাকলে একবার ইন্টারনেট থেকে এনে সেভ করে রাখবে
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => console.log('Offline mode active'));
        })
    );
});

