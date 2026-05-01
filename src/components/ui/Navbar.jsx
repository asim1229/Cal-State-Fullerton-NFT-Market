import { useState } from 'react';
import { Search, X, Wallet, ChevronDown, Layers, Activity } from 'lucide-react';
import { useStore } from '../../store';
import { CAMPUS_BUILDINGS } from '../../data/buildings';
import './Navbar.css';

const CATEGORIES = ['All', 'Academic', 'Student Life', 'Administration', 'Athletics', 'Arts'];

export default function Navbar() {
  const {
    wallet, walletBalance, isConnecting, connectWallet, disconnectWallet,
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    setSelectedBuilding,
    isGanache,
    activityFeed, activityOpen, setActivityOpen,
  } = useStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const searchResults = searchQuery.length > 1
    ? CAMPUS_BUILDINGS.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <nav className="navbar glass">
      {/* Logo */}
      <div className="navbar-brand">
        <div className="brand-icon">
          <Layers size={18} strokeWidth={2.5} />
        </div>
        <div className="brand-text">
          <span className="brand-name">CSUF</span>
          <span className="brand-sub">NFT CAMPUS</span>
        </div>
      </div>

      {/* Category filters */}
      <div className="navbar-filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-pill ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={`navbar-search ${searchOpen ? 'open' : ''}`}>
        <button className="search-toggle" onClick={() => setSearchOpen(!searchOpen)}>
          {searchOpen ? <X size={16} /> : <Search size={16} />}
        </button>
        {searchOpen && (
          <div className="search-input-wrap">
            <input
              autoFocus
              className="search-input"
              placeholder="Search buildings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="search-dropdown glass">
                {searchResults.map(b => (
                  <button
                    key={b.id}
                    className="search-result"
                    onClick={() => {
                      setSelectedBuilding(b);
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                  >
                    <span className="result-code" style={{ color: b.color }}>{b.shortName}</span>
                    <span className="result-name">{b.name}</span>
                    <span className="result-cat">{b.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Feed button */}
      <button
        className="navbar-activity-btn"
        onClick={() => setActivityOpen(!activityOpen)}
        title="Activity Feed"
      >
        <Activity size={16} />
        {activityFeed.length > 0 && (
          <span className="activity-count">{activityFeed.length}</span>
        )}
      </button>

      {/* Wallet */}
      <div className="navbar-wallet">
        {wallet ? (
          <div className="wallet-connected">
            <button
              className="wallet-badge"
              onClick={() => setWalletOpen(!walletOpen)}
            >
              <div className={`wallet-dot ${isGanache ? 'live' : ''}`} />
              <span className="wallet-address">{wallet.shortAddress}</span>
              <span className="wallet-balance">{parseFloat(walletBalance).toFixed(3)} ETH</span>
              <ChevronDown size={12} />
            </button>
            {walletOpen && (
              <div className="wallet-dropdown glass">
                <div className="wallet-info">
                  <div className="wallet-info-label">Connected Wallet</div>
                  <div className="wallet-info-address mono-small">{wallet.address}</div>
                  <div className="wallet-info-balance">{walletBalance} ETH</div>
                  <div className="wallet-chain-badge" style={{
                    marginTop: 6, fontSize: 10, fontFamily: 'monospace',
                    color: isGanache ? '#00C896' : '#FFB800',
                    padding: '3px 8px', borderRadius: 4,
                    background: isGanache ? 'rgba(0,200,150,0.1)' : 'rgba(255,184,0,0.1)',
                    border: `1px solid ${isGanache ? 'rgba(0,200,150,0.3)' : 'rgba(255,184,0,0.3)'}`,
                    display: 'inline-block',
                  }}>
                    {isGanache ? '🟢 Ganache Live' : wallet.isDemo ? '🟡 Demo Mode' : '🔵 Testnet'}
                  </div>
                </div>
                <button className="wallet-disconnect" onClick={() => { disconnectWallet(); setWalletOpen(false); }}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="wallet-connect-btn"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            <Wallet size={15} />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
}
