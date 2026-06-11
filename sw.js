const CACHE_NAME = 'nextgen-dls-v3'; // ভার্সন পরিবর্তন করা হয়েছে যাতে পুরানো ছবি ডিলিট হয়

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

// পুরানো ক্যাশ অটোমেটিক ক্লিয়ার করার কোড
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    // ক্যাশের নাম বর্তমান নামের (v3) সাথে না মিললে ডিলিট করে দেবে
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // ১. HTML পেজ: সব সময় আগে ইন্টারনেট থেকে আনবে, না পেলে ক্যাশ থেকে (যাতে লাইভ আপডেট মিস না হয়)
    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // ২. বাকি সব (ছবি, CSS, JS): আগে ক্যাশ থেকে খুঁজবে, না পেলে ইন্টারনেট থেকে আনবে
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // ক্যাশে থাকলে চোখের পলকে দেখিয়ে দেবে
            }
            return fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    // নতুন কিছু পেলে সেটা ক্যাশে সেভ করে রাখবে ভবিষ্যতের জন্য
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => console.log('Offline mode active'));
        })
    );
});
