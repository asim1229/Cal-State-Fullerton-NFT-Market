import { useState, useEffect } from 'react';
import { Gavel, Clock, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { drawF, RARITY_COLORS } from '../../data/buildings';
import { useStore } from '../../store';
import BidModal from './BidModal';
import './AuctionCard.css';

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

  const s  = Math.floor(remaining / 1000);
  const d  = Math.floor(s / 86400);
  const h  = Math.floor((s % 86400) / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const sc = s % 60;

  if (d > 0) return { text: `${d}d ${h}h ${m}m`, urgent: false, ended: false };
  if (h > 0) return { text: `${h}h ${m}m ${sc}s`, urgent: false, ended: false };
  if (m > 0) return { text: `${m}m ${sc}s`, urgent: m < 5, ended: false };
  if (remaining > 0) return { text: `${sc}s`, urgent: true, ended: false };
  return { text: 'Ended', urgent: false, ended: true };
}

export default function AuctionCard({ auction }) {
  const { endAuction, wallet, addNotification } = useStore();
  const [showBidModal, setShowBidModal] = useState(false);
  const [isEnding,     setIsEnding]     = useState(false);

  const countdown   = useCountdown(auction.endsAt);
  const nft         = auction.nft;
  const rarityColor = RARITY_COLORS[nft.rarity] || '#6B7A99';
  const svgStr      = drawF(nft.fColor, nft.bg, 160, nft.effect, nft.hasHalo, nft.rotation, nft.uid || nft.id);
  const artSrc      = svgToDataUri(svgStr);

  const isSeller  = wallet?.shortAddress === auction.seller;
  const canEnd    = countdown.ended && auction.active;

  const handleEnd = async () => {
    setIsEnding(true);
    try {
      await endAuction(auction.id);
    } catch (err) {
      addNotification(`Failed: ${err.message}`, 'error');
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <>
      <div className={`auction-card ${!auction.active ? 'ended' : ''} ${countdown.urgent ? 'urgent' : ''}`}>

        {/* Art */}
        <div className="ac-art" style={{ '--rarity-color': rarityColor }}>
          <img src={artSrc} alt={nft.name} className="ac-img" draggable={false} />
          <div className="ac-rarity-badge" style={{ color: rarityColor, borderColor: rarityColor }}>
            {nft.rarity}
          </div>

          {/* Countdown badge */}
          <div className={`ac-countdown ${countdown.urgent ? 'urgent' : ''} ${countdown.ended ? 'ended' : ''}`}>
            <Clock size={11} />
            {countdown.text}
          </div>

          {!auction.active && (
            <div className="ac-ended-overlay">
              <CheckCircle size={20} />
              <span>Auction Over</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="ac-info">
          <div className="ac-token-id">#{nft.tokenId} · {nft.edition}</div>
          <div className="ac-name">{nft.name}</div>

          {/* Stats */}
          <div className="ac-stats">
            <div className="ac-stat">
              <span className="ac-stat-label">Min Bid</span>
              <span className="ac-stat-val">Ξ {auction.minBid.toFixed(3)}</span>
            </div>
            <div className="ac-stat">
              <TrendingUp size={10} />
              <span className="ac-stat-label">Top</span>
              <span className="ac-stat-val highlight">
                {auction.highestBid > 0 ? `Ξ ${auction.highestBid.toFixed(3)}` : '—'}
              </span>
            </div>
            <div className="ac-stat">
              <Users size={10} />
              <span className="ac-stat-val">{auction.bids.length} bids</span>
            </div>
          </div>

          {/* Leader */}
          {auction.highestBidder && (
            <div className="ac-leader">🥇 {auction.highestBidder}</div>
          )}

          {/* Seller */}
          <div className="ac-seller">Seller: <span className="mono-small">{auction.seller}</span></div>

          {/* Action */}
          <div className="ac-actions">
            {canEnd ? (
              <button
                className={`ac-end-btn ${isEnding ? 'loading' : ''}`}
                onClick={handleEnd}
                disabled={isEnding}
              >
                {isEnding ? <span className="ac-spinner" /> : <CheckCircle size={13} />}
                {isEnding ? 'Settling...' : 'End Auction'}
              </button>
            ) : auction.active && !isSeller ? (
              <button className="ac-bid-btn" onClick={() => setShowBidModal(true)}>
                <Gavel size={13} />
                Place Bid
              </button>
            ) : auction.active && isSeller ? (
              <div className="ac-your-auction">Your Auction</div>
            ) : null}
          </div>
        </div>
      </div>

      {showBidModal && (
        <BidModal auction={auction} onClose={() => setShowBidModal(false)} />
      )}
    </>
  );
}
