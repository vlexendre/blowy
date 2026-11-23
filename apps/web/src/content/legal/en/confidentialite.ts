import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Privacy policy — Minimoa',
  heading: 'Privacy policy',
  description: 'The data Minimoa uses, why, on what legal basis, for how long, who can access it, and how to exercise your rights.',
  intro: 'What we know about you, why, who can access it, how long we keep it, and how to erase it all.',
  summary: {
    title: 'In short',
    items: [
      'We use your data for one thing: bringing your minimoa to life and introducing you to compatible people. **No advertising, no selling.**',
      'We do not ask what you are looking for: your minimoa creates connections, and what they become is up to you. **No data about your orientation is collected.**',
      'Your **location** is only used while the app is open, and **never stored exactly**: we only keep a point rounded to about 300 m and your area. On the map, others see a rounded and shifted position, never real-time, and **discreet mode** removes you from the map. Without location, you pick your city by hand.',
      'A **third-party AI**, that of {{sub.ai.provider}} ({{sub.ai.location}}), is used in four places, detailed [below](#ia): reading chats if you both switch it on, your proof photos if you accept, the safety check of profile photos and of some messages, and the weekly review, sent without any name.',
      '**No one at Minimoa reads your conversations**, except a reported message (reported by someone or by our automatic filter) and its immediate context, read by a moderator.',
      'You can change everything in the app and [delete your account](@supprimer-mon-compte) at any time. For anything else: {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Who is responsible', id: 'responsable' },
    {
      p: 'The data controller is **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, which publishes the Minimoa app and website ([legal notice](@mentions-legales)).',
    },
    { ul: ['For any question about your data: {{email.privacy}}.', 'We have not appointed a data protection officer (DPO): all your requests about your data go to {{email.privacy}}.'] },
    { p: 'This policy covers the Minimoa app and the minimoa.app website. For the website’s cookies, see the [cookies page](@cookies).' },

    { h2: '2. What we use, and why', id: 'donnees' },
    {
      p: 'For each use: the data involved, the purpose, the legal basis (what allows us to do it under the GDPR), how long we keep it and who can access it. Retention periods are summarised in the [retention table](#durees).',
    },

    { h3: 'Your account' },
    {
      ul: [
        '**Data:** the identifier Apple or Google sends us when you sign in, and the associated email address. With Apple, this may be a relay address that hides your real one. With Apple, we also keep a sign-in token issued by Apple, used only to revoke Minimoa’s access to your Apple ID when you delete your account.',
        '**Purpose:** create your account, sign you back in, secure access, and write to you about your account (welcome, new connection, end-of-trial reminder, moderation warning, notice before deletion for inactivity).',
        '**Legal basis:** performance of the contract.',
        '**Retention:** as long as your account exists. On deletion, the Apple token is first revoked with Apple, then erased. An account with no sign-in for 2 years is deleted, after a warning email sent 30 days before.',
        '**Access:** authorised Minimoa staff, our authentication host, our email provider. Apple or Google know you use Minimoa, since sign-in goes through them.',
      ],
    },

    { h3: 'Your first name and date of birth' },
    {
      ul: [
        '**Data:** the first name (or nickname) you choose; your date of birth.',
        '**Purpose:** your first name introduces you to others. It goes through our automatic filter before being saved (see [moderation](#signalements)). Your date of birth checks that you are 18 or over, and is used for the age filter in encounters.',
        '**Legal basis:** performance of the contract; for age and the filter, also our legitimate interest in protecting minors and the community.',
        '**Retention:** as long as your account exists. If you are under 18, sign-up stops before sign-in and nothing is stored.',
        '**Access:** your first name is visible to people your minimoa introduces you to and to your connections. Your date of birth is not shown to others.',
      ],
    },

    { h3: 'Your profile photo', id: 'photo-profil' },
    {
      ul: [
        '**Data:** the photo you choose, if you add one (it is optional), taken with the camera or picked from your gallery.',
        '**Purpose:** show you to your connections: it stays hidden until you’ve both said hello; once the connection is made, your connection sees it clearly. People you have no connection with never see it, on the map or in introductions: they see your minimoa.',
        '**Safety check:** before it is published, the photo is downsized and sent to our AI provider, {{sub.ai.provider}}, which checks that it shows no nudity, no one who appears to be a minor, no violence, no hate and no advertising. We tell you so in the app before you choose the photo. A rejected photo is erased immediately, and the moderation team receives an automatic report, without the photo. If the check is not possible at that moment, the photo is published and checked a little later. This check cannot be turned off: it protects everyone. Without a profile photo, nothing is sent.',
        '**Legal basis:** performance of the contract to display it; our legitimate interest and our safety obligations (filtering published content) for the check.',
        '**Retention:** as long as you keep it. When you change it, the old one is erased. It is erased when you delete your account.',
        '**Access:** your connections, depending on the connection’s level; our AI provider, for the duration of the check.',
      ],
    },

    { h3: 'Your gender', id: 'sexe' },
    {
      ul: [
        '**Data:** your gender (woman, man, non-binary, or “I’d rather not say”).',
        '**Purpose:** wording the app’s texts correctly, and statistics without names. **It is not used to choose whom your minimoa introduces you to.**',
        '**Legal basis:** our legitimate interest. “I’d rather not say” is always an option, and you can change your answer in the app (**Me → Settings → Who you are**).',
        '**Retention:** as long as your account exists.',
        '**Access:** only you. It is never shown to others.',
        'We do not ask what you are looking for or whom you want to meet: your minimoa creates connections, and what they become is up to you. Answers given to these questions before November 17, 2026, and the consent that came with them, have been erased.',
      ],
    },

    { h3: 'Your location', id: 'localisation' },
    {
      ul: [
        '**Data:** your position, **only while the app is open** (never in the background). **It is never stored as is**: our server only keeps the centre of the roughly 300 m square you are in, and your approximate home area derived from it (same precision). The exact position is only used, for the duration of the request, to tell whether you are outside your home area.',
        '**Without location:** you can pick your city by hand (free; once every 30 days, or whenever you like with Minimoa+). We then only keep the chosen city and its centre, which serve as your area.',
        '**Purpose:** show you the map and the compatible minimoas around you; offer you nearby encounters; confirm that an outing really happened outside your home area, to raise your minimoa’s sociability.',
        '**What others see:** never your exact position. They see a position rounded to about 300 m and shifted, never shown in real time. **Discreet mode** removes you from the map completely.',
        '**Legal basis:** your consent, given through your phone’s location permission, or by choosing your city. You can withdraw it at any time: in your phone settings, or in the app (**Me → Settings → My location → Forget my location**), which erases your position and your area.',
        '**Retention:** the last rounded point and your area (or the chosen city), replaced at each update. We do not keep a history of your movements.',
        '**Access:** authorised Minimoa staff, our host, and the map tile provider, which receives from your phone the area shown on screen.',
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
        '**Data:** your minimoa’s name and appearance, its gauges (sociability, hunger, energy, mood), the actions you take, your habits and their rhythm, your streak, jokers, items, daily challenges, your weekly review. The minimoa’s name goes through our automatic filter, like your first name.',
        '**Purpose:** run the game.',
        '**Legal basis:** performance of the contract.',
        '**Retention:** as long as your account exists.',
        '**Access:** you; your connections and the people introduced to you see your minimoa and its style.',
      ],
    },

    { h3: 'Proof and challenge photos', id: 'preuves' },
    {
      ul: [
        '**Data:** the photo you take in the app when your minimoa asks for proof of a habit (your trainers, for example), or for a daily photo challenge. It is taken with the camera, not picked from your gallery.',
        '**Purpose:** check that a habit was kept; count a challenge as done.',
        '**Checked by an AI, only if you accept:** before your first proof, the app tells you what is sent, to whom and why, and you choose. If you accept, each proof photo is downsized and sent to {{sub.ai.provider}} with the habit’s name (not your first name, not your location), which answers yes, no or “not sure”, with a sentence; if “not sure”, we trust you. If you refuse, **no photo is sent to an AI**: you confirm the habit on your word, without a photo, and your streak moves on just the same. You can change your mind at any time in **Me → AI and you**. Challenge photos are never sent to an AI.',
        '**Legal basis:** your consent, for the AI check; performance of the contract, for temporary storage.',
        '**Retention:** **deleted from our storage within 24 hours**, unless you choose to keep it in your private memories (it stays there until you stop keeping it or delete your account).',
        '**Access:** **no human sees it**, neither at Minimoa nor anywhere else on Minimoa. Only {{sub.ai.provider}} receives a proof photo, downsized, if you accepted.',
      ],
    },
    { p: 'Avoid photographing other people, documents or sensitive information.' },

    { h3: 'Your messages, and their reading by an AI if you switch it on', id: 'messages' },
    {
      ul: [
        '**Data:** the messages you exchange in your connections, their date, and what has been read.',
        '**Purpose:** deliver them to the other person and keep them in your conversation.',
        '**Automatic filter:** before being sent, every message goes through our filter, on our servers (word lists in several languages, no AI). A clear violation (threat, hate, sexual content involving a minor, paid sex, scam) is not sent: we tell you why, your text stays in the field, and the moderation team receives an automatic report with a short excerpt. A borderline message (insult, explicit sexual content) is sent, but reported to the moderation team, and your minimoa suggests a break.',
        '**Legal basis:** performance of the contract; for the filter, our legitimate interest and our safety obligations.',
        '**Retention:** as long as the connection exists, that is, as long as both your accounts exist. Leaving a connection removes it from both your lists without erasing the conversation: it comes back if you meet again. If either of you deletes their account, the connection and its messages are erased for both.',
        '**Access:** you and the other person. A moderator may read a **reported** message, reported by one of you or by the filter, and its immediate context (see [reports](#signalements)).',
      ],
    },
    {
      note: 'The sentence the app shows you before asking for your consent: “No one at Minimoa reads your conversations, except a reported message and the few messages around it, for moderation. If you both switch it on, an AI reads your latest messages so your minimoas can react to them. This AI is provided by {{sub.ai.provider}} ({{sub.ai.location}}), our provider, which receives these messages on our behalf. You can withdraw your consent at any time.”',
    },
    {
      ul: [
        '**Each person’s agreement:** we ask both of you, the first time you open the chat (or once for all your chats, if you choose a default setting). If one of you has not said yes, the AI reads nothing: the minimoas only react to the rhythm of the connection (silences, streaks, challenges), with ready-made sentences.',
        '**Withdrawal:** at any time, in the connection’s options, or for all your chats in **Me → AI and you**. Reading stops immediately.',
        '**How:** no analysis on every message. When something triggers it (a silence, a certain number of messages, a rising tone), a short window of the latest messages is sent to {{sub.ai.provider}}, with the authors marked A and B, without your first names; the AI suggests the minimoa’s reaction. At most 3 interventions per day per connection, and you can turn them off for a connection. If the tone rises, your minimoa may suggest a break: that message is visible only to you.',
        '**Safety check:** in a chat where you have both accepted reading, a message our filter has doubts about (a link, for example) may also be sent on its own to {{sub.ai.provider}}, after it is sent, to check that it follows the rules. If it does not, it is reported to the moderation team.',
        '**What is kept:** at Minimoa, nothing from the window sent or from the analysis; only the minimoa’s reaction appears in the chat, as a message. What {{sub.ai.provider}} keeps on its side, and for how long: {{ai.retention}}.',
        '**Legal basis:** the consent of each of you.',
      ],
    },

    { h3: 'A connection’s streak and milestones' },
    {
      ul: [
        '**Data:** the days on which each of you wrote in the connection (not the content of the messages) and the connection’s milestones (meeting, levels reached, streak records). For connections from before 15 November 2026, the “daily photos” you had sent each other there: Minimoa no longer receives new ones, and the old ones stay in the connection’s memories.',
        '**Purpose:** run the connection’s streak (the days in a row you both write), its lives and levels, and show you your memories.',
        '**Legal basis:** performance of the contract.',
        '**Retention:** as long as the connection exists (same rules as messages): old daily photos are erased when the connection is, or when either of you deletes their account.',
        '**Access:** you and the other person in the connection (their old photos stay blurred for you until level 5). Photos are stored in a private space, reachable only through temporary links.',
      ],
    },

    { h3: 'Notifications and emails' },
    {
      ul: [
        '**Data:** your phone’s technical notification token, your settings for each notification type, the time you chose for the daily challenge; on iPhone, Live Activity tokens.',
        '**Purpose:** let you know (daily challenge, new encounter, message, “your turn to write” in the evening, connection or streak at risk, proof requested, weekly review, end-of-trial reminder; first steps during the first 7 days, news from your minimoa when you’re away and on your anniversaries, messages about your Minimoa+ subscription). Quiet hours from 10 pm to 8 am; apart from messages, 3 a day at most. The end-of-trial reminder and the emails about your subscription (welcome, failed payment, end) are also sent by email, even if notifications are off. The email after 14 days away and the single reminder one month after Minimoa+ ends are turned off with the same setting as the notification (“News from your minimoa”, “Your Minimoa+ subscription”). On iPhone, the widget and Live Activities use the same data; a Live Activity on the lock screen never shows anyone’s first name.',
        '**Legal basis:** your consent for notifications, given through your phone’s permission (you withdraw it in your phone settings or type by type in the app); performance of the contract for emails about your account and subscription; legitimate interest for the absence email and the reminder after Minimoa+ ends (you object by turning the setting off).',
        '**Retention:** until you turn off notifications or delete your account. The list of messages already sent (only their type and date, so the same one is never sent twice) is kept for 400 days at most.',
        '**Access:** our notification and email providers, and Apple or Google, which deliver notifications to your phone.',
      ],
    },

    { h3: 'Minimoa+ purchases' },
    {
      ul: [
        '**Data:** the plan chosen, the purchase, trial and renewal dates, subscription status, transaction identifier. **We never receive your payment details**: Apple bills you.',
        '**Purpose:** unlock Minimoa+ features, verify the purchase with Apple, manage the trial and its reminder.',
        '**Legal basis:** performance of the contract; accounting obligations for transaction references.',
        '**Retention:** status as long as your account exists; transaction references, detached from your account if it is deleted, up to 10 years (accounting obligations).',
        '**Access:** authorised Minimoa staff; Apple, under its own policy.',
      ],
    },

    { h3: 'Filtering, reports, blocks and moderation', id: 'signalements' },
    {
      ul: [
        '**Data:** who reports, who is reported, the connection concerned, the reason, written details; the **reported message and its immediate context**; automatic reports from our filter (first name or minimoa name refused, message not sent with an excerpt of 280 characters at most, borderline message, profile photo rejected, without the photo); blocks; moderation decisions and the action log.',
        '**Automatic filtering:** first names, minimoa names, messages and profile photos are filtered before being published (see above). A refused first name or name is not saved, and the app tells you why.',
        '**Purpose:** protect people, handle reports, enforce the [rules](@regles), respond to authorities, prevent a blocked person from contacting you. The moderation team is notified by email of every new report: immediately for an urgent report (minor, threat), otherwise in a digest. Target: handled within 24 hours; beyond that, the report moves to the top of the queue.',
        '**Automatic suspension, in two cases only:** a message containing explicit child-abuse vocabulary, or an account reported as a minor by two different people. The account is then suspended for 72 hours at most, while a moderator looks at it; the moderator lifts or confirms the suspension. Apart from these two cases and the filter’s refusals, no sanction is taken without a human.',
        '**Challenging a decision:** you can challenge any decision concerning you, automatic or not, by writing to {{email.support}} (in the app, the suspended-account screen has a button for this). A person reviews the decision.',
        '**Legal basis:** our legal obligations (in particular the Digital Services Act) and our legitimate interest in keeping the community safe.',
        '**Retention:** see the [retention table](#durees). If you delete your account, reports about you and the decision log remain until they are erased, no longer linked to any account (the log keeps the first name concerned).',
        '**Access:** authorised Minimoa moderators, and the authorities where the law requires it. The reported person does not know who reported them. A blocked person is not notified.',
      ],
    },

    { h3: 'Where you came from, and the steps of your journey', id: 'croissance' },
    {
      ul: [
        '**Data:** how you arrived on Minimoa (a creator’s code, the “3 words” link or group link you opened, an invitation, or none of these), read **only** from the link you opened before signing up or from the code you typed (“Got a code?”); the person who brought you, if any; and the main steps of your journey, once each: sign-up completed, first connection, coming back 1, 7 and 30 days later, Minimoa+ trial started and first payment.',
        '**What we don’t do:** no fingerprinting of your device (no model, no IP address, no advertising identifier), no third-party analytics tool. Visits to public pages (“3 words”, invitation, group, creator code), first app launches, votes and shares are only **counted per day**, with no IP or identifier: there is no one behind these counters.',
        '**Purpose:** knowing which links and creators bring people who stay, improving the journey, and giving the “Referral” wardrobe item to the person who brought someone and to the newcomer (a decorative item, never tied to a purchase or a review).',
        '**Legal basis:** our legitimate interest.',
        '**Retention:** the source and steps, as long as your account exists. When you delete it, the source is erased and the steps lose any link to you (only a number remains). Daily counters are kept without limit.',
        '**Access:** a few authorized team members, in the internal tool, as figures only. A creator never sees who arrived with their code.',
      ],
    },

    { h3: 'The “Which minimoa are you?” quiz and “Open your neighbourhood” (website, no account)', id: 'quiz-quartier' },
    {
      ul: [
        '**Quiz:** your answers are used to compute your result during the request; we keep **only the result** (species, character and starting gauges) under a short code, plus the result code of the person who challenged you, if any. No name, no address, no IP is attached. The code lets you find your result again and pre-fill your minimoa if you type it in the app. Erased after one year.',
        '**Open your neighbourhood:** your email address, the neighbourhood you picked (from a list or by postcode; **never your location**), your language, the date of your consent and confirmation, your invite code and, if you came through someone’s link, who invited you. You only count in the neighbourhood counter once you’ve confirmed your address (double opt-in). We write to you twice at most: the confirmation, then the neighbourhood opening.',
        '**Purpose:** to tell you when your neighbourhood opens, show the real counter (a number, never an address), and give the decorative “Founder” item to the first 3 people who invited others in the neighbourhood.',
        '**Legal basis:** your consent (a checkbox, never pre-ticked), which you can withdraw at any time with the unsubscribe link in every email.',
        '**Retention:** if not confirmed, the sign-up is erased within 7 days. Unsubscribing erases the address at once. After the opening email, the address is erased within 30 days; only an anonymous row (neighbourhood and code) remains for the counter and the “Founder” item.',
        '**Access:** emails are sent through our email provider ({{sub.email.provider}}). The team’s internal tool only shows counts per neighbourhood, never an address.',
        '**On the website:** during your visit, your result code is kept in your browser’s session storage (cleared when you close the tab) to show you your result again. No cookies.',
      ],
    },

    { h3: 'Statistics and administration' },
    {
      ul: [
        '**Data:** figures calculated from activity: number of accounts, active accounts, retention, subscribers and trials, streaks, minimoa messages, encounters suggested and accepted, AI costs. To calculate them, we note the days on which you open the app, and the encounters suggested to each person.',
        '**Purpose:** run and improve Minimoa, control costs.',
        '**Legal basis:** our legitimate interest.',
        '**How:** these statistics are calculated from our own database, in an internal tool restricted to a few authorised people. There is no advertising in the app; the only usage measurement tool, {{sub.analytics.provider}}, only works with your consent ([see below](#statistiques-usage)). The internal tool gives no access to conversations, except to a reported message and its immediate context.',
        '**Retention:** activity days, 40 days; suggested encounters, 30 days; per-person AI usage counter, 2 days; internal ranking of the most active minimoas (first name and minimoa), 40 days. Aggregated figures, which cannot identify you, are kept without limit.',
      ],
    },

    { h3: 'Usage statistics, only with your consent', id: 'statistiques-usage' },
    {
      ul: [
        '**Data:** a random identifier created by the tool on your phone (without your first name, your email address or your account identifier), the device model and system, the app version, the language, and actions taken in the app (for now, just one: creating your account). This data is pseudonymous, not anonymous: it does not say who you are, but it relates to your phone. **No IP address, no location:** the tool is set not to record your IP address, so it derives no city, region or country from it; it does not read your mobile carrier or your phone’s region either.',
        '**Purpose:** understanding how the app is used, to improve it. Never advertising, never tracking across apps or websites.',
        '**Legal basis:** your consent. We ask you just before creating your account (“Yes, count me in” or “No thanks”, nothing is chosen in advance). Without your consent, nothing is sent.',
        '**Withdrawal:** at any time, in **Me → Settings → Usage statistics**. Sending stops immediately.',
        '**Access:** our measurement tool, {{sub.analytics.provider}} ({{sub.analytics.location}}), which processes this data on our behalf; transfer safeguard: {{sub.analytics.safeguard}}.',
        '**Duration:** see the [retention table](#durees).',
      ],
    },

    { h3: 'Technical data' },
    {
      ul: [
        '**Data:** IP address, device model and system, app version, language, error and connection logs.',
        '**Purpose:** run the service, secure it, limit abuse, fix bugs.',
        '**Legal basis:** our legitimate interest.',
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
        '**Where it comes from**, with starting weights: sign-up test 40% (then less and less), daily question 20%, habits 25%, how you look after your minimoa 10%, your friends’ 3 words 5%. The more you use Minimoa, the higher the confidence.',
        '**Filters**: 18 and over; area; blocked people. Neither your gender nor anyone else’s filters who is introduced to you.',
        '**The score**: closeness on the 5 axes, weighted by confidence. The home axis counts less than the others. Style (sociable, playful, tender, chatty) is not part of the score.',
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
    {
      p: 'Minimoa uses the AI of **{{sub.ai.provider}}** ({{sub.ai.location}}), an outside provider, in four places and nowhere else. Everything can be seen, and what can be withdrawn can be withdrawn, in the app: **Me → AI and you**.',
    },
    {
      table: {
        head: ['Use', 'When', 'What the provider receives', 'What Minimoa keeps'],
        rows: [
          [
            'Reading chats',
            'Only if you have both switched it on; can be withdrawn at any time',
            'A short window of the connection’s latest messages, authors marked A and B, without your first names',
            'Nothing from the window or the analysis. Only the minimoa’s reaction appears in the chat.',
          ],
          [
            'Habit proof photos',
            'Only if you accepted, once, before your first proof; can be withdrawn. Without consent: confirmation on your word, without a photo',
            'The downsized photo and the habit’s name',
            'The answer (yes, no, not sure). The photo is deleted within 24 hours, unless you keep it.',
          ],
          [
            'Safety checks',
            'Every profile photo, before it is published (cannot be turned off); a message the filter has doubts about, only in a chat where you have both accepted reading',
            'The downsized profile photo; or that single message',
            'The decision (accepted, or rejected and reported to moderation). A rejected photo is erased.',
          ],
          [
            'Weekly review',
            'In active weeks, to rephrase your review',
            'A text made of figures and general sentences, without any first name or name (not yours, not your connections’, not your minimoa’s): nothing that could identify you',
            'The review text, in the app.',
          ],
        ],
      },
    },
    {
      p: 'We never send the AI provider your email address, your date of birth, your location or your account identifier. It acts as a processor: it processes this data only for us, on our instructions, and not for its own purposes. What it keeps on its side, and for how long: {{ai.retention}}. Daily challenge photos are never sent to an AI. Without consent to chat reading, the minimoas speak with ready-made sentences, without AI.',
    },
    {
      p: 'AI answers can be wrong: they have no legal effect. If a proof is in doubt, we trust you; a profile photo rejected by mistake can be reported to {{email.support}}.',
    },

    { h2: '5. What others see', id: 'visibilite' },
    {
      ul: [
        '**People your minimoa introduces you to** see your first name, your minimoa, its style, what you have in common and one difference, and your approximate position on the map (unless you are in discreet mode).',
        '**Your connections** also see your messages, your streak, your connection’s milestones, your old daily photos if any, and your profile photo if you have one (visible once the connection is made).',
        '**Visitors to your “3 words” page or your invitation** see your first name and your minimoa.',
        'No one sees your email address, your date of birth, your gender, or your vision test answers. Your exact position is not stored anywhere. Your proof photos are seen by no human, and they are deleted within 24 hours (unless you keep them in your private memories).',
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
          ai: 'AI: reading chats if you both switch it on, proof photos if you accept, safety check of profile photos and of some messages, weekly review (without names)',
          email: 'Sending emails (account, end-of-trial reminder, moderation alerts)',
          push: 'Sending notifications',
          maps: 'Map tiles',
          analytics: 'Usage statistics, only with your consent',
          site: 'Hosting of the minimoa.app website',
        },
      },
    },
    {
      p: '**Apple and Google** are also involved, on their own behalf and under their own policies: sign-in (Sign in with Apple, Google), app distribution (App Store, Google Play), Minimoa+ payment (App Store), and notification delivery.',
    },
    { p: 'Finally, we may have to disclose data to the authorities when the law requires it.' },

    { h2: '7. Transfers outside the European Union', id: 'transferts' },
    {
      p: 'We favour providers that process data within the European Union. When a provider processes data outside the EU (the table above says so, for example our AI provider), the transfer is covered by the safeguard shown in the table: a European Commission adequacy decision (for example the EU–US Data Privacy Framework, for certified companies) or the Commission’s standard contractual clauses. You can get a copy by writing to {{email.privacy}}.',
    },

    { h2: '8. How long we keep your data', id: 'durees' },
    {
      table: {
        head: ['Data', 'Retention'],
        rows: [
          ['Account, profile, vision, minimoa, habits, settings', 'As long as your account exists. Erased as soon as you delete it.'],
          ['Inactive account', 'Deleted after 2 years without sign-in, after a warning email sent 30 days before.'],
          ['Apple sign-in token', 'As long as your account exists. Revoked with Apple, then erased, when you delete it.'],
          ['Location', 'Only the last rounded point (about 300 m) and your area, or the chosen city, replaced at each update. Erased if you forget your location.'],
          ['Profile photo', 'As long as you keep it. The old one is erased when you change it; a photo rejected by the check is erased immediately.'],
          ['Proof and challenge photos', 'Within 24 hours, unless you keep them in your private memories (until you stop keeping them or delete your account).'],
          ['What is sent to the AI', 'Nothing is kept at Minimoa, except the answer (minimoa’s reaction, proof verdict, safety decision, review text). At the provider: {{ai.retention}}.'],
          ['A connection’s messages, streak, milestones and old daily photos', 'As long as the connection exists, that is, until either of you deletes their account.'],
          ['Purchases', 'Status as long as the account exists; transaction references up to 10 years (accounting obligations), detached from the account if it is deleted.'],
          ['Handled reports and moderation decisions', '1 year after the case is closed, longer only if the law requires it.'],
          ['Permanent ban', 'A non-reversible fingerprint of the account’s Apple or Google identifier, for 3 years, to prevent re-registration.'],
          ['Statistics', 'Activity days and named internal ranking: 40 days. Suggested encounters: 30 days. Aggregated figures, which cannot identify you: without limit.'],
          ['Usage statistics (if you said yes)', 'At {{sub.analytics.provider}}: 25 months at most.'],
          ['Website quiz and “Open your neighbourhood”', 'Quiz result: 1 year. Unconfirmed sign-up: 7 days. Email address: until you unsubscribe, or 30 days after the neighbourhood opening email.'],
          ['Arrival source and journey steps', 'As long as your account exists; erased or anonymized when it’s deleted. Daily counters (visits, first launches, votes, shares), with no one behind them: without limit.'],
          ['The app’s technical logs', '30 days at most. Our hosts’ logs follow their own retention periods.'],
          ['Exchanges with support', '1 year after the request is closed.'],
          ['Requests to exercise your rights', '5 years, so we can prove we answered.'],
          ['Backups', 'Overwritten as they rotate at our data host: {{dataHost.backupRetention}}.'],
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
        '**withdraw your consent** where it is the basis for processing (location, AI check of proof photos, message reading by the AI, usage statistics, notifications), without affecting what was done before;',
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
      p: 'Minimoa is only for people aged 18 and over. We ask for the date of birth before sign-in; under 18, sign-up stops and nothing is created. We do not knowingly collect data about minors. If we learn that an account belongs to a minor, it is deleted. You can tell us from the app using the reason “Minor”; an account reported this way by two different people is suspended until a moderator looks at it.',
    },

    { h2: '11. Security', id: 'securite' },
    {
      ul: [
        'Exchanges between the app, the website and our servers are encrypted in transit (HTTPS).',
        'No password is stored by us: sign-in goes through Apple or Google.',
        'Photos are in private storage, reachable only through temporary links.',
        'Access to data is limited to the people who need it; the admin tool is restricted to authorised people, read-only except for moderation, and its actions are logged.',
        'We keep as little as possible: location never stored exactly, proof and challenge photos deleted within 24 hours, nothing kept at Minimoa of what is sent to the AI.',
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
