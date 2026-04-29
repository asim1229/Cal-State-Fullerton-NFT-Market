/**
 * deploy.cjs — Deploy CSUFCampusNFT to Ganache and create all building collections.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.cjs --network ganache
 *
 * Then copy the printed CONTRACT_ADDRESS into src/contracts/config.js
 */

const hre = require('hardhat');

// All 10 CSUF campus buildings — must match src/data/buildings.js IDs exactly
const BUILDINGS = [
  { id: 'pollak-library',      name: 'Pollak Library',       maxSupply: 50, mintPriceEth: '0.01' },
  { id: 'mccarthy-hall',       name: 'McCarthy Hall',        maxSupply: 50, mintPriceEth: '0.01' },
  { id: 'titan-student-union', name: 'Titan Student Union',  maxSupply: 50, mintPriceEth: '0.01' },
  { id: 'langsdorf-hall',      name: 'Langsdorf Hall',       maxSupply: 50, mintPriceEth: '0.01' },
  { id: 'gordon-hall',         name: 'Gordon Hall',          maxSupply: 50, mintPriceEth: '0.01' },
  { id: 'titan-gym',           name: 'Titan Gymnasium',      maxSupply: 50, mintPriceEth: '0.01' },
  { id: 'visual-arts',         name: 'Visual Arts Center',   maxSupply: 50, mintPriceEth: '0.01' },
  { id: 'college-park',        name: 'College Park Bldg',    maxSupply: 50, mintPriceEth: '0.01' },
  { id: 'ECS-building',        name: 'ECS Building',         maxSupply: 50, mintPriceEth: '0.01' },
  { id: 'Stadium-building',    name: 'Titan Stadium',        maxSupply: 50, mintPriceEth: '0.01' },
];

async function main() {
  const { ethers } = hre;

  const [deployer] = await ethers.getSigners();
  console.log('\n🚀 Deploying CSUFCampusNFT...');
  console.log('   Deployer:', deployer.address);
  console.log('   Balance: ', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');

  // Deploy
  const Factory = await ethers.getContractFactory('CSUFCampusNFT');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('✅ Contract deployed at:', address);

  // Create all building collections
  console.log('\n📦 Creating building collections...');
  for (const b of BUILDINGS) {
    const mintPrice = ethers.parseEther(b.mintPriceEth);
    const tx = await contract.createCollection(b.id, b.name, b.maxSupply, mintPrice);
    await tx.wait();
    console.log(`   ✓ ${b.name} (${b.id}) — ${b.maxSupply} max, ${b.mintPriceEth} ETH/mint`);
  }

  console.log('\n────────────────────────────────────────────────────────────');
  console.log('🎉 DONE! Paste this into src/contracts/config.js:');
  console.log('');
  console.log(`   export const CONTRACT_ADDRESS = '${address}';`);
  console.log('────────────────────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
