/*
 * Service worker de la page ange gardien (/ange/<jeton>) : notifications SANS contenu.
 * Le serveur n'envoie aucune donnée (ni prénom, ni lieu, ni position) : le texte affiché est neutre
 * et l'ouverture affiche la page à jour.
 */
self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification('Blowy · ange gardien', {
      body: 'Nouvelle information sur la sortie que tu suis. Ouvre la page.',
      tag: 'blowy-ange',
      renotify: true,
      requireInteraction: true,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if (c.url.startsWith(url) && 'focus' in c) return c.focus();
      return self.clients.openWindow(url);
    }),
  );
});
