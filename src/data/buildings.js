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
  }
];

// Mock NFT data per building
export const generateNFTs = (buildingId) => {
  const templates = {
    'pollak-library': [
      { name: 'First Edition Genesis', rarity: 'Legendary', image: '📚', price: '2.5', },
      { name: 'Night Owl #042', rarity: 'Rare', image: '🦉', price: '0.8', },
      { name: 'Knowledge Seeker', rarity: 'Uncommon', image: '🔭', price: '0.3', },
      { name: 'Late Night Session', rarity: 'Common', image: '💻', price: '0.05', },
    ],
    'mccarthy-hall': [
      { name: 'Titan Atom #001', rarity: 'Legendary', image: '⚛️', price: '3.2', },
      { name: 'Quantum Leap', rarity: 'Rare', image: '🧬', price: '1.1', },
      { name: 'Lab Rat #77', rarity: 'Uncommon', image: '🔬', price: '0.25', },
      { name: 'Chemistry Pass', rarity: 'Common', image: '🧪', price: '0.04', },
    ],
    'titan-student-union': [
      { name: "TSU Founder's Pass", rarity: 'Legendary', image: '🏛️', price: '4.0', },
      { name: 'Game Night King', rarity: 'Rare', image: '🎮', price: '0.9', },
      { name: 'Food Court Regular', rarity: 'Uncommon', image: '🍕', price: '0.2', },
      { name: 'Event Stamp', rarity: 'Common', image: '🎟️', price: '0.03', },
    ],
  };

  const defaults = [
    { name: `${buildingId.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} Genesis`, rarity: 'Legendary', image: '🏛️', price: '2.0' },
    { name: 'Titan Pride #1', rarity: 'Rare', image: '🐘', price: '0.75' },
    { name: 'Campus Memory', rarity: 'Uncommon', image: '📸', price: '0.2' },
    { name: 'Golden Pass', rarity: 'Common', image: '🎫', price: '0.05' },
  ];

  const base = templates[buildingId] || defaults;
  const owners = ['0x1a2b...3c4d', '0xdead...beef', '0xc0ff...ee42', '0x1337...c0de'];
  const available = [true, false, true, true];

  return base.map((nft, i) => ({
    id: `${buildingId}-nft-${i}`,
    buildingId,
    tokenId: 1000 + i,
    ...nft,
    owner: owners[i % owners.length],
    available: available[i % available.length],
    listed: available[i % available.length],
    priceEth: nft.price,
    priceUsd: (parseFloat(nft.price) * 2340).toFixed(0),
    likes: Math.floor(Math.random() * 200) + 10,
    views: Math.floor(Math.random() * 2000) + 100,
    createdAt: new Date(Date.now() - Math.random() * 1e10).toLocaleDateString(),
  }));
};

export const RARITY_COLORS = {
  Legendary: '#FFB800',
  Rare: '#9B5FFF',
  Uncommon: '#00C896',
  Common: '#6B7A99',
};