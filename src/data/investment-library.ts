/**
 * Freedom45 — UK investment information library (paid tier).
 *
 * WHAT THIS FILE IS: content only. No JSX, no styling, no routing. The library
 * page imports LIBRARY_ENTRIES and LIBRARY_INTRO and renders them.
 *
 * HARD RULES for anything written here (owner's legal posture):
 *  - Information, never advice. No "you should", no "best", no "recommended",
 *    no star ratings, no ranking, no urgency.
 *  - No product, fund or provider names, anywhere, ever.
 *  - No promises of returns. Investments can fall as well as rise, and the copy
 *    says so wherever it matters.
 *  - Every number in a `facts` array carries a named source, a URL and the date
 *    it was checked. If a figure could not be verified it is NOT in this file.
 *  - Worked examples are arithmetic on stated assumptions, labelled as such.
 *    They are not forecasts and the copy says so in the same breath.
 *
 * Figures were checked against GOV.UK (plus the ONS, the Bank of England and the
 * FSCS where GOV.UK does not publish the number) on 9 November 2026, in the
 * 2026/27 tax year. Allowances change; re-check before each tax year.
 */

/** Every fact in this file was checked on this date. */
export const CHECKED_ON = "2026-11-09";

/** Human-readable version of the date, for the "checked on" line on screen. */
export const CHECKED_ON_LABEL = "9 November 2026";

/** The tax year the figures belong to. */
export const TAX_YEAR = "2026/27";

export type LibraryFact = {
  /** Short noun phrase, e.g. "ISA allowance". */
  label: string;
  /** The figure, with its unit, e.g. "£20,000 per tax year". */
  value: string;
  /** Publisher, e.g. "GOV.UK". Shown next to the figure. */
  source: string;
  /** Full URL of the page the figure was read from. */
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) the figure was checked. */
  checkedOn: string;
};

export type WorkedExampleRow = {
  label: string;
  value: string;
};

export type WorkedExample = {
  title: string;
  /** The assumptions, listed on screen above the numbers. Never hidden. */
  assumptions: string[];
  rows: WorkedExampleRow[];
  /** The "this is not a forecast" line. Required on every worked example. */
  note: string;
};

export type LibraryGroup =
  | "Starting out"
  | "Tax wrappers"
  | "Pensions"
  | "How investing behaves";

export type LibraryEntry = {
  /** Stable key for routing and analytics. Never change it. */
  id: string;
  title: string;
  /** One line, plain English, no jargon. */
  summary: string;
  group: LibraryGroup;
  /** 2–4 short paragraphs. Each one should fit a phone screen. */
  body: string[];
  /** The mechanics, in a sentence or three. */
  howItWorks: string;
  /** What the thing is actually for — descriptive, not a recommendation. */
  whatItsFor: string;
  /** The honest downside. Never empty. */
  watchOutFor: string;
  facts: LibraryFact[];
  workedExample?: WorkedExample;
};

/* ------------------------------------------------------------------ */
/* Sources, kept in one place so they are easy to re-check each year. */
/* ------------------------------------------------------------------ */

const SRC = {
  isa: "https://www.gov.uk/individual-savings-accounts",
  isaHow: "https://www.gov.uk/individual-savings-accounts/how-isas-work",
  lisa: "https://www.gov.uk/lifetime-isa",
  lisaWho: "https://www.gov.uk/lifetime-isa/who-can-open-a-lifetime-isa",
  lisaWithdraw:
    "https://www.gov.uk/lifetime-isa/withdrawing-money-from-your-lifetime-isa",
  savingsTax:
    "https://www.gov.uk/apply-tax-free-interest-on-savings/how-much-is-tax-free",
  wpJoining: "https://www.gov.uk/workplace-pensions/joining-a-workplace-pension",
  wpPay:
    "https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay",
  wpChanging:
    "https://www.gov.uk/workplace-pensions/changing-jobs-and-taking-leave",
  personalPension:
    "https://www.gov.uk/personal-pensions-your-rights/what-you-can-do",
  annualAllowance: "https://www.gov.uk/tax-on-your-private-pension/annual-allowance",
  mpaa: "https://www.gov.uk/guidance/work-out-your-allowances-if-youve-flexibly-accessed-your-pension",
  lumpSum: "https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance",
  nsp: "https://www.gov.uk/new-state-pension/what-youll-get",
  nspElig: "https://www.gov.uk/new-state-pension/eligibility",
  spaTimetable: "https://www.gov.uk/government/news/state-pension-age-review",
  spaReview:
    "https://www.gov.uk/government/collections/third-state-pension-age-review",
  fscs: "https://www.fscs.org.uk/what-we-cover/",
  cpi: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/september2026",
  boeTarget: "https://www.bankofengland.co.uk/monetary-policy/inflation",
} as const;

