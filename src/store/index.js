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
// Activity helpers
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVITY_ICONS = {
  mint:          '🔨',
  buy:           '🛒',
  list:          '🏷️',
  unlist:        '↩️',
  transfer:      '📤',
  bid:           '⚡',
  auction_start: '⏳',
  auction_win:   '🏆',
};

function makeActivity(type, nft, user, amount = null, extra = {}) {
  return {
    id:        Date.now() + Math.random(),
    type,
    icon:      ACTIVITY_ICONS[type] || '•',
    nft:       { id: nft.id, name: nft.name, buildingId: nft.buildingId, rarity: nft.rarity },
    user,
    amount,    // ETH string or null
    timestamp: Date.now(),
    ...extra,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create((set, get) => ({
  // ── Wallet ────────────────────────────────────────────────────────────────
  wallet: null,
  walletBalance: null,
  isConnecting: false,
  isGanache: false,

  connectWallet: async () => {
    set({ isConnecting: true });
    try {
      if (!window.ethereum) throw new Error('MetaMask not found');

      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);

      if (isContractDeployed()) {
        await switchToGanache(window.ethereum);
      }

      await provider.send('eth_requestAccounts', []);
      const signer    = await provider.getSigner();
      const address   = await signer.getAddress();
      const balanceBN = await provider.getBalance(address);
      const balance   = ethers.formatEther(balanceBN);

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
  activityOpen: false,
  setActivityOpen: (v) => set({ activityOpen: v }),

  // ── NFT state ─────────────────────────────────────────────────────────────
  nftCache: {},
  ownedNFTs: [],
  listedNFTs: [],

  // ── Activity Feed ──────────────────────────────────────────────────────────
  activityFeed: [],

  addActivity: (event) => {
    set(state => ({
      activityFeed: [event, ...state.activityFeed].slice(0, 200), // keep latest 200
    }));
  },

  // ── Auctions ──────────────────────────────────────────────────────────────
  // Each auction: { id, nft, seller, minBid, highestBid, highestBidder,
  //                 endsAt, active, bids: [{bidder, amount, timestamp}] }
  auctions: [],

  startAuction: async (nft, minBidEth, durationMs) => {
    const { wallet } = get();
    if (!wallet) throw new Error('Connect wallet first');

    const auction = {
      id:             `auction-${nft.id}-${Date.now()}`,
      nft,
      seller:         wallet.shortAddress,
      sellerFull:     wallet.address,
      minBid:         parseFloat(minBidEth),
      highestBid:     0,
      highestBidder:  null,
      endsAt:         Date.now() + durationMs,
      active:         true,
      bids:           [],
    };

    // Remove from owned NFTs (it's locked in auction)
    set(state => ({
      auctions:  [auction, ...state.auctions],
      ownedNFTs: state.ownedNFTs.filter(n => n.id !== nft.id),
    }));

    get().addActivity(makeActivity('auction_start', nft, wallet.shortAddress, minBidEth));
    get().addNotification(`⏳ Auction started for "${nft.name}"!`, 'success');
    return auction;
  },

  placeBid: async (auctionId, bidAmountEth) => {
    const { wallet, auctions } = get();
    if (!wallet) throw new Error('Connect wallet first');

    const bidAmount = parseFloat(bidAmountEth);
    const auction   = auctions.find(a => a.id === auctionId);
    if (!auction) throw new Error('Auction not found');
    if (!auction.active) throw new Error('Auction is not active');
    if (Date.now() > auction.endsAt) throw new Error('Auction has ended');
    if (bidAmount <= auction.highestBid) throw new Error(`Bid must be > ${auction.highestBid} ETH`);
    if (bidAmount < auction.minBid) throw new Error(`Bid must be >= ${auction.minBid} ETH`);

    const newBid = {
      bidder:    wallet.shortAddress,
      bidderFull: wallet.address,
      amount:    bidAmount,
      timestamp: Date.now(),
    };

    set(state => ({
      auctions: state.auctions.map(a =>
        a.id !== auctionId ? a : {
          ...a,
          highestBid:    bidAmount,
          highestBidder: wallet.shortAddress,
          bids:          [newBid, ...a.bids],
        }
      ),
      // Deduct simulated balance in demo mode
      walletBalance: wallet.isDemo
        ? (parseFloat(state.walletBalance) - bidAmount).toFixed(4)
        : state.walletBalance,
    }));

    get().addActivity(makeActivity('bid', auction.nft, wallet.shortAddress, bidAmountEth));
    get().addNotification(`⚡ Bid of ${bidAmount} ETH placed on "${auction.nft.name}"!`, 'success');
  },

  endAuction: async (auctionId) => {
    const { wallet, auctions } = get();
    if (!wallet) throw new Error('Connect wallet first');

    const auction = auctions.find(a => a.id === auctionId);
    if (!auction) throw new Error('Auction not found');
    if (!auction.active) throw new Error('Auction already ended');

    const winner = auction.highestBidder;
    const winnerNFT = {
      ...auction.nft,
      owner:    winner || auction.seller,
      available: false,
      listed:   false,
    };

    set(state => ({
      auctions: state.auctions.map(a =>
        a.id !== auctionId ? a : { ...a, active: false }
      ),
      // If current user won (or no bids, return to seller)
      ownedNFTs: winner
        ? (winner === wallet.shortAddress
            ? [...state.ownedNFTs, winnerNFT]
            : state.ownedNFTs)
        : [...state.ownedNFTs, winnerNFT], // no bids — return to seller
    }));

    if (winner) {
      get().addActivity(makeActivity('auction_win', auction.nft, winner, String(auction.highestBid)));
      get().addNotification(
        `🏆 Auction ended! "${auction.nft.name}" sold to ${winner} for ${auction.highestBid} ETH`,
        'success'
      );
    } else {
      get().addNotification(`↩️ Auction ended with no bids — "${auction.nft.name}" returned`, 'info');
    }
  },

  // ── Buy NFT ───────────────────────────────────────────────────────────────
  buyNFT: async (nft) => {
    const { wallet, isGanache } = get();
    if (!wallet) throw new Error('Connect wallet first');

    if (isGanache) {
      const { ethers } = await import('ethers');
      const contract = await getContract(wallet.signer);
      const priceWei = ethers.parseEther(nft.priceEth.toString());
      const tokenId  = nft.onChainTokenId;
      if (!tokenId) throw new Error('NFT not found on-chain');
      const tx = await contract.buyNFT(tokenId, { value: priceWei });
      await tx.wait();
      const balance = await wallet.provider.getBalance(wallet.address);
      set({ walletBalance: parseFloat(ethers.formatEther(balance)).toFixed(4) });
    }

    set(state => ({
      ownedNFTs: [...state.ownedNFTs, {
        ...nft,
        owner:     wallet.shortAddress,
        available: false,
        listed:    false,
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

    get().addActivity(makeActivity('buy', nft, wallet.shortAddress, nft.priceEth));
  },

  // ── List / Sell NFT ───────────────────────────────────────────────────────
  listNFT: async (nft, priceEth) => {
    const { wallet, isGanache } = get();
    if (!wallet) throw new Error('Connect wallet first');

    if (isGanache) {
      const { ethers } = await import('ethers');
      const contract      = await getContract(wallet.signer);
      const tokenId       = nft.onChainTokenId;
      if (!tokenId) throw new Error('NFT not found on-chain');
      const priceWei      = ethers.parseEther(priceEth.toString());
      const contractAddress = await contract.getAddress();
      const approveTx     = await contract.approve(contractAddress, tokenId);
      await approveTx.wait();
      const listTx        = await contract.listNFT(tokenId, priceWei);
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

    get().addActivity(makeActivity('list', nft, wallet.shortAddress, priceEth));
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
      ownedNFTs:  [...state.ownedNFTs, { ...nft, listed: false, available: false }],
      nftCache: {
        ...state.nftCache,
        [nft.buildingId]: state.nftCache[nft.buildingId]?.map(n =>
          n.id === nft.id ? { ...n, listed: false, available: false } : n
        ),
      },
    }));

    get().addActivity(makeActivity('unlist', nft, wallet.shortAddress));
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

    set(state => ({
      ownedNFTs: state.ownedNFTs.filter(n => n.id !== nft.id),
      nftCache: {
        ...state.nftCache,
        [nft.buildingId]: state.nftCache[nft.buildingId]?.map(n =>
          n.id === nft.id ? { ...n, owner: toAddress, available: false } : n
        ),
      },
    }));

    get().addActivity(makeActivity('transfer', nft, wallet.shortAddress, null, { to: toAddress }));
  },

  // ── Mint NFT from building collection ─────────────────────────────────────
  mintNFT: async (nft) => {
    const { wallet, isGanache } = get();
    if (!wallet) throw new Error('Connect wallet first');

    if (isGanache) {
      const { ethers } = await import('ethers');
      const contract = await getContract(wallet.signer);
      const metadata = JSON.stringify({
        name: nft.name,
        description: `CSUF Campus NFT — ${nft.buildingId}`,
        attributes: [
          { trait_type: 'Rarity',     value: nft.rarity },
          { trait_type: 'Edition',    value: nft.edition },
          { trait_type: 'Effect',     value: nft.effect },
          { trait_type: 'Background', value: nft.bgName },
        ],
      });
      const uri          = `data:application/json;utf8,${encodeURIComponent(metadata)}`;
      const mintPriceWei = ethers.parseEther('0.01');
      const tx           = await contract.mint(nft.buildingId, uri, { value: mintPriceWei });
      const receipt      = await tx.wait();

      const mintEvent = receipt.logs
        .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find(e => e?.name === 'NFTMinted');

      const onChainTokenId = mintEvent ? Number(mintEvent.args.tokenId) : null;
      const balance = await wallet.provider.getBalance(wallet.address);
      set({ walletBalance: parseFloat(ethers.formatEther(balance)).toFixed(4) });

      const mintedNFT = { ...nft, onChainTokenId, owner: wallet.shortAddress, available: false, listed: false };
      set(state => ({ ownedNFTs: [...state.ownedNFTs, mintedNFT] }));
      get().addActivity(makeActivity('mint', mintedNFT, wallet.shortAddress, '0.01'));
      return mintedNFT;
    } else {
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
      get().addActivity(makeActivity('mint', mintedNFT, wallet.shortAddress, '0.01'));
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
