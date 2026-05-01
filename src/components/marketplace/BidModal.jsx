import { useState, useEffect } from 'react';
import { X, Gavel, Clock, TrendingUp, Users } from 'lucide-react';
import { drawF, RARITY_COLORS } from '../../data/buildings';
import { useStore } from '../../store';
import './BidModal.css';

function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function useCountdown(endsAt) {
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const tick = setInterval(() => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [endsAt]);

  const s = Math.floor(remaining / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = s % 60;

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sc}s`;
  if (m > 0) return `${m}m ${sc}s`;
  return remaining > 0 ? `${sc}s` : 'Ended';
}

export default function BidModal({ auction, onClose }) {
  const { placeBid, addNotification, wallet } = useStore();
  const [bidAmount, setBidAmount] = useState(
    (auction.highestBid > 0
      ? (auction.highestBid + 0.01).toFixed(3)
      : auction.minBid.toFixed(3))
  );
  const [isBidding, setIsBidding] = useState(false);
  const countdown = useCountdown(auction.endsAt);

  const nft = auction.nft;
  const rarityColor = RARITY_COLORS[nft.rarity] || '#6B7A99';
  const svgStr = drawF(nft.fColor, nft.bg, 120, nft.effect, nft.hasHalo, nft.rotation, nft.uid || nft.id);
  const artSrc = svgToDataUri(svgStr);

  const isEnded   = Date.now() > auction.endsAt;
  const minNeeded = Math.max(auction.minBid, auction.highestBid + 0.001);

  const handleBid = async () => {
    const bid = parseFloat(bidAmount);
    if (isNaN(bid) || bid < minNeeded) {
      addNotification(`Bid must be ≥ ${minNeeded.toFixed(3)} ETH`, 'warn');
      return;
    }
    setIsBidding(true);
    try {
      await placeBid(auction.id, bidAmount);
      onClose();
    } catch (err) {
      addNotification(`Bid failed: ${err.message}`, 'error');
    } finally {
      setIsBidding(false);
    }
  };

  return (
    <div className="bid-modal-overlay" onClick={onClose}>
      <div className="bid-modal glass" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bm-header">
          <div className="bm-title">
            <Gavel size={18} />
            Place a Bid
          </div>
          <button className="bm-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* NFT + Countdown row */}
        <div className="bm-top">
          <img src={artSrc} alt={nft.name} className="bm-art" />
          <div className="bm-meta">
            <div className="bm-nft-name">{nft.name}</div>
            <div className="bm-rarity" style={{ color: rarityColor }}>{nft.rarity}</div>
            <div className="bm-seller">Seller: <span>{auction.seller}</span></div>

            {/* Countdown */}
            <div className={`bm-countdown ${isEnded ? 'ended' : ''}`}>
              <Clock size={13} />
              {isEnded ? 'Auction Ended' : countdown}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="bm-stats">
          <div className="bm-stat">
            <div className="bm-stat-label">Min Bid</div>
            <div className="bm-stat-value">Ξ {auction.minBid.toFixed(3)}</div>
          </div>
          <div className="bm-stat">
            <div className="bm-stat-label"><TrendingUp size={11} /> Highest</div>
            <div className="bm-stat-value highlight">
              {auction.highestBid > 0 ? `Ξ ${auction.highestBid.toFixed(3)}` : 'No bids'}
            </div>
          </div>
          <div className="bm-stat">
            <div className="bm-stat-label"><Users size={11} /> Bids</div>
            <div className="bm-stat-value">{auction.bids.length}</div>
          </div>
        </div>

        {/* Current highest bidder */}
        {auction.highestBidder && (
          <div className="bm-leader">
            🥇 Leading: <span className="mono">{auction.highestBidder}</span>
          </div>
        )}

        {/* Bid input */}
        {!isEnded && (
          <div className="bm-field">
            <label className="bm-label">Your Bid (ETH)</label>
            <div className="bm-input-wrap">
              <span className="bm-eth">Ξ</span>
              <input
                type="number"
                className="bm-input"
                value={bidAmount}
                min={minNeeded}
                step="0.001"
                onChange={e => setBidAmount(e.target.value)}
              />
            </div>
            <div className="bm-hint">≈ ${(parseFloat(bidAmount || 0) * 2340).toFixed(0)} USD</div>
          </div>
        )}

        {/* Bid history */}
        {auction.bids.length > 0 && (
          <div className="bm-history">
            <div className="bm-history-title">Bid History</div>
            {auction.bids.slice(0, 5).map((bid, i) => (
              <div key={i} className="bm-bid-row">
                <span className="mono-small">{bid.bidder}</span>
                <span className="bm-bid-amount">Ξ {bid.amount.toFixed(3)}</span>
                <span className="bm-bid-time">{new Date(bid.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="bm-actions">
          <button className="bm-cancel" onClick={onClose}>Cancel</button>
          {!isEnded ? (
            <button
              className={`bm-bid-btn ${isBidding ? 'loading' : ''}`}
              onClick={handleBid}
              disabled={isBidding || isEnded}
            >
              {isBidding ? <span className="bm-spinner" /> : <Gavel size={15} />}
              {isBidding ? 'Bidding...' : 'Place Bid'}
            </button>
          ) : (
            <div className="bm-ended-note">Auction has ended</div>
          )}
        </div>
      </div>
    </div>
  );
}