/** Builds a fact with today's check date, so no entry can forget it. */
const fact = (
  label: string,
  value: string,
  source: string,
  sourceUrl: string,
): LibraryFact => ({ label, value, source, sourceUrl, checkedOn: CHECKED_ON });

/* ------------------------------------------------------------------ */
/* Page-level copy.                                                    */
/* ------------------------------------------------------------------ */

export const LIBRARY_INTRO = {
  title: "Investment library",
  standfirst:
    "Plain-English explanations of the UK accounts, pensions and ideas you will meet first — with the government's own figures beside them.",
  paragraphs: [
    "Every figure here was read off the government page named next to it, on the date shown. Where a rule changes every year — allowances, thresholds, rates — the tax year is written next to the number.",
    "Nothing here tells you what to do with your money. There are no product names, no comparisons and no forecasts. Worked examples are arithmetic on assumptions we show you, and they are labelled as such.",
  ],
  /** Shown at the top of the library and on every entry. */
  disclaimer:
    "Freedom45 provides educational estimates only. Not financial, investment, or tax advice. Projections are illustrative and based on assumptions you provide. Past performance does not guarantee future results. Consult a licensed professional.",
  /** The line under the "checked on" stamp. */
  checkedOnLabel: CHECKED_ON_LABEL,
  taxYear: TAX_YEAR,
  /** Shown once at the foot of the library page. */
  footerNote:
    "Allowances, thresholds and rates are set by government and change. Figures were checked on the date above and may have changed since. Check GOV.UK before relying on any number.",
} as const;

/**
 * What the library deliberately does not do. Rendered as a short list at the
 * foot of the page, and worth keeping visible — it is the honest boundary.
 */
export const NOT_COVERED: string[] = [
  "It does not recommend anything. No 'best buys', no rankings, no star ratings, no 'you should'.",
  "It does not name or compare products, funds or providers.",
  "It does not give tax advice for your circumstances. Your tax position depends on facts this app does not collect.",
  "It does not forecast. No predicted returns, no predicted inflation, no predicted market movements.",
  "It does not cover debt, mortgages, buy-to-let or student loan repayment planning.",
  "It does not cover cryptoassets, peer-to-peer lending or any unregulated investment.",
];

/* ------------------------------------------------------------------ */
/* The entries, in the order a beginner meets them.                    */
/* ------------------------------------------------------------------ */

