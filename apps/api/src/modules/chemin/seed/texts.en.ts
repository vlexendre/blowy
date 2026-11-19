import type { SeedTexts } from './texts';

export const en: SeedTexts = {
  units: {
    vision: ['Your vision of life', 'What you want for later.'],
    energie: ['Your energy', 'What recharges you, what gets you going.'],
    habitudes: ['Your daily habits', 'Your everyday life, no filter.'],
    valeurs: ['What matters to you', 'What you wouldn’t give up for anything.'],
    autres: ['You and others', 'Your friends, your people, and new faces.'],
    gouts: ['Your tastes', 'What you’re into.'],
  },
  steps: {
    vision_1: 'The big choices',
    vision_2: 'Your place, your pace',
    energie_1: 'Recharging',
    energie_2: 'Ready in a flash',
    habitudes_1: 'Organized or not',
    habitudes_2: 'Your days',
    valeurs_1: 'Your priorities',
    valeurs_2: 'Here or elsewhere',
    autres_1: 'Your friends',
    autres_2: 'Your people',
    gouts_1: 'Discovering',
    gouts_2: 'Your pleasures',
  },
  legacy: {
    dimanche: { o: 'Ask them what their perfect Sunday looks like.', r: ['Blanket and a series: I’m moving in.', 'Grabbing my scarf, let’s go!'] },
    enfants: { o: 'Ask them what their Sunday lunches are like.', r: ['We’ll need a bigger table.', 'Brunch is sacred.'] },
    mutation: { o: 'Ask them which country they’d move to tomorrow.', r: ['I’ll hide in a box.', 'Here is home.'] },
    heritage: { o: 'Ask them what they’d do with €10,000.', r: ['Your piggy bank thanks you.', 'Memories never get lost.'] },
    promotion: { o: 'Ask them about the project keeping them busy right now.', r: ['Go for it, I’ll mind the house.', 'Your evenings are safe.'] },
    vacances: { o: 'Ask them about their best vacation.', r: ['Real adventure.', 'What a beautiful schedule.'] },
    appartement: { o: 'Ask them what their dream home looks like.', r: ['A nest, I love nests.', 'Light as a feather.'] },
    vendredi: { o: 'Ask them about their best Friday night.', r: ['The night is young!', 'Good night, see you tomorrow.'] },
    cinq_ans: { o: 'Ask them where they see themselves in five years.', r: ['Close to your people, that’s precious.', 'Send me a postcard.'] },
    projet: { o: 'Ask them about the project closest to their heart.', r: ['What a fire!', 'Enjoy first, wise call.'] },
  },
  q: {
    energie_batterie: {
      t: 'After a busy week, you recharge…',
      o: 'Ask them how they recharge.',
      a: [
        ['Quietly, at home', 'Blanket approved. I’ll make tea.'],
        ['With lots of people around', 'I’ll tell the crew!'],
      ],
      m: 'A bit of both: the right mix.',
    },
    energie_samedi: {
      t: 'Saturday morning, no plans.',
      o: 'Ask them about their ideal Saturday morning.',
      a: [
        ['Slow coffee by the window, nothing else', 'The ultimate luxury: doing nothing.'],
        ['I head out and see where I end up', 'Grabbing my scarf, I’m coming.'],
        ['Brunch with friends', 'Save me a pastry.'],
      ],
    },
    energie_soiree: {
      t: 'A party where you only know the host.',
      o: 'Ask them about their best or worst party with strangers.',
      a: [
        ['I’m in, I love meeting people', 'You’ll come back with ten new contacts.'],
        ['I’m in if I can bring someone', 'A sidekick, smart move.'],
        ['I’ll pass, tonight is couch night', 'The couch thanks you.'],
      ],
    },
    energie_pluie: {
      t: 'Sunday, it’s pouring. You…',
      o: 'Ask them what they do when it rains all weekend.',
      a: [
        ['Work on a personal project', 'Hard at work over here.'],
        ['Get lost in a book or a series', 'One more episode, I won’t tell.'],
        ['Cook something complicated, just for fun', 'When do I taste it?'],
      ],
    },
    energie_semaine: {
      t: 'Your ideal week looks more like…',
      o: 'Ask them what their ideal week looks like.',
      a: [
        ['Easy, time for myself', 'Napping is an art.'],
        ['Full of things moving forward', 'Engine on!'],
      ],
      m: 'Neither race nor nap: balance.',
    },
    energie_vacances: {
      t: 'On vacation, your perfect day…',
      o: 'Ask them about their perfect vacation day.',
      a: [
        ['Lounger, book, nothing else', 'I’ll guard your towel.'],
        ['Hike at dawn, sightseeing in the afternoon', 'My paws hurt already.'],
        ['Beach by day, party by night', 'When do you sleep?'],
      ],
    },
    energie_ce_soir: {
      t: '7 p.m., a text: “Up for something tonight?”',
      o: 'Ask them about the last time they said yes to a last-minute plan.',
      a: [
        ['Yes! Where do we meet?', 'Already in your shoes.'],
        ['Depends on what', 'Cautious as a cat.'],
        ['Not tonight, I’m in pajama mode', 'The pajamas win.'],
      ],
    },
    energie_semi: {
      t: 'Someone suggests running a half marathon in six months.',
      o: 'Ask them which sports challenge tempts them.',
      a: [
        ['I sign up, it motivates me', 'I’ll make the sign.'],
        ['Maybe, if we go as a group', 'Everything’s easier as a crew.'],
        ['I’ll come cheer with a croissant', 'Best job there is, honestly.'],
      ],
    },
    energie_cafe: {
      t: 'Your favorite café is…',
      o: 'Ask them about their favorite café or bar around here.',
      a: [
        ['A small quiet room with books', 'Shh, I’m reading over your shoulder.'],
        ['A lively spot, music, people coming and going', 'Busy, I like it.'],
      ],
    },
    energie_cinq_ans: {
      t: 'In five years, at work or in your projects, you want…',
      o: 'Ask them where their projects will be in five years.',
      a: [
        ['Things running smoothly', 'Easy, but steady.'],
        ['To have reached a new level', 'I can see the summit already.'],
      ],
      m: 'Moving forward without burning out: that’s a plan.',
    },
    habitudes_courses: {
      t: 'Weekly groceries…',
      o: 'Ask them what they can’t help buying.',
      a: [
        ['A list by aisle, nothing forgotten', 'Can you do mine?'],
        ['I improvise in the aisles', 'And leave with three kinds of cheese.'],
        ['Delivered, planned since Sunday', 'Efficient. Noted.'],
      ],
    },
    habitudes_valise: {
      t: 'You pack your suitcase…',
      o: 'Ask them what they always forget when traveling.',
      a: [
        ['Three days early, with a list', 'Your list probably has a list.'],
        ['The night before', 'The classic.'],
        ['An hour before leaving', 'Did you remember socks?'],
      ],
    },
    habitudes_budget: {
      t: 'Your money, you manage it…',
      o: 'Ask them about their best splurge, or their best saving.',
      a: [
        ['By feel', 'Living in the moment is a budget too.'],
        ['Down to the cent', 'Spreadsheet open, respect.'],
      ],
      m: 'Keeping an eye on it, no stress.',
    },
    habitudes_dimanche_soir: {
      t: 'Sunday evening, you…',
      o: 'Ask them about their Sunday night ritual.',
      a: [
        ['Prepare your week', 'Monday had better behave.'],
        ['Enjoy it to the last minute', 'Monday can wait.'],
      ],
    },
    habitudes_rdv: {
      t: 'A meeting at 8 p.m. You arrive…',
      o: 'Ask them for their best excuse for being late.',
      a: [
        ['At 7:50, always a bit early', 'Nobody gets there before you.'],
        ['At 8 sharp', 'Swiss precision.'],
        ['At 8:15, with a good excuse', 'I love your excuses.'],
      ],
    },
    habitudes_diner: {
      t: 'Tonight, we eat…',
      o: 'Ask them about the dish they make best.',
      a: [
        ['At home, I cook', 'It smells good from here.'],
        ['Out, I want to see people', 'Booking a table for four paws.'],
        ['Takeout, on the couch', 'The best of both worlds.'],
      ],
    },
    habitudes_week_end: {
      t: 'Your ideal weekend is…',
      o: 'Ask them what they’ve planned this weekend. Or not.',
      a: [
        ['Totally free', 'Chance does things well.'],
        ['Planned ahead', 'Beautiful schedule.'],
      ],
      m: 'A plan, but not too much.',
    },
    habitudes_bureau: {
      t: 'Your desk, right now…',
      o: 'Ask them about the most unlikely object on their desk.',
      a: [
        ['Everything in its place', 'I don’t dare touch anything.'],
        ['A happy mess, but I know where everything is', 'A system, a real one.'],
      ],
    },
    habitudes_matin: {
      t: 'In the morning, your first instinct…',
      o: 'Ask them what their perfect morning looks like.',
      a: [
        ['Thinking about everything I’ll do', 'Mental list loading.'],
        ['Coffee, in silence, no plans', 'Coffee first, world later.'],
      ],
    },
    habitudes_bouger: {
      t: 'To move, you prefer…',
      o: 'Ask them which sport they’d like to try.',
      a: [
        ['Yoga or a walk, easy', 'Breathe. I’m breathing with you.'],
        ['A team sport', 'I’ll be the mascot.'],
        ['Move? I walk to the fridge', 'It’s cardio if you run.'],
      ],
    },
    valeurs_racines: {
      t: 'The place you grew up is, for you…',
      o: 'Ask them what they miss most about where they grew up.',
      a: [
        ['My home base, I go back often', 'Nothing beats home.'],
        ['A good memory, my life is elsewhere', 'Always one step further.'],
      ],
    },
    valeurs_temps_argent: {
      t: 'More free time or more money?',
      o: 'Ask them what they’d do with one extra day off a week.',
      a: [
        ['More time', 'Time, the real wealth.'],
        ['More money', 'Buy me a snack?'],
      ],
      m: 'A bit of each, sensible.',
    },
    valeurs_repas: {
      t: 'Big family meals…',
      o: 'Ask them about a childhood dish they still love.',
      a: [
        ['Sacred, I never miss one', 'I’ll bring dessert.'],
        ['I like them, my own way', 'Traditions, your version.'],
        ['I prefer celebrating with friends', 'The family you choose.'],
      ],
    },
    valeurs_demenagement: {
      t: 'A friend is moving on Saturday, 8 a.m. sharp.',
      o: 'Ask them about their best or worst moving day.',
      a: [
        ['I bring boxes and croissants', 'Heart of gold, certified.'],
        ['I drop by in the evening for pizza', 'Pizza, the best part.'],
        ['I lend my car, not my back', 'Your back says thanks.'],
      ],
    },
    valeurs_reussite: {
      t: 'For you, a successful life is first…',
      o: 'Ask them what they’re proud of right now.',
      a: [
        ['Having built something', 'I can see you with a statue.'],
        ['Time for what I enjoy', 'Wise. Very wise.'],
        ['People I love around me', 'The finest treasure.'],
      ],
    },
    valeurs_etranger: {
      t: 'Live abroad for a year, right now?',
      o: 'Ask them which city they’d live in for a year.',
      a: [
        ['No thanks, I’m good here', 'Here is home.'],
        ['I’ll leave tomorrow', 'I’m sneaking into your suitcase.'],
      ],
      m: 'Why not… someday.',
    },
    valeurs_chez_toi: {
      t: 'Your ideal home is…',
      o: 'Ask them about their favorite room at home.',
      a: [
        ['A nest where people drop by all the time', 'I’m calling the couch.'],
        ['A place of my own, quiet, my rules', 'Your kingdom, your rules.'],
        ['No fixed place: wherever I am', 'A nomad at heart.'],
      ],
    },
    valeurs_occasion: {
      t: 'A great opportunity, but you have to decide within an hour.',
      o: 'Ask them about the best decision they made on a whim.',
      a: [
        ['I go for it', 'Wind in my fur!'],
        ['I ask for time to think', 'Thinking is already doing.'],
      ],
    },
    valeurs_dix_ans: {
      t: 'In ten years, you see yourself…',
      o: 'Ask them what a great day looks like, ten years from now.',
      a: [
        ['With a big tribe around me', 'We’ll need a big table.'],
        ['Free as a bird, no ties', 'Wind in my fur.'],
        ['No idea, and that’s fine', 'The future is a surprise.'],
      ],
    },
    valeurs_boulot: {
      t: 'Your ideal job is more…',
      o: 'Ask them what job they dreamed of as a kid.',
      a: [
        ['Stable, I know where I’m going', 'Solid as a rock.'],
        ['Changing, full of surprises', 'Roller coasters suit you.'],
      ],
      m: 'Solid, with a little spice.',
    },
    autres_silence: {
      t: 'Someone you like hasn’t replied in two days.',
      o: 'Ask them about the best message anyone ever sent them.',
      a: [
        ['No big deal, everyone has their pace', 'Totally zen.'],
        ['I follow up with something funny', 'The perfect meme exists.'],
        ['I wonder if I said something', 'Surely not. Breathe.'],
      ],
    },
    autres_bande: {
      t: 'Your friends are more…',
      o: 'Ask them how they met their best friends.',
      a: [
        ['A big crew, always people around', 'I want in on the group.'],
        ['Two or three, but for life', 'Few, but solid.'],
      ],
    },
    autres_improviste: {
      t: 'Friends show up at your place unannounced.',
      o: 'Ask them what they serve when friends drop by.',
      a: [
        ['Great, I’ll get the glasses', 'The door is always open!'],
        ['Happy to see you, but text next time', 'A text isn’t that hard.'],
      ],
    },
    autres_anniversaire: {
      t: 'For your birthday, you dream of…',
      o: 'Ask them about their best birthday.',
      a: [
        ['A big party, everyone’s invited', 'I’ll bring confetti.'],
        ['Dinner with a few close friends', 'Small crowd, big moment.'],
        ['Being a little forgotten, honestly', 'My lips are sealed.'],
      ],
    },
    autres_conseil: {
      t: 'A friend asks your advice on a big decision.',
      o: 'Ask them about the best advice they ever got.',
      a: [
        ['We list the pros and cons', 'The list, ultimate weapon.'],
        ['Trust your gut', 'The gut is always right.'],
        ['We talk it over pizza', 'Pizza helps thinking, proven.'],
      ],
    },
    autres_rencontrer: {
      t: 'Meeting new people is, for you…',
      o: 'Ask them about the most unexpected encounter of their life.',
      a: [
        ['Intimidating', 'Don’t worry, I’ll do the introductions.'],
        ['Exhilarating', 'You’ll love what we’re preparing.'],
      ],
      m: 'Depends on the day, that’s normal.',
    },
    autres_proches: {
      t: 'With your people, you need…',
      o: 'Ask them how they stay in touch with their people.',
      a: [
        ['Lots of space', 'Air, air!'],
        ['Lots of presence', 'Does a minimoa hug count?'],
      ],
      m: 'Close, but not glued.',
    },
    autres_vacances: {
      t: 'A trip with friends: who organizes?',
      o: 'Ask them about their best trip with friends.',
      a: [
        ['Me, with a shared spreadsheet', 'Is there a “surprises” tab?'],
        ['I help out', 'The perfect right hand.'],
        ['The others, I go with the flow', 'You bring the good mood.'],
      ],
    },
    autres_voisins: {
      t: 'Your neighbors…',
      o: 'Ask them about the secret spot in their neighborhood.',
      a: [
        ['I know their names and their cat’s', 'The neighborhood is family.'],
        ['A polite hello on the stairs', 'Courteous and discreet.'],
        ['There are neighbors?', 'A mystery to solve.'],
      ],
    },
    autres_annule: {
      t: 'A plan falls through at the last minute.',
      o: 'Ask them what they do with a surprise free evening.',
      a: [
        ['Nice, a free evening', 'The best gift.'],
        ['Annoying, I had it all planned', 'Your calendar is crying a little.'],
      ],
    },
    gouts_voyage: {
      t: 'Your dream trip…',
      o: 'Ask them about the trip they dream of.',
      a: [
        ['A country where I don’t speak the language', 'Brushing up my dictionary.'],
        ['A house in the countryside, with friends', 'Happiness two hours away.'],
        ['A big city, museums and terraces', 'I’ll grab the subway map.'],
      ],
    },
    gouts_resto: {
      t: 'At a restaurant, you order…',
      o: 'Ask them about the strangest dish they’ve tasted.',
      a: [
        ['The dish I don’t know', 'Adventurous palate!'],
        ['My favorite, always the same', 'Why change what works?'],
      ],
    },
    gouts_musique: {
      t: 'Music tonight, more like…',
      o: 'Ask them which song they have on repeat.',
      a: [
        ['A whole album, headphones on', 'Sound journey, do not disturb.'],
        ['A concert, front row', 'I’ll scream the lyrics with you.'],
        ['A small bar with a local band', 'The best discoveries.'],
      ],
    },
    gouts_nature_ville: {
      t: 'To live, you prefer…',
      o: 'Ask them about their favorite nature spot, or city spot.',
      a: [
        ['Nature, silence', 'The birds say hello.'],
        ['The city, the energy', 'Neon is pretty too.'],
      ],
      m: 'A city with a big park?',
    },
    gouts_nouveau: {
      t: 'Trying new things…',
      o: 'Ask them about the last thing they tried for the first time.',
      a: [
        ['I prefer what I know', 'Safe bets are reassuring.'],
        ['Love it, the weirder the better', 'I found you a trapeze class.'],
      ],
      m: 'Now and then, yes.',
    },
    gouts_film: {
      t: 'A movie tonight?',
      o: 'Ask them which movie they could watch a hundred times.',
      a: [
        ['A classic I’ve seen ten times', 'You know every line.'],
        ['A subtitled gem nobody talks about', 'Niche! I’ll bring popcorn.'],
        ['The big movie of the moment', 'Thrills guaranteed.'],
      ],
    },
    gouts_fin_week_end: {
      t: 'A perfect weekend ends…',
      o: 'Ask them about their best Sunday evening.',
      a: [
        ['Somewhere I’d never been', 'Exploring is your thing.'],
        ['At home, with a good meal', 'Nothing beats your slippers.'],
      ],
    },
    gouts_temps_libre: {
      t: 'Your free time looks more like…',
      o: 'Ask them what they’re learning right now.',
      a: [
        ['Hobbies for fun, no goal', 'Fun is enough.'],
        ['Things I get better at (a language, an instrument)', 'Soon unbeatable.'],
      ],
    },
    gouts_saison: {
      t: 'Your favorite season…',
      o: 'Ask them for their best memory of their favorite season.',
      a: [
        ['Winter: blanket, soup, candles', 'The blanket is yours.'],
        ['Summer: terraces until midnight', 'Long evenings, yes!'],
        ['Fall: walks and crunchy leaves', 'Crunchy under my paws.'],
        ['Spring: everything starts again', 'The big wake-up.'],
      ],
    },
    gouts_surprise: {
      t: 'You get a surprise weekend: you don’t know where you’re going.',
      o: 'Ask them about the best surprise anyone gave them.',
      a: [
        ['A dream', 'Suitcase packed in five minutes.'],
        ['I’d at least like to know what to pack', 'Bringing a sweater is wisdom.'],
      ],
    },
  },
};
