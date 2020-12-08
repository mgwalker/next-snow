/* eslint-disable no-restricted-globals */
// "self" is defined for service workers, but eslint doesn't recognize that's
// what this file is. There's a service worker environment configuration for
// eslint, but it also doesn't permit "self", so just disable the rule entirely
// for now.

const ZIP_CACHE = "zip-to-coords-cache-2013";

self.addEventListener("install", async () => {
  const cache = await caches.open(ZIP_CACHE);
  await cache.add("zips.json");
});

const fetchHandler = async (event) => {
  const response = await caches.match(event.request);
  if (response) {
    return response;
  }
  return fetch(event.request);
};

self.addEventListener("fetch", (event) => {
  event.respondWith(fetchHandler(event));
});
