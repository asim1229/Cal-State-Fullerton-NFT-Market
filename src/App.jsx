import { useState, useCallback } from 'react';
import CampusScene from './components/3d/CampusScene';
import Navbar from './components/ui/Navbar';
import HUD from './components/ui/HUD';
import MarketplacePanel from './components/marketplace/MarketplacePanel';
import ToastContainer from './components/ui/Toast';
import ActivityFeed from './components/ui/ActivityFeed';
import { useStore } from './store';
import { CAMPUS_BUILDINGS } from './data/buildings';
import './App.css';

// ── Pin Editor Panel ────────────────────────────────────────────────────────
function PinEditorPanel({ buildings, selectedId, onSelectId, onUpdate, onClose }) {
  const building = buildings.find(b => b.id === selectedId);
  if (!building) return null;

  const axes = ['x', 'y', 'z'];
  const labels = ['X — left / right', 'Y — height', 'Z — forward / back'];
  const colors = ['#ff6b6b', '#6bff6b', '#6b9fff'];

  const update = (axis, val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    onUpdate(selectedId, axis, num);
  };

  return (
    <div style={{
      position: 'fixed', top: 70, right: 16, zIndex: 9999,
      background: 'rgba(8,11,20,0.97)', border: '1px solid #FF7900',
      borderRadius: 12, padding: 18, width: 270, color: '#f0f4ff',
      fontFamily: 'monospace', fontSize: 12,
      boxShadow: '0 0 30px rgba(255,121,0,0.4)',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: '#FF7900', fontWeight: 700, fontSize: 14 }}>📍 Pin Editor</span>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid #444', color: '#aaa',
          borderRadius: 5, padding: '2px 10px', cursor: 'pointer', fontSize: 11
        }}>✕ Close</button>
      </div>

      {/* Building selector */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: '#888', marginBottom: 5, fontSize: 11 }}>SELECT BUILDING</div>
        <select
          value={selectedId}
          onChange={e => onSelectId(e.target.value)}
          style={{
            width: '100%', background: '#151c2c', color: '#f0f4ff',
            border: '1px solid #2a3550', borderRadius: 6,
            padding: '5px 8px', fontSize: 12, outline: 'none'
          }}
        >
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Sliders */}
      {axes.map((axis, i) => {
        const val = building.position[i];
        return (
          <div key={axis} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: colors[i], fontSize: 11 }}>{labels[i]}</span>
              <span style={{ color: '#FF7900', fontWeight: 700 }}>{val.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={axis === 'y' ? '0' : '-8'}
              max={axis === 'y' ? '4' : '8'}
              step="0.05"
              value={val}
              onChange={e => update(axis, e.target.value)}
              style={{ width: '100%', accentColor: '#FF7900', cursor: 'pointer' }}
            />
          </div>
        );
      })}

      {/* Coordinate output */}
      <div style={{
        marginTop: 14, padding: 10, background: '#0a0f1a',
        borderRadius: 7, border: '1px solid #1e2a40'
      }}>
        <div style={{ color: '#666', marginBottom: 5, fontSize: 10 }}>COPY TO buildings.js:</div>
        <code style={{ color: '#FF7900', fontSize: 11, wordBreak: 'break-all' }}>
          position: [{building.position.map(v => v.toFixed(2)).join(', ')}]
        </code>
      </div>

      {/* Tip */}
      <div style={{ marginTop: 10, color: '#555', fontSize: 10, lineHeight: 1.6 }}>
        💡 Click anywhere on the ground in the 3D scene to snap this pin to that exact spot.
      </div>
    </div>
  );
}

// ── App Root ────────────────────────────────────────────────────────────────
export default function App() {
  const { selectedBuilding, activityOpen, setActivityOpen } = useStore();
  const [editMode, setEditMode] = useState(false);
  const [editSelectedId, setEditSelectedId] = useState(CAMPUS_BUILDINGS[0].id);
  const [buildings, setBuildings] = useState(
    CAMPUS_BUILDINGS.map(b => ({ ...b, position: [...b.position] }))
  );

  const handlePositionUpdate = useCallback((id, axis, val) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== id) return b;
      const pos = [...b.position];
      pos[['x', 'y', 'z'].indexOf(axis)] = val;
      return { ...b, position: pos };
    }));
  }, []);

  const handleGroundPick = useCallback((point) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== editSelectedId) return b;
      return { ...b, position: [+point.x.toFixed(2), b.position[1], +point.z.toFixed(2)] };
    }));
  }, [editSelectedId]);

  return (
    <div className={`app-root ${selectedBuilding ? 'panel-open' : ''}`}>
      {/* 3D Scene */}
      <CampusScene
        editMode={editMode}
        editSelectedId={editSelectedId}
        buildings={buildings}
        onGroundPick={handleGroundPick}
        onBuildingEditSelect={setEditSelectedId}
      />

      {/* Top nav */}
      <Navbar />

      {/* ── Pin Editor toggle button — fixed above navbar ── */}
      <button
        onClick={() => setEditMode(e => !e)}
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: editMode ? '#FF7900' : 'rgba(8,11,20,0.92)',
          color: editMode ? '#000' : '#FF7900',
          border: '1.5px solid #FF7900',
          borderRadius: 8,
          padding: '8px 22px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: 700,
          boxShadow: editMode
            ? '0 0 20px rgba(255,121,0,0.7)'
            : '0 0 10px rgba(255,121,0,0.2)',
          whiteSpace: 'nowrap',
        }}
      >
        {editMode ? '✅ EXIT PIN EDITOR' : '📍 EDIT PIN LOCATIONS'}
      </button>

      {/* Pin editor panel — only visible in edit mode */}
      {editMode && (
        <PinEditorPanel
          buildings={buildings}
          selectedId={editSelectedId}
          onSelectId={setEditSelectedId}
          onUpdate={handlePositionUpdate}
          onClose={() => setEditMode(false)}
        />
      )}

      {/* NFT marketplace panel */}
      <MarketplacePanel />

      {/* HUD overlays */}
      <HUD />

      {/* Toast notifications */}
      <ToastContainer />

      {/* Activity Feed slide-in panel */}
      <ActivityFeed open={activityOpen} onClose={() => setActivityOpen(false)} />
    </div>
  );
}