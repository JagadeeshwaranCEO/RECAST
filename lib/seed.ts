import { CampaignSchema, type Campaign } from "./models";

const seededCampaign: Campaign = {
  id: "campaign.stride-launch",
  name: "Stride Modular Backpack Launch",
  brand: "Stride",
  product: "Stride Modular Backpack",
  conceptLine: "Your day changes. Your bag should keep up.",
  version: 1,
  status: "active",
  facts: [
    { id: "fact.price.v1", key: "fact.price", label: "Launch price", value: "₹2,499", version: 1, status: "approved", approvedAt: "2026-09-24T10:30:00.000Z" },
    { id: "claim.water-resistant.v1", key: "claim.water-resistant", label: "Weather protection", value: "water-resistant", version: 1, status: "approved", approvedAt: "2026-09-24T10:32:00.000Z" },
    { id: "claim.modular.v1", key: "claim.modular", label: "Product system", value: "modular compartments", version: 1, status: "approved", approvedAt: "2026-09-24T10:33:00.000Z" },
    { id: "claim.capacity.v1", key: "claim.capacity", label: "Capacity", value: "18L capacity", version: 1, status: "approved", approvedAt: "2026-09-24T10:34:00.000Z" },
    { id: "claim.recycled-nylon.v1", key: "claim.recycled-nylon", label: "Exterior material", value: "recycled nylon exterior", version: 1, status: "approved", approvedAt: "2026-09-24T10:35:00.000Z" },
    { id: "claim.waterproof.v1", key: "claim.waterproof", label: "Prohibited claim", value: "completely waterproof", version: 1, status: "prohibited", approvedAt: null },
  ],
  claims: [
    { id: "approved.water-resistant", factId: "claim.water-resistant.v1", wording: "water-resistant", approvalStatus: "approved", evidence: "Supplier test: coated shell resisted light rain for 30 minutes." },
    { id: "approved.modular", factId: "claim.modular.v1", wording: "modular compartments", approvalStatus: "approved", evidence: "Three removable compartment modules in production BOM." },
    { id: "approved.capacity", factId: "claim.capacity.v1", wording: "18L capacity", approvalStatus: "approved", evidence: "Verified factory volume specification." },
    { id: "approved.recycled", factId: "claim.recycled-nylon.v1", wording: "recycled nylon exterior", approvalStatus: "approved", evidence: "GRS-certified exterior shell supplier record." },
    { id: "prohibited.waterproof", factId: "claim.waterproof.v1", wording: "completely waterproof", approvalStatus: "prohibited", evidence: "No submersion or waterproof-seam test is approved." },
  ],
  brandRules: [
    { id: "brand.tone", label: "Voice", value: "Assured, useful, premium", type: "tone" },
    { id: "brand.ink", label: "Ink", value: "#1D1C18", type: "colour" },
    { id: "brand.vermilion", label: "Signal", value: "#E84B32", type: "colour" },
    { id: "brand.moss", label: "Approval", value: "#6F7D49", type: "colour" },
    { id: "brand.font", label: "Display type", value: "Editorial serif", type: "font" },
    { id: "brand.cta", label: "Primary CTA", value: "Meet your everyday system", type: "cta" },
    { id: "brand.launch", label: "Launch date", value: "2026-10-12", type: "date" },
  ],
  concepts: [
    {
      id: "concept.context-shift",
      title: "Your day changes. Your bag should keep up.",
      promise: "One considered carry system moves cleanly through work, transit, and weekends.",
      metaphor: "The world changes around one constant backpack.",
      hook: "Three contexts. One uninterrupted move.",
      contentPlan: ["12-second context-shift reel", "Four-part feature proof", "Founder-style design story"],
      selected: true,
    },
    {
      id: "concept.less-repacking",
      title: "Pack once. Move differently.",
      promise: "Modular organisation removes the friction of repacking between roles.",
      metaphor: "A day visualised as one continuous packing list.",
      hook: "What if changing plans didn’t mean changing bags?",
      contentPlan: ["Packing transformation reel", "Module-by-module carousel", "Utility-led launch note"],
      selected: false,
    },
  ],
  assets: [
    {
      id: "asset.reel",
      title: "Context Shift Reel",
      platform: "Instagram",
      format: "12 sec · 9:16",
      role: "Make versatility visceral",
      blocks: [
        { id: "reel.scene.desk", label: "00–03s · Desk", type: "scene", content: "Laptop clicks shut. Stride stays upright beside the desk.", locked: false },
        { id: "reel.scene.transit", label: "03–07s · Transit", type: "scene", content: "The modular tech compartment snaps out at the train platform.", template: "The {{value}} snap into a new commute at the train platform.", locked: false },
        { id: "reel.scene.weekend", label: "07–10s · Weekend", type: "scene", content: "An 18L carry shifts from city layers to a trail shell.", template: "An {{value}} shifts from city layers to a trail shell.", locked: false },
        { id: "reel.price", label: "10–12s · End card", type: "copy", content: "Launch at ₹2,499 · Meet your everyday system", template: "Launch at {{value}} · Meet your everyday system", maxCharacters: 64, locked: false },
        { id: "reel.product", label: "Locked product photography", type: "image", content: "Stride hero pack · charcoal / moss", locked: true, integrityHash: "sha256:8bf7c4a-stride-pack-locked" },
      ],
    },
    {
      id: "asset.carousel",
      title: "Feature Proof Carousel",
      platform: "Instagram",
      format: "4 slides · 4:5",
      role: "Turn the promise into proof",
      blocks: [
        { id: "carousel.slide1", label: "Slide 01 · Promise", type: "copy", content: "Your day changes. Your bag should keep up.", maxCharacters: 52, locked: false },
        { id: "carousel.slide2", label: "Slide 02 · System", type: "copy", content: "Modular compartments. Built around what today needs.", template: "{{value}}. Built around what today needs.", maxCharacters: 68, locked: false },
        { id: "carousel.slide3", label: "Slide 03 · Exterior", type: "copy", content: "Water-resistant recycled nylon exterior, ready for changing plans.", removalContent: "Water-resistant exterior, ready for changing plans.", maxCharacters: 76, locked: false },
        { id: "carousel.slide4", label: "Slide 04 · Offer", type: "copy", content: "₹2,499 · Meet your everyday system", template: "{{value}} · Meet your everyday system", maxCharacters: 52, locked: false },
        { id: "carousel.product", label: "Locked product photography", type: "image", content: "Stride front three-quarter pack", locked: true, integrityHash: "sha256:8bf7c4a-stride-pack-locked" },
        { id: "carousel.logo", label: "Locked Stride wordmark", type: "logo", content: "STRIDE", locked: true, integrityHash: "sha256:91aa20e-stride-wordmark-locked" },
      ],
    },
    {
      id: "asset.linkedin",
      title: "Design Story Launch Post",
      platform: "LinkedIn",
      format: "Text post · 1:1 visual",
      role: "Build product-design credibility",
      blocks: [
        { id: "linkedin.hook", label: "Opening", type: "copy", content: "Most bags are designed for one version of your day. We started with the opposite idea.", maxCharacters: 120, locked: false },
        { id: "linkedin.story", label: "Design story", type: "copy", content: "Stride moves from a focused desk to a crowded platform to an open weekend without asking you to unpack your life between them.", maxCharacters: 180, locked: false },
        { id: "linkedin.module", label: "Product proof", type: "copy", content: "Its modular compartments let the same silhouette change jobs while the essentials stay exactly where you expect them.", template: "Its {{value}} let the same silhouette change jobs while the essentials stay exactly where you expect them.", maxCharacters: 180, locked: false },
        { id: "linkedin.material", label: "Material note", type: "copy", content: "A recycled nylon exterior keeps the form light, considered, and ready to be used every day.", removalContent: "A considered exterior keeps the form light and ready to be used every day.", maxCharacters: 150, locked: false },
        { id: "linkedin.product", label: "Locked product photography", type: "image", content: "Stride material detail", locked: true, integrityHash: "sha256:8bf7c4a-stride-pack-locked" },
      ],
    },
  ],
  dependencies: [
    { id: "edge.price.reel", factId: "fact.price.v1", assetId: "asset.reel", blockId: "reel.price", reason: "End card displays the approved launch price." },
    { id: "edge.price.carousel", factId: "fact.price.v1", assetId: "asset.carousel", blockId: "carousel.slide4", reason: "Offer slide displays the approved launch price." },
    { id: "edge.modular.reel", factId: "claim.modular.v1", assetId: "asset.reel", blockId: "reel.scene.transit", reason: "Transit scene demonstrates the approved modular-compartment claim." },
    { id: "edge.modular.carousel", factId: "claim.modular.v1", assetId: "asset.carousel", blockId: "carousel.slide2", reason: "Slide 2 states the approved modular-compartment claim." },
    { id: "edge.modular.linkedin", factId: "claim.modular.v1", assetId: "asset.linkedin", blockId: "linkedin.module", reason: "The design story describes the approved modular system." },
    { id: "edge.capacity.reel", factId: "claim.capacity.v1", assetId: "asset.reel", blockId: "reel.scene.weekend", reason: "Weekend scene includes the approved 18L capacity." },
    { id: "edge.water.carousel", factId: "claim.water-resistant.v1", assetId: "asset.carousel", blockId: "carousel.slide3", reason: "Slide 3 states the approved weather-protection wording." },
    { id: "edge.recycled.carousel", factId: "claim.recycled-nylon.v1", assetId: "asset.carousel", blockId: "carousel.slide3", reason: "Slide 3 names the approved shell material." },
    { id: "edge.recycled.linkedin", factId: "claim.recycled-nylon.v1", assetId: "asset.linkedin", blockId: "linkedin.material", reason: "The design story names the approved shell material." },
  ],
  approvals: [
    { id: "approval.reel", assetId: "asset.reel", status: "approved", reviewer: "Mira · Creative lead", updatedAt: "2026-09-25T11:05:00.000Z" },
    { id: "approval.carousel", assetId: "asset.carousel", status: "approved", reviewer: "Mira · Creative lead", updatedAt: "2026-09-25T11:08:00.000Z" },
    { id: "approval.linkedin", assetId: "asset.linkedin", status: "approved", reviewer: "Mira · Creative lead", updatedAt: "2026-09-25T11:12:00.000Z" },
  ],
  revisions: [],
  baselineIntegrity: {
    "reel.product": "sha256:8bf7c4a-stride-pack-locked",
    "carousel.product": "sha256:8bf7c4a-stride-pack-locked",
    "carousel.logo": "sha256:91aa20e-stride-wordmark-locked",
    "linkedin.product": "sha256:8bf7c4a-stride-pack-locked",
  },
};

export function createSeedCampaign(): Campaign {
  return CampaignSchema.parse(structuredClone(seededCampaign));
}

