import React from 'react';
import styles from '../Sidebar.module.css';

interface SelectionPanelProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

const SelectionPanel: React.FC<SelectionPanelProps> = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
}) => {
  return (
    <div className={styles.panel}>
      <h2>SELECTION</h2>
      <div className={styles.stat}>
        <span>Selected:</span>
        <span>{selectedCount}</span>
      </div>
      <button onClick={onSelectAll} className={styles.button}>
        Select All
      </button>
      <button onClick={onClearSelection} className={styles.button}>
        Clear Selection
      </button>
    </div>
  );
};

export default SelectionPanel;
