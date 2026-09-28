export type CampaignDiscipline =
  | "Emotion"
  | "Positioning"
  | "Tension"
  | "Structure"
  | "Reframe"
  | "Participation"
  | "Personalization"
  | "Product proof";

export type CampaignCase = {
  id: string;
  year: number;
  brand: string;
  name: string;
  discipline: CampaignDiscipline;
  mechanic: string;
  hook: string;
  originalMove: string;
  evidence: string;
  whyItWorked: string;
  recastLift: string;
  sourceUrl: string;
  sourceLabel: string;
  accent: string;
  deepDive?: boolean;
  recognitions?: Array<{
    archive: string;
    label: string;
    url: string;
  }>;
};

export type ResearchArchive = {
  id: "love-the-work-more" | "one-show" | "drum" | "ads-of-the-world" | "dandad";
  name: string;
  role: "Discovery mirror" | "Award authority" | "Effectiveness authority" | "Global discovery";
  coverage: string;
  strength: string;
  proves: string;
  caution: string;
  lenses: string[];
  url: string;
};

export const researchArchives: ResearchArchive[] = [
  {
    id: "love-the-work-more",
    name: "Love The Work More",
    role: "Discovery mirror",
    coverage: "Cannes Lions work · 1954 onward",
    strength: "Fast, free historical discovery across generations of Lions-winning work.",
    proves: "A campaign is worth investigating and which Lion level the compilation attributes to it.",
    caution: "It is an independent compilation, not the Cannes Lions authority. Verify award facts against The Work or another official record before publishing them.",
    lenses: ["Era", "Lion level", "Creative work"],
    url: "https://lovetheworkmore.com/about/",
  },
  {
    id: "one-show",
    name: "The One Show",
    role: "Award authority",
    coverage: "50+ years · advertising, design and emerging disciplines",
    strength: "Precise award, year, discipline, category, client and credited-company metadata.",
    proves: "Verified Pencil or Merit recognition and the craft discipline in which the work was judged.",
    caution: "A creative award is evidence of judged excellence, not automatic evidence of sales, behavior change or long-term effectiveness.",
    lenses: ["Award", "Discipline", "Credits"],
    url: "https://www.oneclub.org/awards/theoneshow/-search/",
  },
  {
    id: "drum",
    name: "The Drum Awards",
    role: "Effectiveness authority",
    coverage: "Marketing, media, sector, channel and outcome-led programs",
    strength: "Strategy, execution and results are evaluated together, making the archive useful for outcome reasoning.",
    proves: "A jury evaluated the submitted work for both excellent practice and effective results within a named program.",
    caution: "Treat campaign metrics as submitted case evidence until the original measurement method or an independent result source is attached.",
    lenses: ["Strategy", "Results", "Effectiveness"],
    url: "https://awards.thedrum.com/marketing-awards-entry-kit/categories",
  },
  {
    id: "ads-of-the-world",
    name: "Ads of the World",
    role: "Global discovery",
    coverage: "Global work by market, medium, brand, event and editorial collection",
    strength: "Broad creative reconnaissance beyond the usual award circuit, including regional and format-specific collections.",
    proves: "The work and its published credits can be discovered in a global advertising context.",
    caution: "Archive presence or collection inclusion is not itself an award, an endorsement or proof of effectiveness.",
    lenses: ["Market", "Medium", "Category"],
    url: "https://www.adsoftheworld.com/collections",
  },
  {
    id: "dandad",
    name: "D&AD",
    role: "Award authority",
    coverage: "1962 onward · advertising, design, craft, culture and impact",
    strength: "Deep craft taxonomy, Pencil level, country, year, credits and—in selected cases—jury reasoning.",
    proves: "A named level of peer-judged creative excellence in a specific craft or impact category.",
    caution: "Pencil level and craft acclaim must remain separate from business effectiveness unless outcome evidence is also sourced.",
    lenses: ["Craft", "Pencil", "Country"],
    url: "https://www.dandad.org/work/d-ad-awards-archive",
  },
];

export type EvidenceProfile = {
  sourceClass: "Owner record" | "Agency record" | "Independent reporting";
  resultStatus: "Measured outcome cited" | "Mechanic evidence only";
  awardStatus: string;
};

