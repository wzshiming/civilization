import React, { useRef } from 'react';
import styles from '../Sidebar.module.css';

interface FilePanelProps {
  onGenerateMap: () => void;
  onLoadMap: (file: File) => void;
  onSaveMap: () => void;
}

const FilePanel: React.FC<FilePanelProps> = ({
  onGenerateMap,
  onLoadMap,
  onSaveMap,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadMap(file);
    }
  };

  return (
    <div className={styles.panel}>
      <h2>FILE</h2>
      <button onClick={onGenerateMap} className={styles.button}>
        🎲 Generate New Map
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className={styles.button}
      >
        📂 Load Map
      </button>
      <button onClick={onSaveMap} className={styles.button}>
        💾 Save Map
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />
    </div>
  );
};

export default FilePanel;
