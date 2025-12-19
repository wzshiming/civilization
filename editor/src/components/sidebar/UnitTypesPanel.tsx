import React from 'react';
import { GameMap, UnitCategory } from '../../../../src/types';
import styles from '../Sidebar.module.css';

interface UnitTypesPanelProps {
  map: GameMap;
  selectedUnitType: string | null;
  onSelectUnitType: (unitType: string | null) => void;
}

const UnitTypesPanel: React.FC<UnitTypesPanelProps> = ({
  map,
  selectedUnitType,
  onSelectUnitType,
}) => {
  return (
    <div className={styles.panel}>
      <h2>UNIT TYPES</h2>
      <div className={styles.subsection}>
        <h3>Building Units</h3>
        {map.unitTypes.filter(u => u.category === UnitCategory.BUILDING).map((unitType) => (
          <button
            key={unitType.unitTypeID}
            onClick={() => onSelectUnitType(unitType.unitTypeID)}
            className={`${styles.button} ${styles.small} ${
              selectedUnitType === unitType.unitTypeID ? styles.active : ''
            }`}
          >
            {unitType.name}
          </button>
        ))}
      </div>
      <div className={styles.subsection}>
        <h3>Movable Units</h3>
        {map.unitTypes.filter(u => u.category === UnitCategory.MOVABLE).map((unitType) => (
          <button
            key={unitType.unitTypeID}
            onClick={() => onSelectUnitType(unitType.unitTypeID)}
            className={`${styles.button} ${styles.small} ${
              selectedUnitType === unitType.unitTypeID ? styles.active : ''
            }`}
          >
            {unitType.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UnitTypesPanel;
