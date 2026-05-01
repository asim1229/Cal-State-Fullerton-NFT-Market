import { useState } from 'react';
import { Heart, Eye, ShoppingCart, Tag, CheckCircle, Send, Gavel } from 'lucide-react';
import { RARITY_COLORS, drawF } from '../../data/buildings';
import './NFTCard.css';

function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function NFTCard({ nft, showSell, isBuying, onBuy, onSell, onTransfer, onUnlist, showUnlist, showAuction, onAuction }) {
  const [liked, setLiked] = useState(false);

  const rarityColor = RARITY_COLORS[nft.rarity] || '#6B7A99';
  const svgStr = drawF(nft.fColor, nft.bg, 200, nft.effect, nft.hasHalo, nft.rotation, nft.uid || nft.id);
  const artSrc = svgToDataUri(svgStr);

  return (
    <div className={`nft-card ${!nft.available ? 'sold' : ''}`}>
      {/* SVG Art */}
      <div className="nft-art" style={{ '--rarity-color': rarityColor }}>
        <img src={artSrc} alt={nft.name} className="nft-svg-img" draggable={false} />
        <div className="nft-rarity-badge" style={{ color: rarityColor, borderColor: rarityColor }}>
          {nft.rarity}
        </div>
        {nft.effect && nft.effect !== 'None' && (
          <div className="nft-effect-badge">{nft.effect}</div>
        )}
        {!nft.available && (
          <div className="nft-sold-overlay">
            <CheckCircle size={20} />
            <span>Owned</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="nft-info">
        <div className="nft-header">
          <div>
            <div className="nft-token-id">#{nft.tokenId} · {nft.edition}</div>
            <div className="nft-name">{nft.name}</div>
          </div>
          <button className={`nft-like ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)}>
            <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
            <span>{nft.likes + (liked ? 1 : 0)}</span>
          </button>
        </div>

        <div className="nft-meta">
          <div className="nft-owner">
            <span className="meta-label">Owner</span>
            <span className="meta-value mono">
              {typeof nft.owner === 'string' && nft.owner.length > 12
                ? `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`
                : nft.owner}
            </span>
          </div>
          <div className="nft-views">
            <Eye size={11} />
            <span>{nft.views}</span>
          </div>
        </div>

        <div className="nft-footer">
          <div className="nft-price">
            <span className="price-eth">Ξ {nft.priceEth}</span>
            <span className="price-usd">${nft.priceUsd}</span>
          </div>

          <div className="nft-actions">
            {showUnlist ? (
              <button className="btn-unlist" onClick={onUnlist}>
                <Tag size={13} />
                Unlist
              </button>
            ) : showSell ? (
              <>
                <button className="btn-sell" onClick={onSell}>
                  <Tag size={13} />
                  List
                </button>
                {showAuction && (
                  <button className="btn-auction" onClick={onAuction} title="Start Auction">
                    <Gavel size={13} />
                  </button>
                )}
                <button className="btn-transfer" onClick={onTransfer}>
                  <Send size={13} />
                </button>
              </>
            ) : (
              <button
                className={`btn-buy ${isBuying ? 'loading' : ''} ${!nft.available ? 'disabled' : ''}`}
                onClick={nft.available ? onBuy : undefined}
                disabled={!nft.available || isBuying}
              >
                {isBuying ? <span className="spinner" /> : <ShoppingCart size={13} />}
                {isBuying ? 'Buying...' : nft.available ? 'Buy' : 'Sold'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
