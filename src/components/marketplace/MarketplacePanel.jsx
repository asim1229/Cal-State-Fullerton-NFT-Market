import { useState } from 'react';
import { X, ShoppingCart, Tag, Package, Send, RotateCcw } from 'lucide-react';
import { useStore } from '../../store';
import { generateNFTs } from '../../data/buildings';
import NFTCard from './NFTCard';
import SellModal from './SellModal';
import TransferModal from './TransferModal';
import './MarketplacePanel.css';

const TABS = ['Collection', 'My NFTs', 'Listed'];

export default function MarketplacePanel() {
  const {
    selectedBuilding,
    setSelectedBuilding,
    wallet,
    connectWallet,
    nftCache,
    ownedNFTs,
    listedNFTs,
    buyNFT,
    unlistNFT,
    addNotification,
    isGanache,
  } = useStore();

  const [activeTab,    setActiveTab]    = useState('Collection');
  const [sellTarget,   setSellTarget]   = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [buying,       setBuying]       = useState(null);
  const [unlisting,    setUnlisting]    = useState(null);
  const [rarityFilter, setRarityFilter] = useState('All');
  const [search,       setSearch]       = useState('');

  if (!selectedBuilding) return null;

  const collectionNFTs = nftCache[selectedBuilding.id] || generateNFTs(selectedBuilding.id);
  const myNFTs    = ownedNFTs.filter(n => n.buildingId === selectedBuilding.id);
  const myListings = listedNFTs.filter(n => n.buildingId === selectedBuilding.id);

  // Apply rarity + search filters
  const applyFilters = (list) => {
    return list.filter(n => {
      const matchRarity = rarityFilter === 'All' || n.rarity === rarityFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || n.name.toLowerCase().includes(q) || String(n.tokenId).includes(q);
      return matchRarity && matchSearch;
    });
  };

  const tabData = {
    Collection: applyFilters(collectionNFTs),
    'My NFTs':  applyFilters(myNFTs),
    Listed:     applyFilters(myListings),
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleBuy = async (nft) => {
    if (!wallet) {
      addNotification('Connect your wallet to buy NFTs', 'warn');
      connectWallet();
      return;
    }
    setBuying(nft.id);
    try {
      await buyNFT(nft);
      addNotification(`🎉 You now own "${nft.name}"!`, 'success');
    } catch (err) {
      addNotification(`Buy failed: ${err.message}`, 'error');
    } finally {
      setBuying(null);
    }
  };

  const handleUnlist = async (nft) => {
    setUnlisting(nft.id);
    try {
      await unlistNFT(nft);
      addNotification(`↩️ "${nft.name}" unlisted — returned to your wallet`, 'success');
    } catch (err) {
      addNotification(`Unlist failed: ${err.message}`, 'error');
    } finally {
      setUnlisting(null);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const prices = collectionNFTs.map(n => parseFloat(n.priceEth));
  const stats = {
    total:      collectionNFTs.length,
    available:  collectionNFTs.filter(n => n.available).length,
    floorPrice: Math.min(...prices).toFixed(3),
    volume:     prices.reduce((s, p) => s + p, 0).toFixed(2),
  };

  const RARITIES = ['All', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

  return (
    <>
      <div className="marketplace-panel glass" style={{ '--building-color': selectedBuilding.color }}>

        {/* Header */}
        <div className="panel-header">
          <div className="panel-header-accent" />
          <div className="panel-header-content">
            <div className="panel-building-info">
              <div className="panel-building-code" style={{ color: selectedBuilding.color }}>
                {selectedBuilding.shortName}
              </div>
              <h2 className="panel-building-name">{selectedBuilding.name}</h2>
              <p className="panel-building-desc">{selectedBuilding.description}</p>
            </div>
            <button className="panel-close" onClick={() => setSelectedBuilding(null)}>
              <X size={16} />
            </button>
          </div>

          {/* Chain status badge */}
          <div className="chain-status">
            <span className={`chain-dot ${isGanache ? 'live' : 'demo'}`} />
            <span className="chain-label">
              {isGanache ? '🟢 Ganache Live' : '🟡 Demo Mode'}
            </span>
          </div>

          {/* Stats */}
          <div className="panel-stats">
            <div className="stat-item">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Items</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-value">{stats.available}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-value">{stats.floorPrice} Ξ</div>
              <div className="stat-label">Floor</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-value">{stats.volume} Ξ</div>
              <div className="stat-label">Volume</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="panel-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Collection' && <ShoppingCart size={12} />}
              {tab === 'My NFTs'   && <Package size={12} />}
              {tab === 'Listed'    && <Tag size={12} />}
              {tab}
              {tab === 'My NFTs'  && myNFTs.length    > 0 && <span className="tab-badge">{myNFTs.length}</span>}
              {tab === 'Listed'   && myListings.length > 0 && <span className="tab-badge">{myListings.length}</span>}
            </button>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="panel-filters">
          <div className="rarity-filters">
            {RARITIES.map(r => (
              <button
                key={r}
                className={`rarity-pill ${rarityFilter === r ? 'active' : ''}`}
                onClick={() => setRarityFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            className="nft-search"
            placeholder="Search name or #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* NFT Grid */}
        <div className="panel-nfts">
          {tabData[activeTab].length === 0 ? (
            <div className="panel-empty">
              <Package size={32} opacity={0.3} />
              <p>
                {activeTab === 'My NFTs'  ? 'No NFTs owned yet'   :
                 activeTab === 'Listed'   ? 'No active listings'   :
                 'No NFTs match filter'}
              </p>
              {activeTab === 'My NFTs' && (
                <button className="empty-cta" onClick={() => setActiveTab('Collection')}>
                  Browse Collection
                </button>
              )}
            </div>
          ) : (
            tabData[activeTab].map(nft => (
              <NFTCard
                key={nft.id}
                nft={nft}
                showSell={activeTab === 'My NFTs'}
                showUnlist={activeTab === 'Listed'}
                isBuying={buying === nft.id}
                onBuy={() => handleBuy(nft)}
                onSell={() => setSellTarget(nft)}
                onTransfer={() => setTransferTarget(nft)}
                onUnlist={() => handleUnlist(nft)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {sellTarget && (
        <SellModal
          nft={sellTarget}
          onClose={() => setSellTarget(null)}
        />
      )}

      {transferTarget && (
        <TransferModal
          nft={transferTarget}
          onClose={() => setTransferTarget(null)}
        />
      )}
    </>
  );
}
