const CACHE_PREFIX =
"gururi-paint-dev-";

const CACHE_VERSION =
"1.3.74";

const CACHE_NAME =
`${CACHE_PREFIX}${CACHE_VERSION}`;

const STATIC_RESOURCES = [
"./",
"./index.html",
"./style.css?v=1.3.74",
"./script.js?v=1.3.74",
"./images/welcome-ja.png",
"./images/welcome-en.png",
"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
"https://cdn.jsdelivr.net/npm/@jaames/iro@5/dist/iro.es.js"
];


self.addEventListener(
"install",
(event) => {

event.waitUntil(
caches.open(
CACHE_NAME
).then(
(cache) => {

return cache.addAll(
STATIC_RESOURCES
);
}
).then(
() => {

return self.skipWaiting();
}
)
);
}
);


self.addEventListener(
"activate",
(event) => {

event.waitUntil(
caches.keys().then(
(cacheNames) => {

return Promise.all(
cacheNames
.filter(
(cacheName) => {

return (
cacheName.startsWith(
CACHE_PREFIX
) &&
cacheName !== CACHE_NAME
);
}
)
.map(
(cacheName) => {

return caches.delete(
cacheName
);
}
)
);
}
).then(
() => {

return self.clients.claim();
}
)
);
}
);


self.addEventListener(
"fetch",
(event) => {

const request =
event.request;

if (request.method !== "GET") {
return;
}

if (request.mode === "navigate") {

event.respondWith(
fetch(
request
).then(
async (response) => {

const cache =
await caches.open(
CACHE_NAME
);

await cache.put(
"./index.html",
response.clone()
);

return response;
}
).catch(
async () => {

return (
await caches.match(
"./index.html"
)
) || Response.error();
}
)
);

return;
}

event.respondWith(
caches.match(
request
).then(
(cachedResponse) => {

if (cachedResponse) {
return cachedResponse;
}

return fetch(
request
).then(
(response) => {

if (response.ok) {

const responseForCache =
response.clone();

caches.open(
CACHE_NAME
).then(
(cache) => {

return cache.put(
request,
responseForCache
);
}
).catch(
() => {
}
);
}

return response;
}
).catch(
() => {

return Response.error();
}
);
}
)
);
}
);