export const LIBRARY_ENTRIES: LibraryEntry[] = [
  {
    id: "cash-vs-investing",
    title: "Cash savings and investing",
    summary:
      "Cash keeps a fixed number of pounds. Investments can grow — and can fall.",
    group: "Starting out",
    body: [
      "Cash in a savings account is a fixed number of pounds that earns interest. The balance does not move with markets, so the number you see is the number you get back, subject to the bank still being there.",
      "Investing means putting money into something whose value changes — company shares, or a fund that holds many companies. The value moves up and down, sometimes a lot in a short time.",
      "The difference that matters over twenty years is inflation. If prices rise faster than your savings grow, the money buys less each year. That gap is easy to miss because the balance still goes up.",
      "They do different jobs. Cash is predictable and instantly available. Investments are not, which is why money needed in the next couple of years is often held as cash instead.",
    ],
    howItWorks:
      "Cash: you deposit, the bank pays interest, and the balance is fixed in pounds. Investing: you buy units in a fund, the fund holds shares or bonds, and the price is set by the market each day.",
    whatItsFor:
      "Cash is used for an emergency buffer and for money needed in the next few years. Investing is used for money that can be left alone for a long time, where the aim is growth rather than certainty.",
    watchOutFor:
      "Cash cannot fall in pounds, but it can lose buying power. Investments can fall in pounds, and nothing protects you from that. The compensation scheme covers a firm failing — it does not cover an investment going down.",
    facts: [
      fact(
        "Compensation limit, cash deposits",
        "£120,000 per eligible person, per bank, building society or credit union",
        "FSCS",
        SRC.fscs,
      ),
      fact(
        "Compensation limit, investment claims",
        "£85,000 per eligible person, per firm",
        "FSCS",
        SRC.fscs,
      ),
      fact(
        "Temporary high balances",
        "Up to £1.4 million protected for six months in limited circumstances",
        "FSCS",
        SRC.fscs,
      ),
      fact(
        "Inflation (CPI), 12 months to September 2026",
        "3.5%",
        "Office for National Statistics",
        SRC.cpi,
      ),
      fact(
        "The government's inflation target",
        "2%",
        "Bank of England",
        SRC.boeTarget,
      ),
    ],
    workedExample: {
      title: "What inflation does to cash",
      assumptions: [
        "£10,000 left in cash for 20 years",
        "Interest of 1.5% a year",
        "Prices rising 3.5% a year — the rate to September 2026, held flat",
        "No withdrawals, and the rate never changes",
      ],
      rows: [
        { label: "Money in the account after 20 years", value: "£13,469" },
        {
          label: "What that buys, in today's prices",
          value: "about £6,800",
        },
      ],
      note: "Illustration only. Interest rates and inflation both move, and neither is predicted here. This is arithmetic on the assumptions above, not a forecast.",
    },
  },

  {
    id: "stocks-and-shares-isa",
    title: "Stocks & Shares ISA",
    summary:
      "A tax-free container for investments. The tax break is on the growth, not on the investments themselves.",
    group: "Tax wrappers",
    body: [
      "An ISA is a wrapper, not an investment. You choose what goes inside it, and the wrapper decides how that money is taxed.",
      "Inside a Stocks & Shares ISA you can hold funds, company shares, bonds and similar investments. Interest, dividends and growth in value are free of UK tax, and you do not declare them on a tax return.",
      "You can pay in up to £20,000 in the 2026/27 tax year. That limit covers all your ISAs added together, and it can be split across different types.",
      "What it does not do: it does not stop the investments falling, and it does not make a poor choice a good one. The wrapper changes the tax; it does not change the market.",
    ],
    howItWorks:
      "You open an ISA with a provider, pay money in, and buy investments inside it. The allowance resets each tax year, which runs from 6 April to 5 April. Growth and income stay inside the wrapper and are not taxed.",
    whatItsFor:
      "It is used by people who want to invest outside a pension and keep the tax off the growth. Because there is no tax to reclaim on the way in, it is simpler than a pension, but it has none of a pension's tax relief.",
    watchOutFor:
      "The allowance is per person, per tax year, and unused allowance does not carry forward. You can hold the same investments outside an ISA, but then the tax rules are different. Charges apply inside an ISA too, and they are not capped by the wrapper.",
    facts: [
      fact(
        "ISA allowance, 2026/27",
        "£20,000 per person, per tax year",
        "GOV.UK",
        SRC.isa,
      ),
      fact(
        "What is not taxed inside an ISA",
        "Interest on cash, income and capital gains from investments",
        "GOV.UK",
        SRC.isaHow,
      ),
      fact(
        "The tax year",
        "6 April to 5 April",
        "GOV.UK",
        SRC.isaHow,
      ),
      fact(
        "Who can open an ISA",
        "UK resident, or a member of the armed forces or a Crown servant (or their spouse or civil partner) if living abroad; 18 or over",
        "GOV.UK",
        SRC.isa,
      ),
    ],
  },

  {
    id: "cash-isa",
    title: "Cash ISA",
    summary:
      "A savings account whose interest is not taxed. The trade-off is the same one cash has everywhere: certainty instead of growth.",
    group: "Tax wrappers",
    body: [
      "A Cash ISA is an ordinary savings account with one difference: the interest is not taxed, and you do not declare it.",
      "Outside an ISA, most people have some tax-free interest anyway. Basic-rate taxpayers get £1,000 a year of interest tax-free, higher-rate taxpayers £500, and additional-rate taxpayers nothing. Above that, interest is taxed as income.",
      "So the tax saving from a Cash ISA is largest when interest rates are high or the balance is large — the point where the interest would otherwise start being taxed.",
      "Compared with a Stocks & Shares ISA, the trade-off is certainty against growth. Cash does not fall in pounds; it also does not compound the way investments can, and inflation still applies to it.",
    ],
    howItWorks:
      "Same as any savings account: you deposit, the provider pays interest, and you can usually withdraw when you like. The ISA wrapper means the interest is exempt from UK tax. The £20,000 annual ISA allowance covers Cash ISAs and Stocks & Shares ISAs together.",
    whatItsFor:
      "It is used for savings that need to be safe and reachable — an emergency fund, a deposit being built, money for a known cost in the next year or two.",
    watchOutFor:
      "The tax saving can be small if your interest would have been under the Personal Savings Allowance anyway. And like any cash, it can lose buying power if prices rise faster than the interest rate.",
    facts: [
      fact(
        "Personal Savings Allowance, basic rate",
        "£1,000 of interest a year tax-free",
        "GOV.UK",
        SRC.savingsTax,
      ),
      fact(
        "Personal Savings Allowance, higher rate",
        "£500 of interest a year tax-free",
        "GOV.UK",
        SRC.savingsTax,
      ),
      fact(
        "Personal Savings Allowance, additional rate",
        "£0 — no allowance",
        "GOV.UK",
        SRC.savingsTax,
      ),
      fact(
        "ISA allowance, 2026/27",
        "£20,000 per person, per tax year, across all ISA types",
        "GOV.UK",
        SRC.isaHow,
      ),
      fact(
        "Compensation limit, cash deposits",
        "£120,000 per eligible person, per bank, building society or credit union",
        "FSCS",
        SRC.fscs,
      ),
    ],
  },

  {
    id: "lifetime-isa",
    title: "Lifetime ISA",
    summary:
      "A savings or investing account with a 25% government bonus, for a first home or later life — with a charge if you take the money out for anything else.",
    group: "Tax wrappers",
    body: [
      "A Lifetime ISA (LISA) works like other ISAs, with a government bonus added on top. You can hold cash, investments, or a mix.",
      "The government adds 25% to what you pay in, up to £1,000 of bonus a year. That means £4,000 paid in gets a £1,000 top-up, for £5,000 in the account.",
      "You can pay in up to £4,000 a year, and that counts towards your £20,000 ISA allowance. Payments can continue until you are 50.",
      "The money is meant for two things: a first home, or later life. Take it out for anything else before 60 and a 25% charge applies — which takes back more than the bonus. That charge is the part people are most often surprised by.",
    ],
    howItWorks:
      "You must be 18 or over and under 40 to open one, and you must make your first payment before you turn 40. You can pay in until 50. The bonus is claimed by the provider and added to the account. Withdrawals for a first home (worth £450,000 or less, bought with a mortgage, at least 12 months after your first payment) or from age 60 are free of the charge. Withdrawals for any other reason before 60 are not.",
    whatItsFor:
      "It is used by people saving towards a first home who also want the money to keep working for retirement if the purchase does not happen. The bonus is the reason it exists; the conditions are the price of it.",
    watchOutFor:
      "The 25% charge is not a refund of the bonus — it is larger. Put in £4,000, get a £1,000 bonus, and the pot is £5,000. Withdraw it all early and the 25% charge is £1,250, leaving £3,750: less than you paid in. Money you might need before 60 for anything other than a first home does not sit comfortably here.",
    facts: [
      fact(
        "Annual Lifetime ISA payment limit",
        "£4,000 per tax year",
        "GOV.UK",
        SRC.lisa,
      ),
      fact(
        "Government bonus",
        "25% of what you pay in",
        "GOV.UK",
        SRC.lisa,
      ),
      fact(
        "Maximum bonus per year",
        "£1,000",
        "GOV.UK",
        SRC.lisa,
      ),
      fact(
        "Age to open",
        "18 or over and under 40, with the first payment made before age 40",
        "GOV.UK",
        SRC.lisaWho,
      ),
      fact(
        "Age payments stop",
        "50 — the account stays open and keeps earning",
        "GOV.UK",
        SRC.lisa,
      ),
      fact(
        "Withdrawal charge",
        "25% of the amount withdrawn, before age 60, for anything other than a qualifying first home",
        "GOV.UK",
        SRC.lisaWithdraw,
      ),
      fact(
        "Property price limit for the first-home bonus",
        "£450,000 — above that a 20% withdrawal charge applies",
        "GOV.UK",
        SRC.lisaWithdraw,
      ),
      fact(
        "Counts towards the ISA allowance",
        "Yes — the £4,000 sits inside the £20,000 annual ISA allowance",
        "GOV.UK",
        SRC.lisa,
      ),
    ],
    workedExample: {
      title: "The bonus, and the charge that takes it back",
      assumptions: [
        "You pay in the full £4,000 in one tax year",
        "No investment growth, so the numbers are the bonus alone",
        "You then withdraw the whole pot before age 60 for something other than a first home",
      ],
      rows: [
        { label: "You pay in", value: "£4,000" },
        { label: "Government bonus added (25%)", value: "£1,000" },
        { label: "Pot", value: "£5,000" },
        { label: "Early withdrawal charge (25% of the pot)", value: "−£1,250" },
        { label: "You get back", value: "£3,750" },
      ],
      note: "Illustration only, with no growth assumed. The charge is calculated on the pot, not on your payments, which is why it can leave you with less than you put in.",
    },
  },

  {
    id: "workplace-pension",
    title: "Workplace pension",
    summary:
      "A pension your employer sets up and pays into. Your contribution, their contribution and tax relief all go in together.",
    group: "Pensions",
    body: [
      "A workplace pension is arranged by your employer. Money goes in every payday from your pay, your employer adds their own contribution, and the government adds tax relief.",
      "Most employers must enrol you automatically if you are aged between 22 and State Pension age and earn at least £10,000 a year. You can leave the scheme if you want to, and you can usually rejoin.",
      "The legal minimum is 8% of qualifying earnings in total: at least 3% from your employer and 5% from you, with tax relief making up part of your 5%.",
      "The employer contribution is the unusual part. It is money paid because you are in the scheme, it is not deducted from your pay, and it stops if you leave. Nothing else in this library works quite like that.",
    ],
    howItWorks:
      "Contributions are a percentage of your pay between a lower and an upper limit — £6,240 to £50,270 a year in most automatic enrolment schemes. The money is invested by the scheme and stays invested until you take it. Tax relief is added at your rate: the GOV.UK example is £40 from you, £30 from the employer and £10 tax relief, so £80 goes into the pension.",
    whatItsFor:
      "It is the default way most employees save for retirement, because it is arranged for you and someone else contributes. It is also money you cannot normally touch until you are older, which is the point of it.",
    watchOutFor:
      "The minimum rates are a floor set by law, not a target. Contributions come out of take-home pay, so your pay packet is smaller. When you change jobs the pension stays yours and stays invested, but the employer contribution stops — old pots can pile up, and it is worth knowing where they all are. You usually pay Income Tax when you take money out later.",
    facts: [
      fact(
        "Who is automatically enrolled",
        "Workers aged 22 to State Pension age, earning at least £10,000 a year, ordinarily working in the UK",
        "GOV.UK",
        SRC.wpJoining,
      ),
      fact(
        "Minimum total contribution",
        "8% of qualifying earnings",
        "GOV.UK",
        SRC.wpPay,
      ),
      fact(
        "Minimum employer contribution",
        "3% of qualifying earnings",
        "GOV.UK",
        SRC.wpPay,
      ),
      fact(
        "Minimum employee contribution",
        "5% of qualifying earnings",
        "GOV.UK",
        SRC.wpPay,
      ),
      fact(
        "Qualifying earnings band",
        "£6,240 to £50,270 a year in most automatic enrolment schemes",
        "GOV.UK",
        SRC.wpPay,
      ),
      fact(
        "Tax relief example",
        "£40 from you, £30 from your employer, £10 tax relief — £80 into the pension",
        "GOV.UK",
        SRC.wpPay,
      ),
      fact(
        "Lowest pay at which an employer must contribute (voluntary joiners)",
        "More than £520 a month, £120 a week, or £480 over 4 weeks",
        "GOV.UK",
        SRC.wpPay,
      ),
      fact(
        "What happens when you change jobs",
        "The pension stays yours and the money stays invested; you can usually carry on paying in or combine schemes",
        "GOV.UK",
        SRC.wpChanging,
      ),
    ],
  },

  {
    id: "personal-pension-sipp",
    title: "Personal pension and SIPP",
    summary:
      "A pension you arrange yourself, rather than one your employer sets up. A SIPP is the version where you choose the investments.",
    group: "Pensions",
    body: [
      "A personal pension is one you open yourself with a provider. Your employer may pay into it, but they are not running it. The money is invested by the provider, and what you end up with depends on what was paid in and how those investments did.",
      "A self-invested personal pension (SIPP) is a personal pension where you choose the specific investments inside it, rather than picking from a short list.",
      "Tax relief works the same way as in a workplace pension: the government adds money at your rate of Income Tax, and you usually pay tax when you take the money out.",
      "The annual allowance is £60,000 for 2026/27 — the total paid into all your pensions in a tax year before a tax charge applies. There is also a limit of 100% of your earnings.",
    ],
    howItWorks:
      "You pay in, the provider adds basic-rate tax relief, and higher or additional rate relief is claimed through Self Assessment. The money is invested and stays invested until you take it. If you have already taken money flexibly from a pension, the money purchase annual allowance cuts the amount you can pay in to £10,000.",
    whatItsFor:
      "It is used by people whose employer does not offer a scheme, by the self-employed, and by people who want a pension they control — for example, someone who wants to choose their own investments or keep everything in one place.",
    watchOutFor:
      "You are the one choosing the provider and, in a SIPP, the investments. Charges vary and are not capped in the way a workplace scheme's default is. Taking money out flexibly can reduce what you can pay in afterwards, and the tax rules on withdrawals are involved enough that GOV.UK sets out several separate limits.",
    facts: [
      fact(
        "Annual allowance, 2026/27",
        "£60,000 across all your pensions",
        "GOV.UK",
        SRC.annualAllowance,
      ),
      fact(
        "Limit on tax relief",
        "100% of your earnings in the year",
        "GOV.UK",
        SRC.annualAllowance,
      ),
      fact(
        "Carry forward",
        "Unused annual allowance from the previous 3 tax years can sometimes be used",
        "GOV.UK",
        SRC.annualAllowance,
      ),
      fact(
        "Tapered annual allowance threshold",
        "Reduced if threshold income is over £200,000 and adjusted income is over £260,000",
        "GOV.UK",
        SRC.annualAllowance,
      ),
      fact(
        "Money purchase annual allowance",
        "£10,000, once you have flexibly accessed a pension pot",
        "GOV.UK",
        SRC.mpaa,
      ),
      fact(
        "Tax-free lump sum",
        "Usually up to 25% of the pot, capped by a lump sum allowance of £268,275",
        "GOV.UK",
        SRC.lumpSum,
      ),
      fact(
        "What a SIPP is",
        "A personal pension that lets you control the specific investments in the fund",
        "GOV.UK",
        SRC.personalPension,
      ),
    ],
  },

  {
    id: "state-pension",
    title: "State Pension",
    summary:
      "The government pension paid from State Pension age. It depends on your National Insurance record, not on what you saved.",
    group: "Pensions",
    body: [
      "The State Pension is paid by the government from State Pension age. How much you get depends on how many years of National Insurance contributions or credits you have — not on any pot of money in your name.",
      "You need 10 qualifying years to get anything, and 35 qualifying years to get the full new State Pension. The full rate is £241.30 a week for 2026/27.",
      "The age you can claim it from depends on when you were born. It is currently rising from 66 to 67 between April 2026 and April 2028, and it is legislated to rise from 67 to 68 between April 2044 and April 2046.",
      "A third review of State Pension age is under way, so the timetable can change. The amount also rises each year under the 'triple lock': the highest of average earnings growth, CPI inflation, or 2.5%.",
    ],
    howItWorks:
      "Each year you work and pay National Insurance, or receive credits (for example while caring for someone), counts as a qualifying year. Your record builds over your working life. You can check your own record and forecast on GOV.UK, and gaps can sometimes be filled with voluntary contributions.",
    whatItsFor:
      "It is a floor under retirement income, paid for life, and it is not affected by how markets perform. For planning purposes it is the one part of retirement income that does not depend on savings at all.",
    watchOutFor:
      "The amount is not guaranteed to be the full rate: part-time work, career breaks, time abroad and self-employment can all leave gaps in the record. The age you can claim from depends on when you were born, and it is reviewed regularly. The full rate for 2026/27 is £241.30 a week — a number worth setting against your own expected costs.",
    facts: [
      fact(
        "Full new State Pension, 2026/27",
        "£241.30 a week",
        "GOV.UK",
        SRC.nsp,
      ),
      fact(
        "Qualifying years for the full amount",
        "35 years",
        "GOV.UK",
        SRC.nsp,
      ),
      fact(
        "Minimum qualifying years for any State Pension",
        "10 years",
        "GOV.UK",
        SRC.nspElig,
      ),
      fact(
        "State Pension age timetable",
        "Rising from 66 to 67 between April 2026 and April 2028; from 67 to 68 between April 2044 and April 2046",
        "GOV.UK",
        SRC.spaTimetable,
      ),
      fact(
        "Annual increase rule",
        "The highest of average earnings growth, CPI inflation, or 2.5%",
        "GOV.UK",
        SRC.nsp,
      ),
      fact(
        "Current status of the age rules",
        "A third State Pension age review is under way",
        "GOV.UK",
        SRC.spaReview,
      ),
    ],
  },

  {
    id: "risk-and-volatility",
    title: "Risk and volatility",
    summary:
      "Volatility is how much a value swings around. It is not the same thing as losing money — but it is how losing money happens.",
    group: "How investing behaves",
    body: [
      "Volatility means how much a price moves up and down over time. A value that swings 20% in a year is more volatile than one that moves 2%.",
      "Investments can fall as well as rise. A £10,000 investment that falls 20% is worth £8,000, and it then needs to rise 25% just to get back to where it started. That asymmetry is why falls are felt more than rises.",
      "Time horizon changes the picture, but does not remove the risk. Over one year, share prices can be anywhere. Over twenty years, the range of outcomes is still wide — it is just that the money has longer to recover from a bad stretch, and longer to compound a good one.",
      "Risk is also personal and situational. Money you need next year is exposed to risk in a way that money you will not touch for twenty years is not, whatever the investment does.",
    ],
    howItWorks:
      "Prices move because buyers and sellers disagree about the future, and because news changes what people expect. Diversified funds smooth this a little because one company's bad news is diluted by many others, but the whole market can still fall at once — as it has in most decades.",
    whatItsFor:
      "Understanding volatility is what makes a time horizon useful. It is the reason people separate money they might need soon from money they can leave alone, rather than treating all savings the same.",
    watchOutFor:
      "A past run of good years is not evidence about the next one. Volatility also hides in places people do not look — a single company, a single sector, or a fund that is mostly one type of asset. And a fall is only a loss on paper until you sell; it becomes real when you do.",
    facts: [
      fact(
        "Inflation (CPI), 12 months to September 2026",
        "3.5%",
        "Office for National Statistics",
        SRC.cpi,
      ),
      fact(
        "The government's inflation target",
        "2%",
        "Bank of England",
        SRC.boeTarget,
      ),
    ],
  },

  {
    id: "compounding",
    title: "Compounding",
    summary:
      "Growth that earns growth. Small amounts, left alone for a long time, do more than most people expect.",
    group: "How investing behaves",
    body: [
      "Compounding is growth on growth. In year one you earn a return on what you paid in. In year two you earn a return on that too. The effect is small at first and large later: in a twenty-year period, most of the growth arrives in the later years.",
      "The example below puts £200 a month in for 20 years: £48,000 of your own money. At 3% a year it ends around £65,660. At 5%, £82,207. At 7%, £104,185.",
      "The three rates are not predictions. They are three assumptions, shown side by side, because the honest answer to 'what will I get?' is a range that depends on things nobody can know.",
      "The other half of compounding is time. Halving the period does not halve the result — it removes the years where compounding was doing the most.",
    ],
    howItWorks:
      "Each year's return is added to the pot, and the next year's return is calculated on the larger amount. Regular contributions join the pot and start compounding too. The same arithmetic works in reverse when charges or inflation are subtracted each year.",
    whatItsFor:
      "It is the reason a long horizon matters as much as the amount paid in, and the reason an early start is worth more than it looks. It applies to savings, pensions and investments alike.",
    watchOutFor:
      "Compounding only helps if the money stays invested, and it works against you when the annual figure is a charge or inflation rather than a return. A high return in one year followed by a fall is not the same as a steady return, even if the average looks similar.",
    facts: [],
    workedExample: {
      title: "£200 a month for 20 years",
      assumptions: [
        "£200 paid in every month for 20 years — £48,000 in total",
        "Returns of 3%, 5% and 7% a year, each held flat for the whole period",
        "Charges and tax ignored, so these are before both",
        "Nothing is withdrawn",
      ],
      rows: [
        { label: "Total paid in", value: "£48,000" },
        { label: "At 3% a year", value: "£65,660" },
        { label: "At 5% a year", value: "£82,207" },
        { label: "At 7% a year", value: "£104,185" },
      ],
      note: "Illustration only, not a forecast. Real returns vary year to year and can be negative. Nobody knows what the next 20 years will bring; this shows what the arithmetic does at three stated rates.",
    },
  },

  {
    id: "fees",
    title: "Fees and charges",
    summary:
      "A percentage charge is small on one statement and large over twenty years, because it compounds against you.",
    group: "How investing behaves",
    body: [
      "Most investments and pensions carry an annual charge, quoted as a percentage of what you hold. A platform charge, a fund charge, or both.",
      "The number looks trivial. On £10,000, 1% is £100 a year. But the charge is taken every year from a pot that would otherwise have grown, so the money it removes never gets the chance to compound.",
      "The example below uses the same contributions and the same 5% a year before charges, and changes only the annual charge: 0.2% against 1.0% over 20 years. The difference is about £6,980 — roughly 9% of the final value.",
      "That is why the percentage matters more than the label. 'Low cost' and 'simple' are descriptions, not numbers, and the number is the thing you can compare.",
    ],
    howItWorks:
      "An annual charge is usually deducted from the fund automatically, so you never see a bill — you just see a slightly smaller balance. It is charged on the whole pot, so the amount taken grows as the pot grows, even if the percentage stays the same.",
    whatItsFor:
      "Knowing the total annual charge is what makes two options comparable at all. It is also the one part of investing you can usually check before you commit, unlike returns.",
    watchOutFor:
      "Not every charge is an annual percentage. Some are flat fees, dealing fees, or exit charges, and a flat fee can be a larger share of a small pot than a percentage would be. Charges are also only one difference between two options — a cheap option that does not do what you need is not cheaper in any useful sense.",
    facts: [],
    workedExample: {
      title: "0.2% against 1.0% over 20 years",
      assumptions: [
        "£200 paid in every month for 20 years",
        "5% a year return before charges, identical in both cases",
        "The only difference is the annual charge: 0.2% or 1.0%",
        "No other fees, no tax, nothing withdrawn",
      ],
      rows: [
        { label: "Total paid in", value: "£48,000" },
        { label: "At a 0.2% annual charge", value: "£80,335" },
        { label: "At a 1.0% annual charge", value: "£73,355" },
        { label: "Difference", value: "about £6,980" },
      ],
      note: "Illustration only, not a forecast. It shows what a percentage charge does to a pot over time, not what any investment will return.",
    },
  },

  {
    id: "diversification",
    title: "Diversification",
    summary:
      "Spreading money across many holdings, so that one company's bad year is not your whole year.",
    group: "How investing behaves",
    body: [
      "Diversification means holding many different things rather than a few. A fund that holds hundreds of companies across several countries is diversified. One company's shares are not.",
      "The point is not to avoid losses — a diversified fund still falls when the market falls. The point is to avoid a single event wiping out your savings, which is what happens if everything you own depends on one employer, one industry or one country.",
      "Most people get diversification without trying, because funds hold many holdings by design. It becomes thin when a large share of your money sits in one stock — often the one you work for, or the one that has done well recently.",
      "Diversification does not remove risk. It spreads it, and it makes the outcome depend on many things rather than one.",
    ],
    howItWorks:
      "A fund pools money from many investors and buys many holdings. Your money is spread across all of them, so a fall in one holding affects a small slice of the total. Spreading across asset types — shares, bonds, cash — spreads it further, because they do not always move together.",
    whatItsFor:
      "It is the standard way to hold investments without depending on a single outcome. It is also why a single-fund approach is common: the fund does the spreading for you.",
    watchOutFor:
      "Diversification is not a guarantee, and two funds can quietly hold the same things. A global fund can be dominated by one country, and a 'safe' fund can still fall. Concentrated positions — a big holding in one company — carry more risk than the same money spread out.",
    facts: [],
  },
];

/* ------------------------------------------------------------------ */
/* Small helpers the page can use without repeating logic.             */
/* ------------------------------------------------------------------ */

/** Groups in the order they should be shown, with a label for each heading. */
export const LIBRARY_GROUPS: { id: LibraryGroup; label: string }[] = [
  { id: "Starting out", label: "Starting out" },
  { id: "Tax wrappers", label: "Tax wrappers" },
  { id: "Pensions", label: "Pensions" },
  { id: "How investing behaves", label: "How investing behaves" },
];

/** Entries in one group, in file order. */
export function entriesInGroup(group: LibraryGroup): LibraryEntry[] {
  return LIBRARY_ENTRIES.filter((entry) => entry.group === group);
}

/** A single entry by id, for the detail view. */
export function getLibraryEntry(id: string): LibraryEntry | undefined {
  return LIBRARY_ENTRIES.find((entry) => entry.id === id);
}

/** Every distinct source URL used in the file, for the "sources" list. */
export function allSourceUrls(): string[] {
  const urls = new Set<string>();
  for (const entry of LIBRARY_ENTRIES) {
    for (const f of entry.facts) urls.add(f.sourceUrl);
  }
  return [...urls];
}