const measuredOutcomeCases = new Set(["old-spice", "share-a-coke", "like-a-girl", "ice-bucket", "wrapped"]);

export function getEvidenceProfile(campaign: CampaignCase): EvidenceProfile {
  const host = new URL(campaign.sourceUrl).hostname;
  const sourceClass = host === "www.wk.com"
    ? "Agency record"
    : host === "time.com"
      ? "Independent reporting"
      : "Owner record";

  return {
    sourceClass,
    resultStatus: measuredOutcomeCases.has(campaign.id) ? "Measured outcome cited" : "Mechanic evidence only",
    awardStatus: campaign.recognitions?.length
      ? `${campaign.recognitions.length} official award ${campaign.recognitions.length === 1 ? "record" : "records"}`
      : "Award status not asserted",
  };
}

export const campaignCases: CampaignCase[] = [
  {
    id: "mean-joe",
    year: 1979,
    brand: "Coca-Cola",
    name: "Mean Joe Greene",
    discipline: "Emotion",
    mechanic: "Gift → emotional reversal",
    hook: "A tiny act softens an intimidating hero.",
    originalMove: "Turned refreshment into the hinge of a compact human story: tension, generosity, surprise and a jersey tossed back down the tunnel.",
    evidence: "Coca-Cola traces the spot to its 1979 “Have a Coke and a Smile” platform and describes conflict resolving into a positive human connection.",
    whyItWorked: "The product did not interrupt the story. It caused the emotional turn.",
    recastLift: "RECAST would map the emotional beat, product action and payoff as one protected story dependency—then adapt the same exchange for film, social and creator prompts without flattening it into a slogan.",
    sourceUrl: "https://www.coca-colacompany.com/about-us/history/cokes-enduring-legacy-of-inclusive-advertising",
    sourceLabel: "Coca-Cola history",
    accent: "#d64a34",
    deepDive: true,
  },
  {
    id: "apple-1984",
    year: 1984,
    brand: "Apple",
    name: "1984",
    discipline: "Positioning",
    mechanic: "Enemy + rupture",
    hook: "The new computer arrives as an act of liberation.",
    originalMove: "Made the category establishment the antagonist and positioned Macintosh as the break from conformity—selling a worldview before a feature list.",
    evidence: "Apple records Macintosh as its 1984 personal-computing breakthrough; the launch film became the cultural shorthand for the challenger position.",
    whyItWorked: "It gave a product launch a conflict big enough for culture to enter.",
    recastLift: "RECAST would stress-test the enemy, cultural tension and claim evidence separately, keeping the provocation sharp while preventing unsupported superiority language in downstream assets.",
    sourceUrl: "https://www.apple.com/newsroom/2016/11/designed-by-apple-in-california-chronicles-20-years-of-apple-design/",
    sourceLabel: "Apple Newsroom",
    accent: "#232321",
  },
  {
    id: "just-do-it",
    year: 1988,
    brand: "Nike",
    name: "Just Do It",
    discipline: "Positioning",
    mechanic: "Imperative as identity",
    hook: "Three words turn hesitation into a choice.",
    originalMove: "Created an open, repeatable call to action broad enough to hold elite sport, first attempts and personal ambition.",
    evidence: "Nike says the 1988 launch was more than a slogan: it was a call to take the first step, try and keep moving when it is hard.",
    whyItWorked: "The line is a platform, not a caption; each new athlete can complete its meaning.",
    recastLift: "RECAST would preserve the central imperative as a locked brand asset while giving each audience and channel a distinct reason to act.",
    sourceUrl: "https://about.nike.com/en/newsroom/releases/nike-reintroduces-just-do-it-to-todays-generation-with-why-do-it-campaign",
    sourceLabel: "Nike Newsroom",
    accent: "#dcff38",
  },
  {
    id: "got-milk",
    year: 1993,
    brand: "California Milk Processor Board",
    name: "got milk?",
    discipline: "Tension",
    mechanic: "Absence reveals value",
    hook: "You notice the staple only when it is missing.",
    originalMove: "Stopped praising milk and dramatized the painfully specific moment when food demands it but the carton is empty.",
    evidence: "The California Milk Processor Board identifies itself as the creator of “got milk?” and dates the platform to 1993.",
    whyItWorked: "A low-interest commodity became essential through a high-recognition problem.",
    recastLift: "RECAST would mine product-absence moments from the brief, rank them by tension and translate the best one into film, OOH and short-form hooks.",
    sourceUrl: "https://www.gotmilk.com/about-us/",
    sourceLabel: "got milk? / CMPB",
    accent: "#5b8ac7",
    deepDive: true,
  },
  {
    id: "priceless",
    year: 1997,
    brand: "Mastercard",
    name: "Priceless",
    discipline: "Structure",
    mechanic: "Repeatable narrative frame",
    hook: "Price the objects. Reveal the meaning.",
    originalMove: "Used a recurring list of purchases to set up the emotional thing money cannot buy, creating a structure that could travel across lives and markets.",
    evidence: "Mastercard dates the first father-and-son baseball spot to 1997 and describes the platform’s shift from observing moments to creating experiences.",
    whyItWorked: "The format stayed recognizable while the human truth could change indefinitely.",
    recastLift: "RECAST would encode the frame as a campaign grammar, letting teams generate local variants while validating that the final emotional reveal stays human—not transactional.",
    sourceUrl: "https://www.mastercard.com/news/perspectives/2022/priceless-mccann-mastercard/",
    sourceLabel: "Mastercard Newsroom",
    accent: "#ef9b38",
    deepDive: true,
  },
  {
    id: "real-beauty",
    year: 2004,
    brand: "Dove",
    name: "Campaign for Real Beauty",
    discipline: "Reframe",
    mechanic: "Reverse the category convention",
    hook: "Beauty becomes confidence, not anxiety.",
    originalMove: "Challenged a narrow visual code in the beauty category and made broader representation part of a long-lived brand purpose.",
    evidence: "Unilever marks more than 20 years of Dove’s Real Beauty work and its ongoing research into beauty standards and confidence.",
    whyItWorked: "The campaign changed who could be seen and what the category was allowed to say.",
    recastLift: "RECAST would connect representation rules, casting choices and copy claims to one approved purpose so later executions cannot quietly drift back to the convention the platform rejects.",
    sourceUrl: "https://www.unilever.com/brands/beauty-wellbeing/dove/",
    sourceLabel: "Unilever / Dove",
    accent: "#6b90a6",
  },
  {
    id: "old-spice",
    year: 2010,
    brand: "Old Spice",
    name: "The Man Your Man Could Smell Like",
    discipline: "Participation",
    mechanic: "Character + real-time response",
    hook: "A broadcast character answers the internet back.",
    originalMove: "Built an absurdly consistent character, then turned attention into 186 rapid video replies shaped by live questions from social platforms.",
    evidence: "Wieden+Kennedy reports 186 responses produced in two and a half days and says body-wash sales had doubled by July 2010.",
    whyItWorked: "The campaign collapsed the distance between a polished ad and a live cultural conversation.",
    recastLift: "RECAST would hold the character rules, product facts and response boundaries in one source—making rapid replies safer without sanding off the wit.",
    sourceUrl: "https://www.wk.com/work/old-spice-smell-like-a-man-man/",
    sourceLabel: "Wieden+Kennedy",
    accent: "#c3523d",
    deepDive: true,
  },
  {
    id: "share-a-coke",
    year: 2011,
    brand: "Coca-Cola",
    name: "Share a Coke",
    discipline: "Personalization",
    mechanic: "Product as social invitation",
    hook: "Your name turns a package into a message.",
    originalMove: "Replaced the masterbrand on packs with popular first names, converting mass packaging into a hunt, a keepsake and a reason to give.",
    evidence: "Coca-Cola says the 2011 Australian launch used 150 popular names and sold more than 250 million named packs that summer.",
    whyItWorked: "Personalization was physical, scarce and inherently shareable.",
    recastLift: "RECAST would connect name libraries, cultural checks, pack rules and digital extensions—so personalization scales without losing local meaning or brand control.",
    sourceUrl: "https://www.coca-colacompany.com/about-us/history/how-a-campaign-got-its-start-down-under",
    sourceLabel: "Coca-Cola history",
    accent: "#ed4438",
    deepDive: true,
  },
  {
    id: "like-a-girl",
    year: 2014,
    brand: "Always",
    name: "#LikeAGirl",
    discipline: "Reframe",
    mechanic: "Turn an insult into a rallying cry",
    hook: "Show the stereotype, then let girls redefine it.",
    originalMove: "Exposed how a familiar phrase changes meaning around puberty, then invited culture to rebuild it as an expression of strength.",
    evidence: "P&G reports positive association with the phrase rising from 19% before the film to 76% after viewing it.",
    whyItWorked: "The audience could feel the bias before being asked to change it.",
    recastLift: "RECAST would preserve the research insight across films, prompts and community responses while flagging executions that slip back into stereotype.",
    sourceUrl: "https://origprod-cus-us.pg.com/pg-history/",
    sourceLabel: "P&G history",
    accent: "#2c75c9",
    recognitions: [
      {
        archive: "D&AD",
        label: "Black Pencil · 2015",
        url: "https://www.dandad.org/work/d-ad-awards-archive/likeagirl",
      },
    ],
  },
  {
    id: "ice-bucket",
    year: 2014,
    brand: "ALS community",
    name: "Ice Bucket Challenge",
    discipline: "Participation",
    mechanic: "Visible ritual + nomination loop",
    hook: "Do it, film it, name the next person.",
    originalMove: "Made participation instantly legible and gave every participant a built-in distribution mechanic by nominating others.",
    evidence: "The ALS Association reports 17 million uploaded videos and $115 million raised during the 2014 challenge.",
    whyItWorked: "The action was simple to copy, socially accountable and spectacular enough to watch.",
    recastLift: "RECAST would model the ritual, handoff and cause proof as separate dependencies—helping variants spread while keeping donation language and impact claims accurate.",
    sourceUrl: "https://www.als.org/blog/als-ice-bucket-challenge-year-end-update-over-94-million-commitments-2014",
    sourceLabel: "The ALS Association",
    accent: "#68a9d4",
  },
  {
    id: "wrapped",
    year: 2015,
    brand: "Spotify",
    name: "Wrapped",
    discipline: "Personalization",
    mechanic: "Private data → public identity",
    hook: "Your behavior becomes a story worth sharing.",
    originalMove: "Turned listening history into a personalized annual self-portrait, then designed the output to travel through social feeds.",
    evidence: "Spotify traces the first iteration to 2015 and says it attracted more than five million unique users; the format moved into the app in 2019.",
    whyItWorked: "The brand supplied the data, but the user became the protagonist and distributor.",
    recastLift: "RECAST would define the data-to-story rules, disclosure language and channel variants once—then keep every personalized card on strategy as the product evolves.",
    sourceUrl: "https://newsroom.spotify.com/2024-12-04/10-years-spotify-wrapped/",
    sourceLabel: "Spotify Newsroom",
    accent: "#b8ef3a",
    deepDive: true,
  },
  {
    id: "moldy-whopper",
    year: 2020,
    brand: "Burger King",
    name: "Moldy Whopper",
    discipline: "Product proof",
    mechanic: "Risky visual as evidence",
    hook: "The uglier the burger gets, the clearer the product claim becomes.",
    originalMove: "Reversed food photography’s beauty rule and used a time-lapse of decay as visual proof for removing preservatives from artificial sources.",
    evidence: "The multi-market campaign documented a Whopper changing over roughly five weeks, making the product transformation the creative itself.",
    whyItWorked: "It accepted immediate disgust in exchange for a much more memorable proof point.",
    recastLift: "RECAST would bind every version of the provocative visual to the precise approved ingredient claim, preventing a bold idea from becoming a broader promise the evidence cannot support.",
    sourceUrl: "https://time.com/5786464/burger-king-whopper/",
    sourceLabel: "TIME campaign report",
    accent: "#79a85a",
    deepDive: true,
    recognitions: [
      {
        archive: "D&AD",
        label: "Black Pencil · 2020",
        url: "https://www.dandad.org/work/d-ad-awards-archive/moldy-whopper",
      },
      {
        archive: "The One Show",
        label: "Best of Show · 2020",
        url: "https://www.oneclub.org/awards/theoneshow/-search/",
      },
    ],
  },
  {
    id: "why-do-it",
    year: 2025,
    brand: "Nike",
    name: "Why Do It?",
    discipline: "Reframe",
    mechanic: "Interrogate the inherited platform",
    hook: "A new generation answers the slogan for itself.",
    originalMove: "Reopened an iconic platform as a question about pressure, failure and the choice to try—honoring memory without treating nostalgia as strategy.",
    evidence: "Nike describes the 2025 work as a reintroduction of Just Do It for younger athletes, shifting greatness from an outcome to a choice.",
    whyItWorked: "It refreshed a durable platform by challenging its meaning, not replacing its equity.",
    recastLift: "RECAST would retrieve the non-negotiable platform belief, map what has changed in culture and generate evolutions that can be traced back to both.",
    sourceUrl: "https://about.nike.com/en/newsroom/releases/nike-reintroduces-just-do-it-to-todays-generation-with-why-do-it-campaign",
    sourceLabel: "Nike Newsroom",
    accent: "#bde34a",
  },
];

