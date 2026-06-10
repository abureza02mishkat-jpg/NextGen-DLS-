const CACHE_NAME = 'nextgen-dls-cache-v1';

// ইনস্টল ইভেন্ট (Service Worker চালু করা)
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('Service Worker Installed');
});

// ফেচ ইভেন্ট (অফলাইনে বা ফাস্ট লোড করার জন্য ক্যাশ থেকে ডাটা দেওয়া)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // যদি আগে থেকে ফোনে সেভ থাকে, তবে সেটা সাথে সাথে দেখাবে
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // ইন্টারনেট থাকলে নতুন ডাটা এনে আবার ক্যাশে সেভ করে রাখবে
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // ইন্টারনেট না থাকলে কোনো এরর দেখাবে না
                console.log('Offline mode active');
            });
            // ক্যাশ থাকলে ক্যাশ দেবে, না থাকলে ইন্টারনেট থেকে আনবে
            return cachedResponse || fetchPromise;
        })
    );
});
