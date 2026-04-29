import { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { useStore } from '../../store';
import { drawF } from '../../data/buildings';
import './TransferModal.css';

function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function TransferModal({ nft, onClose }) {
  const { transferNFT, wallet, addNotification, isGanache } = useStore();
  const [toAddress, setToAddress] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone]           = useState(false);

  const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(toAddress.trim());
  const svgStr = drawF(nft.fColor, nft.bg, 120, nft.effect, nft.hasHalo, nft.rotation, `tm_${nft.uid || nft.id}`);
  const artSrc = svgToDataUri(svgStr);

  const handleTransfer = async () => {
    if (!isValidAddress) { setError('Enter a valid 0x Ethereum address'); return; }
    if (!confirmed)      { setError('Check the confirmation box first'); return; }
    if (!wallet)         { setError('Connect your wallet first'); return; }

    setLoading(true);
    setError('');
    try {
      await transferNFT(nft, toAddress.trim());
      setDone(true);
      addNotification(`📤 "${nft.name}" transferred successfully!`, 'success');
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.message || 'Transfer failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="transfer-modal glass">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Send size={16} style={{ color: '#29D4C5' }} />
            <span>Transfer NFT</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {done ? (
          <div className="transfer-done">
            <CheckCircle size={40} color="#00C896" />
            <p>Transfer complete!</p>
          </div>
        ) : (
          <>
            {/* NFT Preview */}
            <div className="transfer-preview">
              <div className="transfer-art">
                <img src={artSrc} alt={nft.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              </div>
              <div className="transfer-nft-info">
                <div className="transfer-rarity" style={{ color: '#29D4C5' }}>{nft.rarity} · {nft.edition}</div>
                <div className="transfer-name">{nft.name}</div>
                <div className="transfer-id">Token #{nft.tokenId}</div>
              </div>
            </div>

            {/* Recipient Address */}
            <div className="modal-field">
              <label className="field-label">Recipient Address</label>
              <input
                type="text"
                className={`address-input ${toAddress && !isValidAddress ? 'invalid' : toAddress && isValidAddress ? 'valid' : ''}`}
                placeholder="0x..."
                value={toAddress}
                onChange={(e) => { setToAddress(e.target.value); setError(''); }}
                spellCheck={false}
              />
              {isGanache && (
                <div className="field-hint">
                  💡 Use any Ganache address from your accounts list
                </div>
              )}
              {!isGanache && (
                <div className="field-hint demo-hint">
                  🟡 Demo mode — no real transaction will occur
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="transfer-warning">
              <AlertTriangle size={14} color="#FFB800" />
              <span>Transfers are <strong>irreversible</strong>. Double-check the address before proceeding.</span>
            </div>

            {/* Confirm checkbox */}
            <label className="confirm-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => { setConfirmed(e.target.checked); setError(''); }}
              />
              <span>I understand this transfer cannot be undone</span>
            </label>

            {error && (
              <div className="modal-error">
                <AlertTriangle size={13} />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button
                className={`btn-confirm transfer ${loading ? 'loading' : ''}`}
                onClick={handleTransfer}
                disabled={loading || !toAddress}
              >
                {loading ? <span className="spinner" /> : <Send size={14} />}
                {loading ? 'Transferring...' : 'Send NFT'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
