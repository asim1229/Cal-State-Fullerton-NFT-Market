// CSUF Campus Buildings with 3D positions mapped to the Blender model
// Positions are [x, y, z] — edit x and z to move pins horizontally, y is height above ground
export const CAMPUS_BUILDINGS = [
  {
    id: 'pollak-library',
    name: 'Pollak Library',
    shortName: 'POLL',
    position: [0.05, 0.60, 1.30],
    color: '#FF7900',
    description: 'The heart of CSUF — 8 floors of academic resources, study spaces, and special collections.',
    category: 'Academic',
    year: 1960,
    sqft: '200,000 sq ft',
  },
  {
    id: 'mccarthy-hall',
    name: 'McCarthy Hall',
    shortName: 'MH',
    position: [-0.02, 0.20, 3.29],
    color: '#4A9EFF',
    description: 'Home to the College of Natural Sciences & Mathematics.',
    category: 'Academic',
    year: 1966,
    sqft: '150,000 sq ft',
  },
  {
    id: 'titan-student-union',
    name: 'Titan Student Union',
    shortName: 'TSU',
    position: [-2.07, 0.20, 1.30],
    color: '#00C896',
    description: 'Student hub with dining, events, and recreation at the center of campus.',
    category: 'Student Life',
    year: 2000,
    sqft: '120,000 sq ft',
  },
  {
    id: 'langsdorf-hall',
    name: 'Langsdorf Hall',
    shortName: 'LH',
    position: [0.65, 0.20, 3.84],
    color: '#B45FFF',
    description: 'Administrative hub — Admissions, Financial Aid, and the Registrar.',
    category: 'Administration',
    year: 1965,
    sqft: '80,000 sq ft',
  },
  {
    id: 'gordon-hall',
    name: 'Gordon Hall',
    shortName: 'GH',
    position: [0.88, 0.20, 2.47],
    color: '#FF4F6A',
    description: 'College of Business and Economics — cutting-edge classrooms and labs.',
    category: 'Academic',
    year: 1990,
    sqft: '110,000 sq ft',
  },
  {
    id: 'titan-gym',
    name: 'Titan Gymnasium',
    shortName: 'GYM',
    position: [-1.63, 0.20, 0.03],
    color: '#FFB800',
    description: 'Athletics and fitness center for the Titan community.',
    category: 'Athletics',
    year: 1975,
    sqft: '90,000 sq ft',
  },
  {
    id: 'visual-arts',
    name: 'Visual Arts Center',
    shortName: 'VA',
    position: [-1.86, 0.20, 2.83],
    color: '#FF6B35',
    description: "State-of-the-art studios and galleries for CSUF's acclaimed art programs.",
    category: 'Arts',
    year: 2009,
    sqft: '75,000 sq ft',
  },
  {
    id: 'college-park',
    name: 'College Park Bldg',
    shortName: 'CP',
    position: [1.07, 0.20, 5.20],
    color: '#29D4C5',
    description: 'Extension programs and professional development center.',
    category: 'Academic',
    year: 2010,
    sqft: '55,000 sq ft',
  },
  {
    id: 'ECS-building',
    name: 'ECS Building',
    shortName: 'ECS',
    position: [1.82, 0.20, 0.98],
    color: '#29d459',
    description: 'This is where engineers are made.',
    category: 'Academic',
    year: 1980,
    sqft: '50,000 sq ft',
  },
  {
    id: 'Stadium-building',
    name: 'Titan Stadium',
    shortName: 'ST',
    position: [-0.98, 0.65, -2.60],
    color: '#f18912',
    description: 'This is where titans are made.',
    category: 'Academic',
    year: 1980,
    sqft: '50,000 sq ft',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SVG "F" Art Generator — 50 unique CSUF F NFTs per building
// (Ported from the standalone HTML with full effects support)
// ─────────────────────────────────────────────────────────────────────────────

const BG_PALETTES = [
  ['#030508', '#0a0520'], ['#050a0f', '#0f2040'], ['#0a0505', '#200f0f'],
  ['#050a05', '#0f200f'], ['#0a0a05', '#20200f'], ['#08050a', '#18082a'],
  ['#050810', '#0a1830'], ['#0f0505', '#2a0a0a'], ['#050f0a', '#0a2018'],
  ['#080810', '#141428'],
];

const F_COLORS = [
  { fill: '#FF7900', stroke: '#1a3a5c' },
  { fill: '#FF4F6A', stroke: '#1a1a3c' },
  { fill: '#4A9EFF', stroke: '#0a1a3c' },
  { fill: '#00C896', stroke: '#0a1a10' },
  { fill: '#B45FFF', stroke: '#1a0a2c' },
  { fill: '#FFB800', stroke: '#2c1800' },
  { fill: '#FF7900', stroke: '#FF4F6A' },
  { fill: '#e8e8ff', stroke: '#334' },
  { fill: '#ff6b35', stroke: '#1a1a1a' },
  { fill: '#29D4C5', stroke: '#0a2020' },
];

const EFFECTS = ['None', 'Glitch', 'Holographic', 'Neon Glow', 'Gold Foil', 'Plasma', 'Shadow', 'Mirror', 'Fire', 'Crystal'];
const BG_NAMES = ['Deep Space', 'Nebula', 'Matrix', 'Void', 'Stellar', 'Abyssal', 'Crimson Dark', 'Forest Night', 'Golden Dusk', 'Midnight'];
const EDITIONS = ['Genesis', 'Titan', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Prime', 'Ultra', 'Apex'];

// Rarity distribution (weighted): 40% Common, 32% Uncommon, 18% Rare, 8% Epic, 2% Legendary
const RARITIES = ['Common', 'Common', 'Common', 'Common', 'Uncommon', 'Uncommon', 'Uncommon', 'Rare', 'Rare', 'Epic', 'Legendary'];

const RARITY_PRICES = { Legendary: '8.5', Epic: '3.2', Rare: '1.1', Uncommon: '0.35', Common: '0.08' };
const RARITY_PCT = { Legendary: '2%', Epic: '8%', Rare: '18%', Uncommon: '32%', Common: '40%' };

function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate the SVG art string for a given NFT's visual parameters.
 *
 * NOTE: Uses ONLY inline elements — no <defs><path id/><use href> pattern.
 * This is required because SVGs loaded via <img src="data:image/svg+xml...">
 * cannot resolve internal href references (browser security restriction).
 *
 * @param {object} fColor  - { fill, stroke }
 * @param {Array}  bg      - [darkColor, lightColor]
 * @param {number} size    - canvas size in px
 * @param {string} effect  - one of EFFECTS
 * @param {boolean} hasHalo
 * @param {number} rotation - degrees of tilt
 * @param {string} uid     - unique identifier to avoid SVG id clashes
 */
export function drawF(fColor, bg, size, effect, hasHalo, rotation, uid = '') {
  const [b1, b2] = bg;

  // ── F shape in a 100×100 virtual space ─────────────────────────────────
  // Coordinates for the letter F outline
  const FL = 12, FR = 70, FMR = 55, STEM_R = 28;
  const FT = 8, FB = 92, TB = 26, MB_T = 42, MB_B = 58;

  const pathD = `M${FL} ${FT} L${FR} ${FT} L${FR} ${TB} L${STEM_R} ${TB} L${STEM_R} ${MB_T} L${FMR} ${MB_T} L${FMR} ${MB_B} L${STEM_R} ${MB_B} L${STEM_R} ${FB} L${FL} ${FB} Z`;

  // Scale the 100×100 F design into the actual canvas with padding
  const pad = size * 0.1;
  const scaleF = (size - pad * 2) / 100;
  const cx = 50, cy = 50; // rotation center in VB space
  const pathTransform = `translate(${pad},${pad}) scale(${scaleF}) rotate(${rotation} ${cx} ${cy})`;
  const sw = 2.5 / scaleF; // stroke width in VB units (stays visually consistent)

  // ── Background gradient (safe in defs — not href-referenced) ───────────
  const bgId = `bg${uid}`;
  const bgDef = `<radialGradient id="${bgId}" cx="50%" cy="50%" r="70%">
    <stop offset="0%" stop-color="${b2}"/>
    <stop offset="100%" stop-color="${b1}"/>
  </radialGradient>`;

  // ── Fill & gradient defs ────────────────────────────────────────────────
  let fillAttr = fColor.fill;
  let gradDef = '';
  if (effect === 'Holographic') {
    gradDef = `<linearGradient id="hg${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff6b35"/><stop offset="33%" stop-color="#ff7900"/>
      <stop offset="66%" stop-color="#4A9EFF"/><stop offset="100%" stop-color="#00C896"/>
    </linearGradient>`;
    fillAttr = `url(#hg${uid})`;
  } else if (effect === 'Gold Foil') {
    gradDef = `<linearGradient id="gg${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFD700"/><stop offset="50%" stop-color="#FFB800"/>
      <stop offset="100%" stop-color="#FF8C00"/>
    </linearGradient>`;
    fillAttr = `url(#gg${uid})`;
  } else if (effect === 'Crystal') {
    gradDef = `<linearGradient id="cg${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e0f0ff" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#7ecfff" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#4A9EFF" stop-opacity="0.9"/>
    </linearGradient>`;
    fillAttr = `url(#cg${uid})`;
  }

  // ── Decorations ─────────────────────────────────────────────────────────
  let extras = '';
  if (hasHalo) extras += `<circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="none" stroke="${fColor.fill}" stroke-width="1" opacity="0.25"/>`;
  if (effect === 'Neon Glow') {
    extras += `<circle cx="${size/2}" cy="${size/2}" r="${size*0.44}" fill="none" stroke="${fColor.fill}" stroke-width="3" opacity="0.12"/>`;
    extras += `<circle cx="${size/2}" cy="${size/2}" r="${size*0.38}" fill="none" stroke="${fColor.fill}" stroke-width="1.5" opacity="0.2"/>`;
  }

  // ── Effect pre-layers (all inline paths, no <use href>) ─────────────────
  let preLayers = '';
  if (effect === 'Glitch') {
    const dx1 = size*0.025, dy1 = -size*0.015;
    const dx2 = -size*0.018, dy2 = size*0.018;
    preLayers += `<path d="${pathD}" transform="translate(${pad+dx1},${pad+dy1}) scale(${scaleF}) rotate(${rotation} ${cx} ${cy})" fill="${fColor.fill}" opacity="0.35" stroke="none"/>`;
    preLayers += `<path d="${pathD}" transform="translate(${pad+dx2},${pad+dy2}) scale(${scaleF}) rotate(${rotation} ${cx} ${cy})" fill="#4A9EFF" opacity="0.28" stroke="none"/>`;
  }
  if (effect === 'Shadow') {
    const sdx = size*0.04, sdy = size*0.04;
    preLayers += `<path d="${pathD}" transform="translate(${pad+sdx},${pad+sdy}) scale(${scaleF}) rotate(${rotation} ${cx} ${cy})" fill="#000" opacity="0.4" stroke="none"/>`;
  }
  if (effect === 'Plasma') {
    preLayers += `<path d="${pathD}" transform="${pathTransform}" fill="#B45FFF" opacity="0.3" stroke="none"/>`;
  }
  if (effect === 'Fire') {
    preLayers += `<path d="${pathD}" transform="translate(${pad},${pad-size*0.03}) scale(${scaleF}) rotate(${rotation} ${cx} ${cy})" fill="#FF4500" opacity="0.25" stroke="none"/>`;
    preLayers += `<path d="${pathD}" transform="translate(${pad},${pad-size*0.06}) scale(${scaleF*0.95}) rotate(${rotation} ${cx} ${cy})" fill="#FFB800" opacity="0.15" stroke="none"/>`;
  }

  let postLayers = '';
  if (effect === 'Mirror') {
    postLayers += `<path d="${pathD}" transform="translate(${size},${pad}) scale(${-scaleF},${scaleF}) rotate(${rotation} ${cx} ${cy})" fill="${fColor.fill}" opacity="0.12" stroke="none"/>`;
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
<defs>${bgDef}${gradDef}</defs>
<rect width="${size}" height="${size}" fill="url(#${bgId})"/>
${extras}${preLayers}
<path d="${pathD}" transform="${pathTransform}" fill="${fillAttr}" stroke="${fColor.stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
${postLayers}
</svg>`;
}



/**
 * Generate 50 SVG F-art NFTs for a building.
 * Uses seeded randomness so the same building always produces identical NFTs.
 */
export const generateNFTs = (buildingId) => {
  // Give each building a unique seed offset based on its index
  const buildingIdx = CAMPUS_BUILDINGS.findIndex(b => b.id === buildingId);
  const seedBase = (buildingIdx >= 0 ? buildingIdx : 0) * 1000;

  return Array.from({ length: 50 }, (_, i) => {
    const s = seedBase + i * 7 + 13;

    const rarityIdx  = Math.floor(seededRand(s)     * RARITIES.length);
    const bgIdx      = Math.floor(seededRand(s + 1) * BG_PALETTES.length);
    const fIdx       = Math.floor(seededRand(s + 2) * F_COLORS.length);
    const effectIdx  = Math.floor(seededRand(s + 3) * EFFECTS.length);
    const edIdx      = Math.floor(seededRand(s + 4) * EDITIONS.length);
    const hasHalo    = seededRand(s + 5) > 0.6;
    const hasParticles = seededRand(s + 6) > 0.5;
    const rotation   = Math.floor(seededRand(s + 7) * 5 - 2.5);

    const rarity   = RARITIES[rarityIdx];
    const fColor   = F_COLORS[fIdx];
    const bg       = BG_PALETTES[bgIdx];
    const effect   = EFFECTS[effectIdx];
    const edition  = EDITIONS[edIdx];
    const bgName   = BG_NAMES[bgIdx];
    const priceEth = RARITY_PRICES[rarity];
    const priceUsd = (parseFloat(priceEth) * 2340).toFixed(0);
    const tokenId  = 1000 + buildingIdx * 50 + i;
    const uid      = `${buildingId.replace(/-/g, '')}_${i}`;

    return {
      id: `${buildingId}-nft-${i}`,
      buildingId,
      tokenId,
      uid,                  // for SVG id uniqueness
      name: `${buildingId
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')} F #${String(i + 1).padStart(3, '0')}`,
      rarity,
      edition,
      effect,
      bgName,
      fColor,
      bg,
      hasHalo,
      hasParticles,
      rotation,
      priceEth,
      priceUsd,
      // ownership — will be overwritten by on-chain data when connected
      owner: '0xMarket...place',
      available: true,
      listed: seededRand(s + 8) > 0.5,
      likes: Math.floor(seededRand(s + 9) * 300 + 5),
      views: Math.floor(seededRand(s + 10) * 2000 + 50),
      createdAt: new Date(Date.now() - seededRand(s + 11) * 1e10).toLocaleDateString(),
      rarityPct: RARITY_PCT[rarity],
      // on-chain token id (set after mint)
      onChainTokenId: null,
    };
  });
};

export const RARITY_COLORS = {
  Legendary: '#FFB800',
  Epic:      '#9B5FFF',
  Rare:      '#4A9EFF',
  Uncommon:  '#00C896',
  Common:    '#6B7A99',
};