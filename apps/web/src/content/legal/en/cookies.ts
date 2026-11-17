import type { LegalPage } from '../types';

export const cookies: LegalPage = {
  title: 'Cookies — Minimoa',
  heading: 'Cookies',
  description: 'The minimoa.app website sets no cookies. What it loads from other services, and what those services receive.',
  intro: 'Short version: the minimoa.app website sets no cookies. Here are the details, checked in its code.',
  body: [
    { h2: 'What the website sets', id: 'depose' },
    {
      p: 'The minimoa.app website sets **no cookies** and doesn’t use your browser’s local storage. For the length of your visit only (session storage, cleared when you close the tab), it keeps the code of a link you opened and your quiz result code, to reuse them on the page; none of this is sent to track you. It uses no audience measurement, no advertising and no social media buttons. That is why there is no consent banner.',
    },
    { p: 'This page only covers the website. The Minimoa app is covered by the [privacy policy](@confidentialite).' },

    { h2: 'What the website loads from other services', id: 'tiers' },
    {
      p: 'To display, the website loads a few files from other servers. These services do not set cookies this way, but, like any web server, they receive your IP address and technical information about your browser:',
    },
    {
      table: {
        head: ['Service', 'Why', 'On which pages'],
        rows: [
          ['Website host: {{siteHost.name}}', 'Serving the pages', 'All'],
          ['Minimoa app server (API)', 'Showing the person’s first name and minimoa, saving the words chosen', '“3 words” and invitation pages'],
          ['Minimoa app server (API)', 'Computing and keeping your quiz result, showing a neighbourhood counter, saving your sign-up', '“Which minimoa are you?” and “Open your neighbourhood” pages'],
        ],
      },
    },
    {
      p: 'On “3 words” pages, we keep a non-reversible fingerprint of your IP address and browser to limit duplicate votes (see the [privacy policy](@confidentialite#donnees)).',
    },

    { h2: 'If this changes', id: 'changements' },
    {
      p: 'If the website ever sets cookies that are not strictly necessary (audience measurement, for example), we will ask for your consent first, with a real “reject” button, and this page will be updated.',
    },

    { h2: 'Staying in control', id: 'reglages' },
    {
      p: 'Your browser lets you block or delete cookies and limit requests to other sites. The website’s font (Allo) is served by the website itself: no font is loaded from another service.',
    },
    { p: 'Any question: {{email.privacy}}.' },
  ],
};
