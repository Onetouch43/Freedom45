/**
 * Curated side-hustle dataset (UK, £ only).
 *
 * Rules for anything written here:
 *  - Plain English. No jargon, no hype, no "easy money".
 *  - Money is always a WIDE typical range for a brand-new starter, and always
 *    paired in the UI with INCOME_CAVEAT. Never a promise, never an average
 *    someone can rely on.
 *  - `notFor` is the honest downside and must never be empty — it is the most
 *    useful part of the card.
 */

export type HustleTag =
  | "desk"
  | "creative"
  | "trades"
  | "health"
  | "teaching"
  | "tech"
  | "hospitality"
  | "sport"
  | "driving"
  | "any";

export type CostBand = "none" | "under-£100" | "over-£100";
export type SpeedBand = "days" | "weeks" | "months";

export type SideHustle = {
  /** Stable key stored in side_hustle_selections.hustle_key. Never change it. */
  key: string;
  title: string;
  /** One line, plain English. */
  summary: string;
  /** Who it tends to suit. "any" means no particular background needed. */
  fits: HustleTag[];
  /** Realistic weekly hours: min is what it needs to get going, max is where it becomes a small business. */
  hoursMin: number;
  hoursMax: number;
  cost: CostBand;
  /** Skill words, matched loosely against what the user picked in onboarding. */
  skills: string[];
  speed: SpeedBand;
  /** What the work actually involves, week to week. */
  involves: string;
  /** The honest downside. Required. */
  notFor: string;
  /** Wide typical range for a new starter, per month. Illustrative only. */
  income: string;
};

export const INCOME_CAVEAT =
  "Typical range for a new starter, illustrative and varies widely — not a promise of what you'd earn.";

export const COST_LABELS: Record<CostBand, string> = {
  none: "No upfront cost",
  "under-£100": "Under £100 to start",
  "over-£100": "Over £100 to start",
};

export const SPEED_LABELS: Record<SpeedBand, string> = {
  days: "First money usually within days",
  weeks: "First money usually within weeks",
  months: "Takes months to build up",
};

export const TAG_LABELS: Record<HustleTag, string> = {
  desk: "desk / office",
  creative: "creative",
  trades: "trades",
  health: "health & care",
  teaching: "teaching",
  tech: "tech",
  hospitality: "hospitality",
  sport: "sport & fitness",
  driving: "driving",
  any: "open to anyone",
};

