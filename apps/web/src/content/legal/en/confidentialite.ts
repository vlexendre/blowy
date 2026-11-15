import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Privacy policy — Blowy',
  heading: 'Privacy policy',
  description: 'The data Blowy uses, why, on what legal basis, for how long, who can access it, and how to exercise your rights.',
  intro: 'What we know about you, why, who can access it, how long we keep it, and how to erase it all.',
  summary: {
    title: 'In short',
    items: [
      'We use your data for one thing: bringing your minimoa to life and introducing you to compatible people. **No advertising, no selling.**',
      'What you are looking for and whom you want to meet can reveal your sexual orientation: we ask for your **explicit consent**, and you can withdraw it.',
      'Your **location** is only used while the app is open. On the map it is rounded and shifted, never real-time, and **discreet mode** removes you from the map.',
      'Your **proof photos** are checked by an AI, seen by no human, and deleted within 24 hours (unless you keep them).',
      '**No human reads your conversations.** If you both switch it on, an AI reads your messages so your minimoas can react. Nothing is kept afterwards. The only human exception: a reported message and its immediate context, read by a moderator.',
      'You can change everything in the app and [delete your account](@supprimer-mon-compte) at any time. For anything else: {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Who is responsible', id: 'responsable' },
    {
      p: 'The data controller is **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, which publishes the Blowy app and website ([legal notice](@mentions-legales)).',
    },
    { ul: ['For any question about your data: {{email.privacy}}.', 'Data protection officer: {{dpo.name}}.'] },
    { p: 'This policy covers the Blowy app and the blowy.app website. For the website’s cookies, see the [cookies page](@cookies).' },

    { h2: '2. What we use, and why', id: 'donnees' },
    {
      p: 'For each use: the data involved, the purpose, the legal basis (what allows us to do it under the GDPR), how long we keep it and who can access it. Retention periods are summarised in the [retention table](#durees).',
    },

    { h3: 'Your account' },
    {
      ul: [
        '**Data:** the identifier Apple or Google sends us when you sign in, and the associated email address. With Apple, this may be a relay address that hides your real one.',
        '**Purpose:** create your account, sign you back in, secure access, write to you about your account.',
        '**Legal basis:** performance of the contract.',
        '**Retention:** as long as your account exists.',
        '**Access:** authorised Blowy staff, our authentication host. Apple or Google know you use Blowy, since sign-in goes through them.',
      ],
    },

    { h3: 'Your first name and date of birth' },
    {
      ul: [
        '**Data:** the first name (or nickname) you choose; your date of birth.',
        '**Purpose:** your first name introduces you to others. Your date of birth checks that you are 18 or over, and is used for the age filter in encounters.',
        '**Legal basis:** performance of the contract; for age, also our legitimate interest in protecting minors.',
        '**Retention:** as long as your account exists. If you are under 18, sign-up stops before sign-in and nothing is stored.',
        '**Access:** your first name is visible to people your minimoa introduces you to and to your connections. Your date of birth is not shown to others.',
      ],
    },

    { h3: 'Your gender, what you are looking for, whom you want to meet', id: 'sensibles' },
    {
      ul: [
        '**Data:** your gender (woman, man, non-binary, or “I’d rather not say”); what you are looking for (friends, more, or both); if you are looking for “more”, whom you want to meet (women, men, everyone).',
        '**Why it is sensitive:** together, these answers can reveal your **sexual orientation**, data protected by Article 9 of the GDPR.',
        '**Purpose:** only introduce you to people who are looking for the same thing as you, and who want to meet someone like you.',
        '**Legal basis:** your **explicit consent**, asked at sign-up before you answer. You can withdraw it: change your answers in the app (“I’d rather not say”, “friends” only) or delete your account. Without these answers, we cannot offer you “more” encounters.',
        '**Retention:** as long as your account exists, or until you change your answers.',
        '**Access:** the matching algorithm. These answers are used for filtering: a person introduced to you may infer that you are looking for the same thing. They are never used for advertising or passed on to a third party.',
      ],
    },

    { h3: 'Your location', id: 'localisation' },
    {
      ul: [
        '**Data:** your position, **only while the app is open** (never in the background), and an approximate home area derived from it.',
        '**Purpose:** show you the map and the compatible minimoas around you; offer you nearby encounters; confirm that an outing really happened outside your home area, to raise your minimoa’s sociability.',
        '**What others see:** never your exact position. It is rounded to about 300 m and shifted, never shown in real time. **Discreet mode** removes you from the map completely.',
        '**Legal basis:** your consent, given through your phone’s location permission. You can withdraw it at any time in your phone settings. Without it, there is no map and no nearby encounters (we tell you clearly), but the rest of the app works.',
        '**Retention:** we keep your last rounded position and your approximate home area, replaced at each update. We do not keep a history of your movements.',
        '**Access:** authorised Blowy staff, our host, and the map tile provider, which receives the area shown on screen.',
      ],
    },

    { h3: 'Your vision and compatibility' },
    {
      ul: [
        '**Data:** your answers to the vision test (12 situations), your answers to the daily questions, the habits you choose and those you keep, the way you look after your minimoa (regularity, times, outings), and the 3 words your friends pick for you. From these we derive your “vision” on 5 axes, with a confidence level, and a “style” (sociable, playful, tender, chatty).',
        '**Purpose:** calculate compatibility with other people and introduce you to those who match; explain each encounter; give your minimoa a character. This is **profiling**, explained in detail [below](#compatibilite).',
        '**Legal basis:** performance of the contract (it is the core of the service).',
        '**Retention:** as long as your account exists.',
        '**Access:** the matching algorithm. A person introduced to you sees what you have in common and one difference, never your answers or a bare number.',
      ],
    },
    { p: 'We never ask for your religion, political opinions or health.' },

    { h3: 'Your minimoa, habits and streak' },
    {
      ul: [
        '**Data:** your minimoa’s name and appearance, its gauges (sociability, hunger, energy, mood), the actions you take, your habits and their rhythm, your streak, jokers, items, your weekly review.',
        '**Purpose:** run the game.',
        '**Legal basis:** performance of the contract.',
        '**Retention:** as long as your account exists.',
        '**Access:** you; your connections and the people introduced to you see your minimoa and its style.',
      ],
    },

    { h3: 'Proof photos', id: 'preuves' },
    {
      ul: [
        '**Data:** the photo you take in the app when your minimoa asks for proof of a habit (your trainers, for example). It is taken with the camera, not picked from your gallery.',
        '**Purpose:** check that the habit was kept. An AI answers yes, no or “not sure”, with a sentence. If “not sure”, we trust you.',
        '**Legal basis:** your consent: you choose to take and send the photo.',
        '**Retention:** **deleted within 24 hours**, unless you choose to keep it in your private memories (it stays there until you delete it or your account).',
        '**Access:** **no human sees it.** Only our AI provider receives it, downsized, to analyse it. No one else on Blowy sees it.',
      ],
    },
    { p: 'Avoid photographing other people, documents or sensitive information.' },

    { h3: 'Your messages, and their reading by an AI if you switch it on' },
    {
      ul: [
        '**Data:** the messages you exchange in your connections, their date, and what has been read.',
        '**Purpose:** deliver them to the other person and keep them in your conversation.',
        '**Legal basis:** performance of the contract.',
        '**Retention:** as long as the connection exists. If you leave a connection, the conversation is erased for you. If either of you deletes their account, the connection and its messages disappear for both.',
        '**Access:** you and the other person. A moderator may read a **reported** message and its immediate context (see [reports](#signalements)).',
      ],
    },
    {
      note: '“No human reads your conversations. If you both switch it on, an AI reads your messages so your minimoas can react. Nothing is kept afterwards.”',
    },
    {
      ul: [
        '**Each person’s agreement:** we ask both of you, the first time you open the chat. If one of you says no, no one reads: the minimoas only react to the rhythm of the connection (silences, streaks, challenges).',
        '**Withdrawal:** at any time, in the connection’s options or in **Me**. Reading stops immediately for that connection.',
        '**How:** no analysis on every message. When something triggers it (a silence, a certain number of messages), a short window of the latest messages is sent to our AI provider, which suggests the minimoa’s reaction. At most 3 interventions per day per connection, and you can turn them off for a connection.',
        '**What is kept:** nothing from the analysis. Only the minimoa’s reaction appears in the chat, as a message.',
        '**Legal basis:** the consent of each of you.',
      ],
    },

    { h3: 'A connection’s streak and milestones' },
    {
      ul: [
        '**Data:** the days on which each of you wrote in the connection (not the content of the messages) and the connection’s milestones (meeting, levels reached, streak records). For connections from before 15 November 2026, the photos you had sent each other there, which stay in your memories; we no longer receive new ones.',
        '**Purpose:** run the connection’s streak (the days in a row you both write), its lives and levels, and show you your memories.',
        '**Legal basis:** performance of the contract.',
        '**Retention:** as long as the connection exists (same rules as messages).',
        '**Access:** you and the other person in the connection. Photos are stored in a private space, reachable only through temporary links.',
      ],
    },

    { h3: 'Notifications' },
    {
      ul: [
        '**Data:** your phone’s technical notification token, your settings for each notification type, the time you chose for the daily challenge.',
        '**Purpose:** let you know (daily challenge, new encounter, message, “your turn to write” in the evening, connection or streak at risk, proof requested, weekly review, end-of-trial reminder). Quiet hours from 10 pm to 8 am; apart from messages, 3 a day at most. On iPhone, the widget and Live Activities use the same data.',
        '**Legal basis:** your consent, given through your phone’s permission. You withdraw it in your phone settings or type by type in the app.',
        '**Retention:** until you turn off notifications or delete your account.',
        '**Access:** our notification delivery provider, and Apple or Google, which deliver them to your phone.',
      ],
    },

    { h3: 'Blowy+ purchases' },
    {
      ul: [
        '**Data:** the plan chosen, the purchase, trial and renewal dates, subscription status, transaction identifier. **We never receive your payment details**: Apple or Google bills you.',
        '**Purpose:** unlock Blowy+ features, verify the purchase with the store, manage the trial and its reminder.',
        '**Legal basis:** performance of the contract; accounting obligations for transaction references.',
        '**Retention:** status as long as your account exists; transaction references for as long as our accounting obligations require (10 years at most).',
        '**Access:** authorised Blowy staff; Apple or Google, under their own policies.',
      ],
    },

    { h3: 'Reports, blocks and moderation', id: 'signalements' },
    {
      ul: [
        '**Data:** who reports, who is reported, the connection concerned, the reason, written details; the **reported message and its immediate context**; blocks; moderation decisions and the action log.',
        '**Purpose:** protect people, handle reports (target: within 24 hours), enforce the [rules](@regles), respond to authorities, prevent a blocked person from contacting you.',
        '**Legal basis:** our legal obligations (in particular the Digital Services Act) and our legitimate interest in keeping the community safe.',
        '**Retention:** see the [retention table](#durees).',
        '**Access:** authorised Blowy moderators, and the authorities where the law requires it. The reported person does not know who reported them. A blocked person is not notified.',
      ],
    },

    { h3: 'Statistics and administration' },
    {
      ul: [
        '**Data:** figures calculated from activity: number of accounts, active accounts, retention, subscribers and trials, streaks, minimoa messages, encounters suggested and accepted, AI costs.',
        '**Purpose:** run and improve Blowy, control costs.',
        '**Legal basis:** our legitimate interest.',
        '**How:** these statistics are calculated from our own database, in an internal tool restricted to a few authorised people. There is no audience measurement or advertising tool in the app. The internal tool gives no access to conversations, except to a reported message and its immediate context.',
        '**Retention:** individual data follows the life of your account; aggregated figures, which cannot identify you, may be kept longer.',
      ],
    },

    { h3: 'Technical data' },
    {
      ul: [
        '**Data:** IP address, device model and system, app version, language, error and connection logs.',
        '**Purpose:** run the service, secure it, limit abuse, fix bugs.',
        '**Legal basis:** our legitimate interest; our legal obligations to retain certain connection data.',
        '**Retention:** see the [retention table](#durees).',
        '**Access:** authorised technical staff and our hosts.',
      ],
    },

    { h3: '“3 words” and invitations (people without an account)' },
    {
      ul: [
        '**Data:** when someone opens your “3 words” page or your invitation on the website, we show your first name and your minimoa. For votes, we store the words chosen and a non-reversible fingerprint of the IP address and browser, to limit duplicate votes. No account is required.',
        '**Legal basis:** performance of the contract for you; our legitimate interest in preventing abuse for the fingerprint.',
        '**Retention:** as long as your account exists.',
        '**Access:** you see the words, never who chose them.',
      ],
    },

    { h3: 'When you write to us' },
    {
      ul: [
        '**Data:** your email address, your message, and whatever is needed to handle your request.',
        '**Legal basis:** performance of the contract or our legitimate interest in answering you; legal obligation for requests to exercise your rights.',
        '**Retention:** see the [retention table](#durees).',
      ],
    },

    { h2: '3. How compatibility works', id: 'compatibilite' },
    { p: 'Your minimoa only introduces you to people whose vision of life goes in the same direction as yours. Here is the logic, openly:' },
    {
      ol: [
        '**Your vision** is placed on 5 axes: home (free, solo ↔ start a family), roots (stay here ↔ move away), drive (time for yourself ↔ big projects), pace (calm, at home ↔ intense, out and about), course (day by day ↔ plan everything). Each axis has a confidence level.',
        '**Where it comes from**, with starting weights: sign-up test 40% (then less and less), daily question 20%, habits 25%, how you look after your minimoa 10%, your friends’ 3 words 5%. The more you use Blowy, the higher the confidence.',
        '**Filters**: what each person is looking for, and for “more”, whom they want to meet; 18 and over; area; blocked people.',
        '**The score**: closeness on the 5 axes, weighted by confidence. For “friends”, the home axis counts little; for “more”, it counts double. Style (sociable, playful, tender, chatty) is not part of the score.',
        '**The threshold**: below 70%, no one is suggested, even if that means showing fewer people.',
        '**The explanation**: every encounter says why, with 3 things in common and 1 difference to explore. Never a bare number.',
        '**The number of encounters** also depends on your minimoa’s condition (the more you look after it, the more people it introduces you to) and on your subscription.',
      ],
    },
    { p: 'Your vision is indicative: it is “your vision, for now”. It is not a diagnosis, and we use no medical or psychological vocabulary.' },
    {
      p: '**No decision producing legal effects** concerning you, or similarly significantly affecting you, is made by this calculation. It only decides whom your minimoa introduces you to; you always choose whether to wave, accept or ignore. You can ask us for explanations, challenge a result or object to this processing by writing to {{email.privacy}}; in the latter case, we will no longer be able to introduce you to anyone.',
    },

    { h2: '4. Artificial intelligence', id: 'ia' },
    { p: 'Blowy uses AI in three places, and nowhere else:' },
    {
      table: {
        head: ['Use', 'What the AI receives', 'What is kept'],
        rows: [
          ['Proof photos', 'The photo, downsized', 'The answer (yes, no, not sure). The photo is deleted within 24 hours, unless you keep it.'],
          ['Reading messages (if you both switch it on)', 'A short window of the connection’s latest messages', 'Nothing from the analysis. Only the minimoa’s reaction appears in the chat.'],
          ['Weekly review and minimoa voices', 'A summary of your week’s activity (outings, habits, streak, connections)', 'The review text, in the app.'],
        ],
      },
    },
    {
      p: 'Our AI provider acts as a processor: it processes this data only for us, on our instructions, and not for its own purposes. No Blowy staff member sees this content during analysis. AI answers can be wrong: they have no legal effect, and if a proof is in doubt, we trust you.',
    },

    { h2: '5. What others see', id: 'visibilite' },
    {
      ul: [
        '**People your minimoa introduces you to** see your first name, your minimoa, its style, what you have in common and one difference, and your approximate position on the map (unless you are in discreet mode).',
        '**Your connections** also see your messages, your streak, your connection’s milestones and your earlier photos, if any.',
        '**Visitors to your “3 words” page or your invitation** see your first name and your minimoa.',
        'No one sees your email address, your date of birth, your exact position, or your vision test answers. Your proof photos are checked by an AI: no human sees them, and they are deleted within 24 hours (unless you keep them in your private memories).',
      ],
    },

    { h2: '6. Our service providers', id: 'prestataires' },
    { p: 'These processors handle data on our behalf, on our instructions, under a contract that complies with Article 28 of the GDPR:' },
    {
      subprocessors: {
        head: ['Role', 'Provider', 'Where data is processed', 'Safeguard if outside the EU'],
        roles: {
          database: 'Database, authentication and photo storage',
          api: 'Hosting of the app’s server (API)',
          ai: 'AI: proof photos, message reading if switched on, reviews',
          email: 'Sending emails',
          push: 'Sending notifications',
          maps: 'Map tiles',
          site: 'Hosting of the blowy.app website',
        },
      },
    },
    {
      p: '**Apple and Google** are also involved, on their own behalf and under their own policies: sign-in (Sign in with Apple, Google), app distribution (App Store, Google Play), Blowy+ payment, and notification delivery.',
    },
    { p: 'Finally, we may have to disclose data to the authorities when the law requires it.' },

    { h2: '7. Transfers outside the European Union', id: 'transferts' },
    {
      p: 'We favour providers that process data within the European Union. When a provider processes data outside the EU (the table above says so), the transfer is covered by a European Commission adequacy decision (for example the EU–US Data Privacy Framework, for certified companies) or by the Commission’s standard contractual clauses. You can get a copy by writing to {{email.privacy}}.',
    },

    { h2: '8. How long we keep your data', id: 'durees' },
    {
      table: {
        head: ['Data', 'Retention'],
        rows: [
          ['Account, profile, vision, minimoa, habits, settings', 'As long as your account exists. Erased as soon as you delete it.'],
          ['Inactive account', 'Deleted after 2 years without sign-in, after a warning message.'],
          ['Location', 'Only the last rounded position and the approximate home area, replaced at each update.'],
          ['Proof photos', 'Within 24 hours, unless you keep them in your private memories.'],
          ['Message reading by the AI', 'Nothing is kept after the analysis.'],
          ['A connection’s messages, streak, milestones and earlier photos', 'As long as the connection exists.'],
          ['Purchases', 'Status as long as the account exists; transaction references up to 10 years (accounting obligations).'],
          ['Reports and moderation decisions', '1 year after the case is closed, longer if legal proceedings require it.'],
          ['Permanent ban', 'A technical identifier of the Apple or Google account, for 3 years, to prevent re-registration.'],
          ['Technical logs', '30 days, unless a security incident is being investigated. Connection data the law requires us to keep: the period set by law, one year at most.'],
          ['Exchanges with support', '1 year after the request is closed.'],
          ['Requests to exercise your rights', '5 years, so we can prove we answered.'],
          ['Backups', 'Overwritten as they rotate, at the latest 30 days after deletion.'],
        ],
      },
    },

    { h2: '9. Your rights', id: 'droits' },
    { p: 'Under the GDPR and the French Data Protection Act, you can at any time:' },
    {
      ul: [
        '**access** your data and get a copy;',
        'have it **corrected** (much of it can be changed directly in the app);',
        'have it **erased** ([deleting your account](@supprimer-mon-compte) does it in one go);',
        '**withdraw your consent** where it is the basis for processing (sensitive data, location, proof photos, message reading by the AI, notifications), without affecting what was done before;',
        '**object** to processing based on our legitimate interest, or ask for it to be **restricted**;',
        'get the data you gave us in a machine-readable format (**portability**);',
        'set **instructions** for what happens to your data after your death.',
      ],
    },
    {
      p: 'To exercise these rights, write to {{email.privacy}} or to {{publisher.name}}’s postal address: {{publisher.address}}. We answer within one month; this may be extended by two months for a complex request, in which case we will let you know. We may ask you to prove that the request really comes from you.',
    },
    {
      p: 'If you think your rights are not being respected, you can complain to the **CNIL**, the French data protection authority (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France, [cnil.fr](https://www.cnil.fr/fr/plaintes)), or to the data protection authority of your country of residence in the European Union.',
    },

    { h2: '10. Adults only', id: 'mineurs' },
    {
      p: 'Blowy is only for people aged 18 and over. We ask for the date of birth before sign-in; under 18, sign-up stops and nothing is created. We do not knowingly collect data about minors. If we learn that an account belongs to a minor, it is deleted. You can tell us from the app using the reason “Minor”.',
    },

    { h2: '11. Security', id: 'securite' },
    {
      ul: [
        'Exchanges between the app, the website and our servers are encrypted in transit (HTTPS).',
        'No password is stored by us: sign-in goes through Apple or Google.',
        'Photos are in private storage, reachable only through temporary links.',
        'Access to data is limited to the people who need it; the admin tool is restricted to authorised people, read-only except for moderation, and its actions are logged.',
        'We keep as little as possible: proof photos deleted within 24 hours, rounded location, nothing kept after the AI reads messages.',
      ],
    },
    {
      p: 'No system is infallible. In the event of a data breach, we notify the CNIL within 72 hours where the law requires it, and we tell you directly if it poses a high risk to you.',
    },

    { h2: '12. Changes', id: 'changements' },
    {
      p: 'If we change this policy significantly (for example a new use of your data), we tell you in the app before the changes apply, and we ask for your consent again where it is needed. The last-updated date is at the top of this page.',
    },
  ],
};
