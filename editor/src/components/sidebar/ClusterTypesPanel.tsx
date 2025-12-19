import React from 'react';
import { GameMap, ClusterCategory } from '../../../../src/types';
import styles from '../Sidebar.module.css';

interface ClusterTypesPanelProps {
  map: GameMap;
  selectedClusterType: string | null;
  onSelectClusterType: (clusterType: string | null) => void;
}

const ClusterTypesPanel: React.FC<ClusterTypesPanelProps> = ({
  map,
  selectedClusterType,
  onSelectClusterType,
}) => {
  return (
    <div className={styles.panel}>
      <h2>CLUSTER TYPES</h2>
      <div className={styles.subsection}>
        <h3>Enlightened</h3>
        {map.clusterTypes.filter(c => c.category === ClusterCategory.ENLIGHTENED).map((clusterType) => (
          <button
            key={clusterType.clusterTypeID}
            onClick={() => onSelectClusterType(clusterType.clusterTypeID)}
            className={`${styles.button} ${styles.small} ${
              selectedClusterType === clusterType.clusterTypeID ? styles.active : ''
            }`}
          >
            {clusterType.name}
          </button>
        ))}
      </div>
      <div className={styles.subsection}>
        <h3>Animals</h3>
        {map.clusterTypes.filter(c => c.category === ClusterCategory.ANIMAL).map((clusterType) => (
          <button
            key={clusterType.clusterTypeID}
            onClick={() => onSelectClusterType(clusterType.clusterTypeID)}
            className={`${styles.button} ${styles.small} ${
              selectedClusterType === clusterType.clusterTypeID ? styles.active : ''
            }`}
          >
            {clusterType.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClusterTypesPanel;
