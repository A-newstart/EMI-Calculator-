const CACHE_NAME = "site-cache-v3";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html"  // ✅ Make sure this exists
];

// Install Event - Cache Files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate Event - Clear Old Cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch Event - Serve Cached Files & Handle Offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // ✅ Network available → Cache the response
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // ❌ Network failed → Return cached page or offline.html
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match("/offline.html");
        });
      })
  );
});
