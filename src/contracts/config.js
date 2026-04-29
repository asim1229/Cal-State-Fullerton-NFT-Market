// ─────────────────────────────────────────────────────────────────────────────
// Contract Configuration
// ─────────────────────────────────────────────────────────────────────────────
//
// STEP 1: Start Ganache (GUI on port 7545 OR ganache-cli on port 8545)
// STEP 2: Run: node scripts/deploy.cjs
// STEP 3: Copy the printed address below and save this file
// STEP 4: In MetaMask → Add Network → http://127.0.0.1:7545 / Chain ID 1337
// STEP 5: npm run dev → Connect Wallet → Buy / Sell / Transfer NFTs!
//
// ─────────────────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESS = '0x1111BE0e3a143897F14A1401368a4683E5364f90'; // ← paste after deploy

// Ganache local network config (default Ganache GUI port)
export const CHAIN_CONFIG = {
  chainId: 1337,           // Ganache default — change to 1337 or 5777 if needed
  chainIdHex: '0x539',    // hex of 1337
  name: 'Ganache Local',
  rpcUrl: 'http://127.0.0.1:7545',
  explorerUrl: '',
};

// Mint price per NFT (must match what deploy.cjs sets — 0.01 ETH)
export const MINT_PRICE_ETH = '0.01';

// Platform fee displayed in UI (matches contract constant 2.5%)
export const PLATFORM_FEE_PCT = 2.5;

// Full ABI — covers ERC-721 + marketplace functions
export const CONTRACT_ABI = [
  // ERC-721 core
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function approve(address to, uint256 tokenId) external',
  'function getApproved(uint256 tokenId) external view returns (address)',
  'function transferFrom(address from, address to, uint256 tokenId) external',
  'function balanceOf(address owner) external view returns (uint256)',
  // Mint
  'function mint(string calldata buildingId, string calldata uri) external payable returns (uint256)',
  // Collections
  'function createCollection(string calldata buildingId, string calldata name, uint256 maxSupply, uint256 mintPrice) external',
  'function getCollection(string calldata buildingId) external view returns (tuple(string buildingId, string name, uint256 maxSupply, uint256 minted, uint256 mintPrice, bool active))',
  'function totalMinted() external view returns (uint256)',
  'function tokenBuilding(uint256) external view returns (string)',
  // Marketplace
  'function listNFT(uint256 tokenId, uint256 price) external',
  'function unlistNFT(uint256 tokenId) external',
  'function buyNFT(uint256 tokenId) external payable',
  'function getListing(uint256 tokenId) external view returns (tuple(uint256 tokenId, address seller, uint256 price, string buildingId, bool active))',
  // Finance
  'function withdrawFees() external',
  'function accumulatedFees() external view returns (uint256)',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event NFTMinted(uint256 indexed tokenId, address indexed to, string buildingId, string tokenURI)',
  'event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price)',
  'event NFTUnlisted(uint256 indexed tokenId)',
  'event NFTSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price)',
];

// Helper: is the contract deployed (non-zero address)?
export const isContractDeployed = () =>
  CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';
