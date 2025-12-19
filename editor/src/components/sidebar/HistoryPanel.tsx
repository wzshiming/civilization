import React from 'react';
import { EditHistory } from '../../App';
import styles from '../Sidebar.module.css';

interface HistoryPanelProps {
  editHistory: EditHistory;
  onUndo: () => void;
  onRedo: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  editHistory,
  onUndo,
  onRedo,
}) => {
  return (
    <div className={styles.panel}>
      <h2>HISTORY</h2>
      <div className={styles.historyButtons}>
        <button
          onClick={onUndo}
          disabled={editHistory.undoStack.length === 0}
          className={styles.button}
        >
          ↶ Undo
        </button>
        <button
          onClick={onRedo}
          disabled={editHistory.redoStack.length === 0}
          className={styles.button}
        >
          ↷ Redo
        </button>
      </div>
      <div className={styles.stat}>
        <span>Edits:</span>
        <span>{editHistory.undoStack.length}</span>
      </div>
    </div>
  );
};

export default HistoryPanel;