export const campaignDisciplines: Array<"All" | CampaignDiscipline> = [
  "All",
  "Emotion",
  "Positioning",
  "Tension",
  "Structure",
  "Reframe",
  "Participation",
  "Personalization",
  "Product proof",
];

export type PatternIdea = {
  title: string;
  hook: string;
  mechanic: string;
  rationale: string;
  inspiredBy: string;
};

function briefHas(brief: string, words: string[]) {
  const normalized = brief.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

export function synthesizePatternIdeas(rawBrief: string): PatternIdea[] {
  const brief = rawBrief.trim() || "a useful product people overlook";
  const social = briefHas(brief, ["community", "share", "social", "friend", "team", "creator"]);
  const proof = briefHas(brief, ["proof", "sustainable", "material", "quality", "safe", "performance", "product"]);
  const change = briefHas(brief, ["launch", "new", "change", "rebrand", "challenger", "different"]);

  const participation: PatternIdea = {
    title: "Make the handoff visible",
    hook: `Give “${brief}” one action people can perform, show and pass to someone else.`,
    mechanic: "Ritual → evidence → nomination",
    rationale: "Borrow the Ice Bucket Challenge’s legible participation loop, but tie the action to a truthful product or community outcome.",
    inspiredBy: "Ice Bucket Challenge · 2014",
  };
  const evidence: PatternIdea = {
    title: "Let the proof look risky",
    hook: `Find the one demonstration of “${brief}” a cautious competitor would never put in the headline.`,
    mechanic: "Counter-category visual → approved claim",
    rationale: "Use the Moldy Whopper principle: a surprising product truth is stronger than decorative confidence when every claim remains evidence-bound.",
    inspiredBy: "Moldy Whopper · 2020",
  };
  const absence: PatternIdea = {
    title: "Show the missing moment",
    hook: `Do not explain “${brief}.” Dramatize the exact second its benefit disappears.`,
    mechanic: "Friction → absence → recognition",
    rationale: "Use the got milk? tension pattern to turn an ordinary benefit into an urgent, familiar problem people recognize before the logo arrives.",
    inspiredBy: "got milk? · 1993",
  };
  const identity: PatternIdea = {
    title: "Turn use into identity",
    hook: `Translate “${brief}” into a personal artifact people would share because it says something true about them.`,
    mechanic: "Behavioral signal → self-portrait → share",
    rationale: "Use the Wrapped pattern: the brand supplies structure, while the audience becomes both protagonist and distributor.",
    inspiredBy: "Spotify Wrapped · 2015",
  };
  const challenger: PatternIdea = {
    title: "Name the old default",
    hook: `Frame “${brief}” as the break from a convention everyone has learned to tolerate.`,
    mechanic: "Old world → rupture → new choice",
    rationale: "Use the 1984 challenger pattern while grounding every contrast in a defensible product or cultural truth.",
    inspiredBy: "Apple 1984 · 1984",
  };

  if (social) return [participation, identity, absence];
  if (proof) return [evidence, absence, identity];
  if (change) return [challenger, evidence, participation];
  return [absence, identity, participation];
}
