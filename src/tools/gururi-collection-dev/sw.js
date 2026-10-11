const CACHE_NAME = "gururi-collection-shell-v10";
const SHELL_FILES = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest"];

self.addEventListener("install", (event) => {
event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)));
self.skipWaiting();
});

self.addEventListener("activate", (event) => {
event.waitUntil((async () => {
const names = await caches.keys();
await Promise.all(names.filter((name) => name.startsWith("gururi-collection-shell-") && name !== CACHE_NAME).map((name) => caches.delete(name)));
await self.clients.claim();
})());
});

self.addEventListener("fetch", (event) => {
const request = event.request;
if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
const url = new URL(request.url);
const scope = new URL(self.registration.scope);
if (!url.pathname.startsWith(scope.pathname)) return;
if (!SHELL_FILES.some((path) => new URL(path, scope).pathname === url.pathname)) return;
event.respondWith((async () => {
try {
const response = await fetch(request);
if (response.ok) {
const cache = await caches.open(CACHE_NAME);
await cache.put(request, response.clone());
}
return response;
} catch (error) {
const cached = await caches.match(request, {ignoreSearch: true});
if (cached) return cached;
throw error;
}
})());
});
