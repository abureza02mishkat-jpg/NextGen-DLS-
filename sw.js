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

    // 🌟 ২. জাদুকরী অংশ: ছবিগুলোকে গিটহাবের বদলে ImageKit থেকে আনা 🌟
    if (event.request.destination === 'image') {
        // ছবিটি যদি বাইরের কোনো লিংকের না হয়ে তোমার ওয়েবসাইটের নিজের হয়
        if (requestUrl.origin === location.origin) {
            // ছবির আসল নাম বের করা (যেমন: /nextgen.jpg থেকে nextgen.jpg)
            let imagePath = requestUrl.pathname.substring(1); 
            
            // ImageKit এর নতুন লিংক বানানো
            let imageKitUrl = 'https://ik.imagekit.io/nextgendls/' + imagePath;

            event.respondWith(
                caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse; // ক্যাশে থাকলে চোখের পলকে দেখিয়ে দেবে
                    }
                    // ক্যাশে না থাকলে ImageKit থেকে আনবে
                    return fetch(imageKitUrl).then((networkResponse) => {
                        // যদি ImageKit এ কোনো সমস্যা হয়, আসল জায়গা (GitHub) থেকে আনবে
                        if (!networkResponse || networkResponse.status !== 200) {
                            return fetch(event.request); 
                        }
                        // ImageKit থেকে ঠিকঠাক পেলে ক্যাশে সেভ করে রাখবে
                        let responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                        return networkResponse;
                    }).catch(() => {
                        // নেটওয়ার্ক সমস্যা হলে আসল লিংক ট্রাই করবে
                        return fetch(event.request);
                    });
                })
            );
            return; // ছবির কাজ এখানেই শেষ, নিচের কোডে যাবে না
        }
    }

    // ৩. বাকি সব ফাইল (ফন্ট, CSS, JS, আইকন) এর জন্য আগের সাধারণ ক্যাশিং
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; 
            }
            return fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => console.log('Offline mode active'));
        })
    );
});
