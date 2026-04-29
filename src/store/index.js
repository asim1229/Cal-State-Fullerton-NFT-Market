import { create } from 'zustand';
import { generateNFTs } from '../data/buildings';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  CHAIN_CONFIG,
  isContractDeployed,
} from '../contracts/config';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getContract(signer) {
  const { ethers } = await import('ethers');
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

async function switchToGanache(provider) {
  try {
    await provider.send('wallet_switchEthereumChain', [
      { chainId: CHAIN_CONFIG.chainIdHex },
    ]);
  } catch (switchErr) {
    // Chain not added yet — add it
    if (switchErr.code === 4902) {
      await provider.send('wallet_addEthereumChain', [
        {
          chainId: CHAIN_CONFIG.chainIdHex,
          chainName: CHAIN_CONFIG.name,
          rpcUrls: [CHAIN_CONFIG.rpcUrl],
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        },
      ]);
    } else {
      throw switchErr;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create((set, get) => ({
  // ── Wallet ────────────────────────────────────────────────────────────────
  wallet: null,
  walletBalance: null,
  isConnecting: false,
  isGanache: false,   // true when MetaMask is on Ganache + contract deployed

  connectWallet: async () => {
    set({ isConnecting: true });
    try {
      if (!window.ethereum) throw new Error('MetaMask not found');

      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Try to switch MetaMask to Ganache if contract is deployed
      if (isContractDeployed()) {
        await switchToGanache(window.ethereum);
      }

      await provider.send('eth_requestAccounts', []);
      const signer    = await provider.getSigner();
      const address   = await signer.getAddress();
      const balanceBN = await provider.getBalance(address);
      const balance   = ethers.formatEther(balanceBN);

      // Detect if we're on Ganache chainId 1337
      const network   = await provider.getNetwork();
      const onGanache = Number(network.chainId) === CHAIN_CONFIG.chainId;

      set({
        wallet: {
          address,
          shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
          signer,
          provider,
          isDemo: false,
        },
        walletBalance: parseFloat(balance).toFixed(4),
        isGanache: onGanache && isContractDeployed(),
      });

      get().addNotification(
        onGanache && isContractDeployed()
          ? '🟢 Connected to Ganache — live contract mode!'
          : '🟡 Connected (Demo mode — deploy contract first)',
        'success'
      );
    } catch (err) {
      console.warn('MetaMask connect failed, falling back to demo:', err.message);
      // Demo fallback
      set({
        wallet: {
          address: '0xDemo1234567890AbCdEf1234567890AbCdEf12345',
          shortAddress: '0xDemo...2345',
          signer: null,
          provider: null,
          isDemo: true,
        },
        walletBalance: '4.2069',
        isGanache: false,
      });
      get().addNotification('🟡 Demo mode — MetaMask not detected', 'info');
    } finally {
      set({ isConnecting: false });
    }
  },

  disconnectWallet: () => set({ wallet: null, walletBalance: null, isGanache: false }),

  // Listen for MetaMask account / chain changes
  setupWalletListeners: () => {
    if (!window.ethereum) return;
    window.ethereum.on('accountsChanged', () => {
      get().disconnectWallet();
      get().addNotification('Wallet changed — please reconnect', 'warn');
    });
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  },

  // ── Scene ─────────────────────────────────────────────────────────────────
  selectedBuilding: null,
  hoveredBuilding: null,
  searchQuery: '',
  filterCategory: 'All',

  setSelectedBuilding: (building) => {
    set({ selectedBuilding: building, activePanel: building ? 'marketplace' : null });
    if (building) {
      const nfts = get().nftCache[building.id] || generateNFTs(building.id);
      set(state => ({ nftCache: { ...state.nftCache, [building.id]: nfts } }));
    }
  },
  setHoveredBuilding: (building) => set({ hoveredBuilding: building }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterCategory: (c) => set({ filterCategory: c }),

  // ── UI ───────────────────────────────────────────────────────────────────
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),

  // ── NFT state ─────────────────────────────────────────────────────────────
  nftCache: {},
  ownedNFTs: [],      // NFTs owned by this wallet
  listedNFTs: [],     // NFTs this wallet has listed for sale

  // ── Buy NFT ───────────────────────────────────────────────────────────────
  buyNFT: async (nft) => {
    const { wallet, isGanache } = get();
    if (!wallet) throw new Error('Connect wallet first');

    if (isGanache) {
      // ── Real contract call ──────────────────────────────────────────────
      const { ethers } = await import('ethers');
      const contract = await getContract(wallet.signer);
      const priceWei = ethers.parseEther(nft.priceEth.toString());

      // Get the on-chain tokenId from listing info (nft.onChainTokenId set when loaded)
      const tokenId = nft.onChainTokenId;
      if (!tokenId) throw new Error('NFT not found on-chain');

      const tx = await contract.buyNFT(tokenId, { value: priceWei });
      await tx.wait();

      // Refresh wallet balance
      const balance = await wallet.provider.getBalance(wallet.address);
      set({ walletBalance: parseFloat(ethers.formatEther(balance)).toFixed(4) });
    }

    // Update local state (works for both demo and real)
    const address = wallet.address;
    set(state => ({
      ownedNFTs: [...state.ownedNFTs, {
        ...nft,
        owner: wallet.shortAddress,
        available: false,
        listed: false,
      }],
      nftCache: {
        ...state.nftCache,
        [nft.buildingId]: state.nftCache[nft.buildingId]?.map(n =>
          n.id === nft.id
            ? { ...n, owner: wallet.shortAddress, available: false, listed: false }
            : n
        ),
      },
    }));
  },

  // ── List / Sell NFT ───────────────────────────────────────────────────────
  listNFT: async (nft, priceEth) => {
    const { wallet, isGanache } = get();
    if (!wallet) throw new Error('Connect wallet first');

    if (isGanache) {
      const { ethers } = await import('ethers');
      const contract  = await getContract(wallet.signer);
      const tokenId   = nft.onChainTokenId;
      if (!tokenId) throw new Error('NFT not found on-chain');
      const priceWei  = ethers.parseEther(priceEth.toString());

      // Step 1: approve contract to move the NFT
      const contractAddress = await contract.getAddress();
      const approveTx = await contract.approve(contractAddress, tokenId);
      await approveTx.wait();

      // Step 2: list
      const listTx = await contract.listNFT(tokenId, priceWei);
      await listTx.wait();
    }

    const listed = { ...nft, priceEth, listed: true, available: true };
    set(state => ({
      listedNFTs: [
        ...state.listedNFTs.filter(n => n.id !== nft.id),
        listed,
      ],
      ownedNFTs: state.ownedNFTs.filter(n => n.id !== nft.id),
      nftCache: {
        ...state.nftCache,
        [nft.buildingId]: state.nftCache[nft.buildingId]?.map(n =>
          n.id === nft.id ? { ...n, priceEth, listed: true, available: true } : n
        ),
      },
    }));
  },

  // ── Unlist NFT ────────────────────────────────────────────────────────────
  unlistNFT: async (nft) => {
    const { wallet, isGanache } = get();
    if (!wallet) throw new Error('Connect wallet first');

    if (isGanache) {
      const contract = await getContract(wallet.signer);
      const tokenId  = nft.onChainTokenId;
      if (!tokenId) throw new Error('NFT not found on-chain');
      const tx = await contract.unlistNFT(tokenId);
      await tx.wait();
    }

    set(state => ({
      listedNFTs: state.listedNFTs.filter(n => n.id !== nft.id),
      ownedNFTs: [...state.ownedNFTs, { ...nft, listed: false, available: false }],
      nftCache: {
        ...state.nftCache,
        [nft.buildingId]: state.nftCache[nft.buildingId]?.map(n =>
          n.id === nft.id ? { ...n, listed: false, available: false } : n
        ),
      },
    }));
  },

  // ── Transfer NFT ──────────────────────────────────────────────────────────
  transferNFT: async (nft, toAddress) => {
    const { wallet, isGanache } = get();
    if (!wallet) throw new Error('Connect wallet first');

    if (isGanache) {
      const { ethers } = await import('ethers');
      if (!ethers.isAddress(toAddress)) throw new Error('Invalid address');
      const contract = await getContract(wallet.signer);
      const tokenId  = nft.onChainTokenId;
      if (!tokenId) throw new Error('NFT not found on-chain');
      const tx = await contract.transferFrom(wallet.address, toAddress, tokenId);
      await tx.wait();
    }

    // Remove from owned
    set(state => ({
      ownedNFTs: state.ownedNFTs.filter(n => n.id !== nft.id),
      nftCache: {
        ...state.nftCache,
        [nft.buildingId]: state.nftCache[nft.buildingId]?.map(n =>
          n.id === nft.id ? { ...n, owner: toAddress, available: false } : n
        ),
      },
    }));
  },

  // ── Mint NFT from building collection ─────────────────────────────────────
  mintNFT: async (nft) => {
    const { wallet, isGanache } = get();
    if (!wallet) throw new Error('Connect wallet first');

    if (isGanache) {
      const { ethers } = await import('ethers');
      const contract = await getContract(wallet.signer);

      // Build a simple on-chain metadata URI (data URI JSON)
      const metadata = JSON.stringify({
        name: nft.name,
        description: `CSUF Campus NFT — ${nft.buildingId}`,
        attributes: [
          { trait_type: 'Rarity',    value: nft.rarity },
          { trait_type: 'Edition',   value: nft.edition },
          { trait_type: 'Effect',    value: nft.effect },
          { trait_type: 'Background',value: nft.bgName },
        ],
      });
      const uri = `data:application/json;utf8,${encodeURIComponent(metadata)}`;
      const mintPriceWei = ethers.parseEther('0.01');

      const tx = await contract.mint(nft.buildingId, uri, { value: mintPriceWei });
      const receipt = await tx.wait();

      // Extract minted tokenId from event
      const mintEvent = receipt.logs
        .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find(e => e?.name === 'NFTMinted');

      const onChainTokenId = mintEvent ? Number(mintEvent.args.tokenId) : null;

      // Refresh balance
      const balance = await wallet.provider.getBalance(wallet.address);
      set({ walletBalance: parseFloat(ethers.formatEther(balance)).toFixed(4) });

      const mintedNFT = {
        ...nft,
        onChainTokenId,
        owner: wallet.shortAddress,
        available: false,
        listed: false,
      };
      set(state => ({ ownedNFTs: [...state.ownedNFTs, mintedNFT] }));
      return mintedNFT;
    } else {
      // Demo: just add to owned
      const mintedNFT = { ...nft, owner: wallet.shortAddress, available: false, listed: false };
      set(state => ({
        ownedNFTs: [...state.ownedNFTs, mintedNFT],
        nftCache: {
          ...state.nftCache,
          [nft.buildingId]: state.nftCache[nft.buildingId]?.map(n =>
            n.id === nft.id ? { ...n, owner: wallet.shortAddress, available: false } : n
          ),
        },
      }));
      return mintedNFT;
    }
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: [],
  addNotification: (msg, type = 'info') => {
    const id = Date.now();
    set(state => ({ notifications: [...state.notifications, { id, msg, type }] }));
    setTimeout(() => set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })), 4500);
  },
}));
