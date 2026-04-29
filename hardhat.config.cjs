require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Ganache GUI default (port 7545, chainId 1337)
    ganache: {
      url: 'http://127.0.0.1:7545',
      chainId: 1337,
      // Hardhat will auto-use the first Ganache account as deployer
    },
    // ganache-cli / npx ganache (port 8545, chainId 1337)
    ganacheCli: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};
