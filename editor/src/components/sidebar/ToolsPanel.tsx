import React from 'react';
import { Tool } from '../../App';
import styles from '../Sidebar.module.css';

interface ToolsPanelProps {
  currentTool: Tool;
  onSelectTool: (tool: Tool) => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  currentTool,
  onSelectTool,
}) => {
  return (
    <div className={styles.panel}>
      <h2>TOOLS</h2>
      <button
        onClick={() => onSelectTool(Tool.SELECT)}
        className={`${styles.button} ${
          currentTool === Tool.SELECT ? styles.active : ''
        }`}
      >
        🎯 Select Tool
      </button>
      <button
        onClick={() => onSelectTool(Tool.PAINT)}
        className={`${styles.button} ${
          currentTool === Tool.PAINT ? styles.active : ''
        }`}
      >
        🖌️ Paint Tool
      </button>
      <button
        onClick={() => onSelectTool(Tool.UNIT)}
        className={`${styles.button} ${
          currentTool === Tool.UNIT ? styles.active : ''
        }`}
      >
        🏠 Unit Tool
      </button>
      <button
        onClick={() => onSelectTool(Tool.CLUSTER)}
        className={`${styles.button} ${
          currentTool === Tool.CLUSTER ? styles.active : ''
        }`}
      >
        👥 Cluster Tool
      </button>
    </div>
  );
};

export default ToolsPanel;
