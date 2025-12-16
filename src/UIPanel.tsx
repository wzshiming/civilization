import { Province } from './types';

interface UIPanelProps {
  selectedProvince: Province | null;
  totalPopulation: number;
  totalFood: number;
  totalFlint: number;
}

export default function UIPanel({
  selectedProvince,
  totalPopulation,
  totalFood,
  totalFlint,
}: UIPanelProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '300px',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
        overflowY: 'auto',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
        Stone Age Tribe
      </h1>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#555' }}>
          Total Resources
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <ResourceItem label="Population" value={totalPopulation} icon="👥" />
          <ResourceItem label="Food" value={totalFood} icon="🌾" />
          <ResourceItem label="Flint" value={totalFlint} icon="⛏️" />
        </div>
      </div>

      {selectedProvince && (
        <div style={{ marginBottom: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#555' }}>
            Selected Province
          </h2>
          <div style={{ marginBottom: '10px' }}>
            <strong>{selectedProvince.name}</strong>
            <div style={{ fontSize: '12px', color: '#777' }}>
              ID: {selectedProvince.id}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ResourceItem label="Status" value={selectedProvince.owner ? 'Controlled' : 'Uncontrolled'} />
            {selectedProvince.owner && (
              <>
                <ResourceItem label="Population" value={selectedProvince.population} icon="👥" />
                <ResourceItem label="Food" value={selectedProvince.food} icon="🌾" />
                <ResourceItem label="Flint" value={selectedProvince.flint} icon="⛏️" />
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#555' }}>
          Instructions
        </h2>
        <ul style={{ fontSize: '14px', lineHeight: '1.6', color: '#666', paddingLeft: '20px' }}>
          <li>Hover over provinces to highlight them</li>
          <li>Click on a province to select it</li>
          <li>Click on an adjacent empty province to explore (costs 10 food, 1 population)</li>
          <li>Controlled provinces generate 2 food every 5 seconds</li>
        </ul>
      </div>
    </div>
  );
}

function ResourceItem({ label, value, icon }: { label: string; value: number | string; icon?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
      }}
    >
      <span style={{ color: '#666' }}>
        {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
        {label}
      </span>
      <strong style={{ color: '#333' }}>{value}</strong>
    </div>
  );
}
