import { X, Activity, ShoppingCart, Gavel, Tag, ArrowUpRight, Repeat, Hammer, Trophy } from 'lucide-react';
import { useStore } from '../../store';
import { RARITY_COLORS } from '../../data/buildings';
import './ActivityFeed.css';

const TYPE_META = {
  mint:          { icon: <Hammer size={14} />,       label: 'Minted',         color: '#00C896' },
  buy:           { icon: <ShoppingCart size={14} />, label: 'Purchased',      color: '#4A9EFF' },
  list:          { icon: <Tag size={14} />,          label: 'Listed',         color: '#FF7900' },
  unlist:        { icon: <ArrowUpRight size={14} />, label: 'Unlisted',       color: '#6B7A99' },
  transfer:      { icon: <Repeat size={14} />,       label: 'Transferred',    color: '#B45FFF' },
  bid:           { icon: <Gavel size={14} />,        label: 'Bid Placed',     color: '#FFB800' },
  auction_start: { icon: <Activity size={14} />,     label: 'Auction Started', color: '#FF6B35' },
  auction_win:   { icon: <Trophy size={14} />,       label: 'Auction Won',    color: '#FFB800' },
};

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ActivityItem({ event }) {
  const meta        = TYPE_META[event.type] || { icon: '•', label: event.type, color: '#6B7A99' };
  const rarityColor = RARITY_COLORS[event.nft?.rarity] || '#6B7A99';

  return (
    <div className="af-item">
      <div className="af-icon" style={{ background: `${meta.color}18`, color: meta.color }}>
        {meta.icon}
      </div>
      <div className="af-body">
        <div className="af-top-row">
          <span className="af-label" style={{ color: meta.color }}>{meta.label}</span>
          <span className="af-time">{timeAgo(event.timestamp)}</span>
        </div>
        <div className="af-nft-name">
          <span className="af-rarity-dot" style={{ background: rarityColor }} />
          {event.nft?.name || 'Unknown NFT'}
        </div>
        <div className="af-user-row">
          <span className="af-user mono-small">{event.user}</span>
          {event.amount && (
            <span className="af-amount">Ξ {parseFloat(event.amount).toFixed(3)}</span>
          )}
          {event.to && (
            <span className="af-to">→ <span className="mono-small">{event.to.slice(0, 10)}…</span></span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActivityFeed({ open, onClose }) {
  const { activityFeed } = useStore();

  return (
    <div className={`activity-feed-overlay ${open ? 'visible' : ''}`} onClick={onClose}>
      <div
        className={`activity-feed glass ${open ? 'open' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="af-header">
          <div className="af-title">
            <Activity size={16} />
            Activity Feed
            {activityFeed.length > 0 && (
              <span className="af-count">{activityFeed.length}</span>
            )}
          </div>
          <button className="af-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Content */}
        <div className="af-list">
          {activityFeed.length === 0 ? (
            <div className="af-empty">
              <Activity size={32} opacity={0.2} />
              <p>No activity yet</p>
              <p className="af-empty-hint">Connect your wallet and start interacting with the marketplace</p>
            </div>
          ) : (
            activityFeed.map(event => (
              <ActivityItem key={event.id} event={event} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
