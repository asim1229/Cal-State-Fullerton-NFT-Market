import { useState } from 'react';
import { X, Clock, Gavel } from 'lucide-react';
import { drawF, RARITY_COLORS } from '../../data/buildings';
import { useStore } from '../../store';
import './AuctionModal.css';

const DURATIONS = [
  { label: '1 Hour',   ms: 60 * 60 * 1000 },
  { label: '6 Hours',  ms: 6 * 60 * 60 * 1000 },
  { label: '24 Hours', ms: 24 * 60 * 60 * 1000 },
  { label: '3 Days',   ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '7 Days',   ms: 7 * 24 * 60 * 60 * 1000 },
];

function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function AuctionModal({ nft, onClose }) {
  const { startAuction, addNotification } = useStore();
  const [minBid,       setMinBid]       = useState('0.1');
  const [durationIdx,  setDurationIdx]  = useState(2); // 24h default
  const [isStarting,   setIsStarting]   = useState(false);

  const rarityColor = RARITY_COLORS[nft.rarity] || '#6B7A99';
  const svgStr = drawF(nft.fColor, nft.bg, 120, nft.effect, nft.hasHalo, nft.rotation, nft.uid || nft.id);
  const artSrc = svgToDataUri(svgStr);
  const endsAt = new Date(Date.now() + DURATIONS[durationIdx].ms);

  const handleStart = async () => {
    const bid = parseFloat(minBid);
    if (isNaN(bid) || bid <= 0) {
      addNotification('Enter a valid minimum bid', 'warn');
      return;
    }
    setIsStarting(true);
    try {
      await startAuction(nft, minBid, DURATIONS[durationIdx].ms);
      onClose();
    } catch (err) {
      addNotification(`Auction failed: ${err.message}`, 'error');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="auction-modal-overlay" onClick={onClose}>
      <div className="auction-modal glass" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="am-header">
          <div className="am-title">
            <Gavel size={18} />
            Start Auction
          </div>
          <button className="am-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* NFT Preview */}
        <div className="am-preview">
          <img src={artSrc} alt={nft.name} className="am-art" draggable={false} />
          <div className="am-nft-info">
            <div className="am-nft-name">{nft.name}</div>
            <div className="am-nft-rarity" style={{ color: rarityColor }}>{nft.rarity}</div>
            <div className="am-nft-edition">{nft.edition} Edition</div>
          </div>
        </div>

        {/* Minimum Bid */}
        <div className="am-field">
          <label className="am-label">Minimum Bid (ETH)</label>
          <div className="am-input-wrap">
            <span className="am-eth-symbol">Ξ</span>
            <input
              type="number"
              className="am-input"
              value={minBid}
              min="0.001"
              step="0.01"
              onChange={e => setMinBid(e.target.value)}
              placeholder="0.1"
            />
          </div>
          <div className="am-hint">≈ ${(parseFloat(minBid || 0) * 2340).toFixed(0)} USD</div>
        </div>

        {/* Duration */}
        <div className="am-field">
          <label className="am-label">Auction Duration</label>
          <div className="am-duration-grid">
            {DURATIONS.map((d, i) => (
              <button
                key={d.label}
                className={`am-duration-btn ${durationIdx === i ? 'active' : ''}`}
                onClick={() => setDurationIdx(i)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* End time preview */}
        <div className="am-ends-at">
          <Clock size={13} />
          Ends: <strong>{endsAt.toLocaleString()}</strong>
        </div>

        {/* Actions */}
        <div className="am-actions">
          <button className="am-cancel" onClick={onClose}>Cancel</button>
          <button
            className={`am-start ${isStarting ? 'loading' : ''}`}
            onClick={handleStart}
            disabled={isStarting}
          >
            {isStarting ? <span className="am-spinner" /> : <Gavel size={15} />}
            {isStarting ? 'Starting...' : 'Start Auction'}
          </button>
        </div>
      </div>
    </div>
  );
}