export const SIDE_HUSTLES: SideHustle[] = [
  {
    key: "freelance-writing",
    title: "Freelance writing",
    summary: "Writing blog posts, product pages and articles for small businesses.",
    fits: ["desk", "creative", "any"],
    hoursMin: 4,
    hoursMax: 12,
    cost: "none",
    skills: ["Writing", "Social media"],
    speed: "weeks",
    involves:
      "Pitching or answering small paid writing jobs, then researching and drafting. Most of the work is editing and getting the brief right.",
    notFor:
      "Rates start low and you often wait a month to be paid. Chasing invoices and rejections is part of it.",
    income: "£50–£400 a month",
  },
  {
    key: "cv-writing",
    title: "CV and cover-letter writing",
    summary: "Rewriting CVs and cover letters for people job-hunting.",
    fits: ["desk", "teaching", "any"],
    hoursMin: 3,
    hoursMax: 8,
    cost: "none",
    skills: ["Writing", "Sales"],
    speed: "weeks",
    involves:
      "A short call with each client, then rewriting their CV in plain language. Steady demand in January and autumn.",
    notFor:
      "Purely seasonal at first, and you have to be comfortable asking people for money for a document they can't test until they get interviews.",
    income: "£40–£250 a month",
  },
  {
    key: "social-media-mgmt",
    title: "Social media for local businesses",
    summary: "Running the social accounts of a cafe, salon or tradesperson.",
    fits: ["desk", "creative", "any"],
    hoursMin: 5,
    hoursMax: 15,
    cost: "none",
    skills: ["Social media", "Design", "Writing"],
    speed: "weeks",
    involves:
      "A plan for the month, a batch of posts, replying to comments and a short report at the end. Little of it is glamorous.",
    notFor:
      "Clients judge you by follower numbers, which you don't control. Expect to be on your phone most evenings.",
    income: "£100–£600 a month",
  },
  {
    key: "bookkeeping",
    title: "Bookkeeping for sole traders",
    summary: "Keeping the books tidy for tiny firms that have no finance person.",
    fits: ["desk"],
    hoursMin: 4,
    hoursMax: 10,
    cost: "under-£100",
    skills: ["Bookkeeping", "Coding"],
    speed: "months",
    involves:
      "Monthly data entry and reconciling in accounting software, plus chasing receipts. Quietly repetitive, which suits some people.",
    notFor:
      "Clients expect you to be qualified or on a course, and mistakes on their tax are stressful. Most work is monthly and deadline-driven.",
    income: "£100–£500 a month",
  },
  {
    key: "virtual-assistant",
    title: "Virtual assistant",
    summary: "Handling admin, inboxes and bookings for small businesses remotely.",
    fits: ["desk", "any"],
    hoursMin: 5,
    hoursMax: 15,
    cost: "none",
    skills: ["Bookkeeping", "Social media", "Writing"],
    speed: "weeks",
    involves:
      "Diary management, email, invoices and odd jobs. You agree hours in advance and bill for them.",
    notFor:
      "Work arrives in bursts and clients can be disorganised. It is support work, so you are rarely the one making decisions.",
    income: "£150–£700 a month",
  },
  {
    key: "remote-admin",
    title: "Remote data and admin work",
    summary: "Short remote admin and data jobs done in fixed blocks of time.",
    fits: ["desk", "any"],
    hoursMin: 5,
    hoursMax: 15,
    cost: "none",
    skills: ["Bookkeeping"],
    speed: "weeks",
    involves:
      "Repetitive, well-specified tasks: entering data, checking lists, tidying spreadsheets. You are paid for the time you put in.",
    notFor:
      "Low hourly pay and little variety — and the good platforms have waiting lists for new starters.",
    income: "£100–£400 a month",
  },
  {
    key: "transcription",
    title: "Transcription and subtitling",
    summary: "Typing up interviews, podcasts and meeting recordings.",
    fits: ["desk", "any"],
    hoursMin: 4,
    hoursMax: 10,
    cost: "none",
    skills: ["Writing"],
    speed: "days",
    involves:
      "Listening and typing, usually with a foot pedal or keyboard shortcuts, then checking names and numbers.",
    notFor:
      "Piece rates can work out below minimum wage while you learn, and headphones for hours on end is genuinely tiring.",
    income: "£50–£300 a month",
  },
  {
    key: "podcast-editing",
    title: "Podcast editing",
    summary: "Cleaning up and publishing episodes for small shows.",
    fits: ["creative", "tech", "desk"],
    hoursMin: 4,
    hoursMax: 10,
    cost: "under-£100",
    skills: ["Video editing", "Design"],
    speed: "weeks",
    involves:
      "Cutting ums and pauses, balancing audio, adding music and writing the show notes. Deadlines are weekly.",
    notFor:
      "Every show has its own setup, so your first episode with a new client takes far longer than you quoted.",
    income: "£80–£450 a month",
  },
  {
    key: "video-editing",
    title: "Short-form video editing",
    summary: "Cutting clips for creators and small brands.",
    fits: ["creative", "tech", "desk"],
    hoursMin: 5,
    hoursMax: 15,
    cost: "under-£100",
    skills: ["Video editing", "Design", "Social media"],
    speed: "weeks",
    involves:
      "Turning long recordings into short vertical clips, adding captions, then revising until the client is happy.",
    notFor:
      "Revisions can be endless and turnaround is fast. You need your own decent laptop and to keep up with changing formats.",
    income: "£100–£700 a month",
  },
  {
    key: "design-freelance",
    title: "Design work for small businesses",
    summary: "Logos, menus, flyers and social templates for local firms.",
    fits: ["creative", "desk"],
    hoursMin: 4,
    hoursMax: 12,
    cost: "none",
    skills: ["Design", "Photography"],
    speed: "weeks",
    involves:
      "Briefing, roughs, then two or three rounds of changes. You need to write down what is included before you start.",
    notFor:
      "Everyone has an opinion on design and clients often want free extra rounds. Finding the second client is slower than the first.",
    income: "£80–£600 a month",
  },
  {
    key: "illustration-commissions",
    title: "Illustration and portrait commissions",
    summary: "Drawing or painting pieces people buy as gifts.",
    fits: ["creative"],
    hoursMin: 5,
    hoursMax: 12,
    cost: "under-£100",
    skills: ["Design", "Photography"],
    speed: "weeks",
    involves:
      "Taking a commission, agreeing a price, then working through drafts. Gifts mean a rush before Christmas and Mother's Day.",
    notFor:
      "Demand is lumpy and driven by occasions, and people underestimate what a good handmade piece should cost.",
    income: "£60–£500 a month",
  },
  {
    key: "handmade-crafts",
    title: "Selling handmade crafts online",
    summary: "Candles, jewellery or prints sold through an online shop.",
    fits: ["creative", "trades"],
    hoursMin: 5,
    hoursMax: 12,
    cost: "under-£100",
    skills: ["Design", "DIY & repairs", "Photography"],
    speed: "months",
    involves:
      "Making stock, photographing it well, writing listings and posting orders. Marketing is most of the job.",
    notFor:
      "Most shops sell very little in the first year while fees and materials still cost money. Photographing well is harder than making.",
    income: "£20–£300 a month",
  },
  {
    key: "cake-orders",
    title: "Cake and bake orders",
    summary: "Birthday cakes, celebration bakes and treat boxes to order.",
    fits: ["hospitality", "creative"],
    hoursMin: 5,
    hoursMax: 12,
    cost: "under-£100",
    skills: ["Cooking", "Design"],
    speed: "weeks",
    involves:
      "Taking orders weeks ahead, buying ingredients, baking and decorating to a photo the customer sent.",
    notFor:
      "Weekends and evenings disappear, and you need food hygiene training and insurance if you sell to the public.",
    income: "£80–£500 a month",
  },
  {
    key: "meal-prep",
    title: "Weekly meal prep for busy locals",
    summary: "Cooking and delivering a set number of meals each week.",
    fits: ["hospitality", "health"],
    hoursMin: 5,
    hoursMax: 12,
    cost: "under-£100",
    skills: ["Cooking"],
    speed: "weeks",
    involves:
      "A fixed menu, one big cook day, portioning and delivering on the same day every week.",
    notFor:
      "Hard physical work in a hot kitchen, and you carry the risk if someone doesn't like the food. Food hygiene rules apply.",
    income: "£100–£500 a month",
  },
  {
    key: "cleaning-rounds",
    title: "Regular cleaning rounds",
    summary: "Weekly cleans for homes and small offices.",
    fits: ["trades", "hospitality", "any"],
    hoursMin: 5,
    hoursMax: 15,
    cost: "under-£100",
    skills: ["DIY & repairs"],
    speed: "days",
    involves:
      "The same houses on the same days each week, usually two to four hours each, plus travel between them.",
    notFor:
      "Physically tiring and travel between jobs eats your time. You are paid for the job, not the journey.",
    income: "£200–£800 a month",
  },
  {
    key: "gardening-rounds",
    title: "Gardening and lawn rounds",
    summary: "Cutting grass and tidying gardens on a regular round.",
    fits: ["trades", "sport"],
    hoursMin: 5,
    hoursMax: 15,
    cost: "under-£100",
    skills: ["DIY & repairs"],
    speed: "days",
    involves:
      "Mowing, edging and weeding on a rota, with your own mower and strimmer in the boot of the car.",
    notFor:
      "Almost all the money lands between spring and early autumn, and rain wipes out days you had planned.",
    income: "£150–£700 a month",
  },
  {
    key: "handyman",
    title: "Small repairs and flat-pack assembly",
    summary: "Odd jobs people can't or won't do themselves.",
    fits: ["trades"],
    hoursMin: 6,
    hoursMax: 15,
    cost: "over-£100",
    skills: ["DIY & repairs"],
    speed: "days",
    involves:
      "Hanging shelves, sealing, assembling furniture and small fixes, quoting each job before you start.",
    notFor:
      "You carry the cost if something breaks, so consider insurance, and weekend slots go first.",
    income: "£200–£900 a month",
  },
  {
    key: "decorating",
    title: "Painting and decorating",
    summary: "Painting rooms and hallways for homeowners.",
    fits: ["trades"],
    hoursMin: 8,
    hoursMax: 20,
    cost: "over-£100",
    skills: ["DIY & repairs"],
    speed: "weeks",
    involves:
      "Prepping and filling, then two or three coats. Jobs usually run over several evenings and weekends.",
    notFor:
      "Needs a big block of hours and a lot of kit, and a bad finish is very visible. Mostly weekend work.",
    income: "£200–£1,000 a month",
  },
  {
    key: "car-valeting",
    title: "Car cleaning and valeting",
    summary: "Cleaning cars at people's homes or workplaces.",
    fits: ["driving", "trades"],
    hoursMin: 6,
    hoursMax: 15,
    cost: "over-£100",
    skills: ["DIY & repairs"],
    speed: "days",
    involves:
      "Washing, vacuuming and polishing, usually on driveways, with your own water and equipment if there's no tap.",
    notFor:
      "Weather-dependent and cold in winter, and you need your own kit and transport from the start.",
    income: "£150–£700 a month",
  },
  {
    key: "man-with-van",
    title: "Man with a van",
    summary: "Small moves, tip runs and furniture collections.",
    fits: ["driving", "trades"],
    hoursMin: 5,
    hoursMax: 15,
    cost: "over-£100",
    skills: ["DIY & repairs"],
    speed: "weeks",
    involves:
      "Taking bookings, lifting and carrying, and helping people move the odd sofa or washing machine.",
    notFor:
      "You need a van, appropriate insurance and a good back. Jobs arrive on weekends and at month-end.",
    income: "£150–£900 a month",
  },
  {
    key: "delivery-driving",
    title: "Delivery driving",
    summary: "Food or parcel deliveries on shifts you choose.",
    fits: ["driving", "any"],
    hoursMin: 6,
    hoursMax: 20,
    cost: "under-£100",
    skills: [],
    speed: "days",
    involves:
      "Booking shifts in an app, collecting and dropping off, and working through a route in the rain.",
    notFor:
      "Pay is per drop, so quiet evenings earn very little, and you must check that your car insurance covers the work.",
    income: "£100–£600 a month",
  },
  {
    key: "swim-teaching",
    title: "Swimming teaching",
    summary: "Weekend lessons for children and adult beginners.",
    fits: ["sport", "teaching", "health"],
    hoursMin: 4,
    hoursMax: 10,
    cost: "under-£100",
    skills: ["Fitness coaching"],
    speed: "months",
    involves:
      "Small groups or one-to-ones in the pool, working to the badge scheme the pool uses.",
    notFor:
      "Most pools ask for a recognised teaching qualification and a DBS check, so it takes a while to start.",
    income: "£100–£400 a month",
  },
  {
    key: "personal-training",
    title: "Personal training",
    summary: "One-to-one or small-group sessions at a gym or in a park.",
    fits: ["sport", "health"],
    hoursMin: 6,
    hoursMax: 15,
    cost: "under-£100",
    skills: ["Fitness coaching"],
    speed: "weeks",
    involves:
      "Programming sessions, coaching, and keeping notes on each client's progress. Early mornings are the busiest slots.",
    notFor:
      "You need a recognised qualification and insurance, and clients drift away, so you are always re-selling yourself.",
    income: "£200–£900 a month",
  },
  {
    key: "online-fitness",
    title: "Online workout plans",
    summary: "Selling training plans and weekly check-ins online.",
    fits: ["sport", "health", "creative"],
    hoursMin: 5,
    hoursMax: 12,
    cost: "none",
    skills: ["Fitness coaching", "Video editing", "Social media"],
    speed: "months",
    involves:
      "Writing plans, filming short clips and replying to check-in messages. Most of the job is content, not coaching.",
    notFor:
      "It takes a long time to get noticed and free advice is everywhere. Nobody buys until they trust you.",
    income: "£80–£500 a month",
  },
  {
    key: "junior-sports-coaching",
    title: "Coaching junior teams",
    summary: "Coaching kids' teams, holiday clubs and after-school sessions.",
    fits: ["sport", "teaching"],
    hoursMin: 4,
    hoursMax: 10,
    cost: "under-£100",
    skills: ["Fitness coaching"],
    speed: "weeks",
    involves:
      "Running sessions on evenings or weekends, planning drills and dealing with parents.",
    notFor:
      "Almost entirely weekends and holidays, and clubs ask for a DBS check and often a coaching badge.",
    income: "£100–£500 a month",
  },
  {
    key: "care-companion",
    title: "Paired or companion care visits",
    summary: "Regular visits to older people for company and everyday help.",
    fits: ["health", "any"],
    hoursMin: 5,
    hoursMax: 12,
    cost: "under-£100",
    skills: [],
    speed: "weeks",
    involves:
      "The same person on the same days: a chat, a cup of tea, shopping or a short walk out together.",
    notFor:
      "Emotionally heavy, and it needs a DBS check and a tolerance for things changing as people get older.",
    income: "£150–£600 a month",
  },
  {
    key: "tutoring-gcse",
    title: "GCSE and A-level tutoring",
    summary: "One-to-one tutoring in a subject you know well.",
    fits: ["teaching", "any", "desk"],
    hoursMin: 3,
    hoursMax: 8,
    cost: "none",
    skills: ["Tutoring", "Writing"],
    speed: "weeks",
    involves:
      "Weekly hour-long sessions, in person or online, plus marking and planning. Demand peaks before exams.",
    notFor:
      "Most of the demand is 4pm–8pm and in term time, so it competes with your own evenings and school holidays are dead.",
    income: "£150–£600 a month",
  },
  {
    key: "teaching-english-online",
    title: "Online English conversation practice",
    summary: "Conversation sessions for adults learning English.",
    fits: ["teaching", "any"],
    hoursMin: 4,
    hoursMax: 10,
    cost: "none",
    skills: ["Tutoring", "Writing"],
    speed: "weeks",
    involves:
      "Short video calls with learners abroad, often at awkward UK hours, and a little prep between sessions.",
    notFor:
      "Platforms take a big cut and many require a teaching certificate. Early mornings and late nights are the busy slots.",
    income: "£100–£500 a month",
  },
  {
    key: "music-lessons",
    title: "Music lessons",
    summary: "Teaching an instrument or singing, usually after school.",
    fits: ["teaching", "creative"],
    hoursMin: 3,
    hoursMax: 8,
    cost: "under-£100",
    skills: ["Tutoring"],
    speed: "weeks",
    involves:
      "Half-hour or hour lessons on a fixed weekly slot, planning for each pupil and preparing them for grades.",
    notFor:
      "Lesson slots are 4pm–7pm in term time only, and pupils drop out at exam time or when money is tight.",
    income: "£80–£400 a month",
  },
  {
    key: "web-freelance",
    title: "Small website jobs",
    summary: "Building or fixing simple sites for local businesses.",
    fits: ["tech", "desk"],
    hoursMin: 6,
    hoursMax: 15,
    cost: "none",
    skills: ["Coding", "Design"],
    speed: "weeks",
    involves:
      "Understanding what a business needs, building a few pages, wiring up a form and handing over.",
    notFor:
      "You can be asked to fix something six months later for free, so agree what support includes upfront.",
    income: "£150–£900 a month",
  },
  {
    key: "website-templates",
    title: "Websites from templates",
    summary: "Fast, simple brochure sites set up from a template you know well.",
    fits: ["tech", "desk", "creative"],
    hoursMin: 6,
    hoursMax: 15,
    cost: "under-£100",
    skills: ["Coding", "Design"],
    speed: "weeks",
    involves:
      "Duplicating your template, swapping in text and photos, and connecting a domain and hosting.",
    notFor:
      "Lower prices than custom work, and clients often don't have their text or photos ready, which stalls the job.",
    income: "£100–£700 a month",
  },
  {
    key: "no-code-automation",
    title: "Spreadsheet and automation jobs",
    summary: "Tidying messy spreadsheets and connecting the tools small firms use.",
    fits: ["tech", "desk"],
    hoursMin: 5,
    hoursMax: 12,
    cost: "none",
    skills: ["Coding", "Bookkeeping"],
    speed: "weeks",
    involves:
      "Working out what a business actually does, then building a sheet or simple automation that saves them time.",
    notFor:
      "You have to be patient with how other people work, and small firms rarely have a budget for this.",
    income: "£120–£600 a month",
  },
  {
    key: "event-photography",
    title: "Event and family photography",
    summary: "Shooting parties, family gatherings and small events.",
    fits: ["creative"],
    hoursMin: 6,
    hoursMax: 12,
    cost: "over-£100",
    skills: ["Photography", "Design"],
    speed: "weeks",
    involves:
      "A few hours shooting, then a much longer evening choosing and editing the photos before sending them over.",
    notFor:
      "Almost always weekends and evenings, you need your own camera and lenses, and editing takes longer than the shoot.",
    income: "£100–£800 a month",
  },
  {
    key: "festival-shifts",
    title: "Event and festival shifts",
    summary: "Paid shifts pouring drinks or serving at events.",
    fits: ["hospitality", "any"],
    hoursMin: 6,
    hoursMax: 16,
    cost: "none",
    skills: [],
    speed: "days",
    involves:
      "Booking shifts through an agency, working a stand or bar, and often travelling to a venue or festival site.",
    notFor:
      "Long shifts on your feet, unsocial hours, and work is bunched into summer and December.",
    income: "£150–£600 a month",
  },
  {
    key: "market-stall",
    title: "Weekend market stall",
    summary: "Selling at a market or car-boot sale.",
    fits: ["hospitality", "trades"],
    hoursMin: 6,
    hoursMax: 12,
    cost: "over-£100",
    skills: ["Sales", "Cooking", "DIY & repairs"],
    speed: "weeks",
    involves:
      "Buying or making stock, booking a pitch, setting up early and standing at the stall all day.",
    notFor:
      "Pitch fees are paid whether you sell or not, and you can end a day with unsold stock and no profit.",
    income: "£50–£500 a month",
  },
  {
    key: "reselling",
    title: "Buying and reselling",
    summary: "Flipping clothes, furniture or bits from car boots and charity shops.",
    fits: ["any", "creative"],
    hoursMin: 5,
    hoursMax: 12,
    cost: "under-£100",
    skills: ["Sales", "Photography"],
    speed: "weeks",
    involves:
      "Sourcing, cleaning and photographing items, writing listings and packing them up to post.",
    notFor:
      "Your money is tied up in stock that may never sell, and you need somewhere to keep it.",
    income: "£50–£400 a month",
  },
  {
    key: "dog-walking",
    title: "Dog walking and pet sitting",
    summary: "Walking dogs and looking after pets while owners are out.",
    fits: ["any", "sport"],
    hoursMin: 4,
    hoursMax: 12,
    cost: "none",
    skills: [],
    speed: "days",
    involves:
      "Fixed walks at the same times each weekday, collecting and returning dogs, and sending owners an update.",
    notFor:
      "Midday and early morning are the only slots people want, and it happens in every kind of weather.",
    income: "£80–£500 a month",
  },
  {
    key: "house-sitting",
    title: "House and pet sitting",
    summary: "Staying in someone's home while they're away.",
    fits: ["any"],
    hoursMin: 4,
    hoursMax: 10,
    cost: "none",
    skills: [],
    speed: "weeks",
    involves:
      "Moving in for a few nights or weeks, keeping the place tidy, watering plants or feeding a cat.",
    notFor:
      "You have to be free to be there, so it doesn't fit around a full social life, and you're responsible for someone's home.",
    income: "£60–£400 a month",
  },
  {
    key: "airbnb-room",
    title: "Renting out a spare room",
    summary: "Short lets of a spare room while you're there.",
    fits: ["hospitality", "any"],
    hoursMin: 4,
    hoursMax: 10,
    cost: "none",
    skills: [],
    speed: "weeks",
    involves:
      "Writing a good listing, answering messages quickly, cleaning between guests and handling keys.",
    notFor:
      "Strangers in your home, and you must check your tenancy or mortgage terms and any local rules first.",
    income: "£200–£800 a month",
  },
];

/** Fast lookup used by the save/remove server functions. */
export const HUSTLE_BY_KEY: Record<string, SideHustle> = Object.fromEntries(
  SIDE_HUSTLES.map((h) => [h.key, h]),
);
