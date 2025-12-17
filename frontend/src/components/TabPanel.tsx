/**
 * TabPanel - A collapsible sidebar panel with multiple tabs
 * Tabs appear on the left side of the screen, expanding to 1/3 width when clicked
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import './TabPanel.css';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  content: ReactNode;
}

interface TabPanelProps {
  tabs: Tab[];
}

export function TabPanel({ tabs }: TabPanelProps) {
  const [expandedTabId, setExpandedTabId] = useState<string | null>(null);
  const [focusedTabIndex, setFocusedTabIndex] = useState<number>(0);

  const handleTabClick = (tabId: string) => {
    // Toggle: if already expanded, collapse it; otherwise expand the clicked tab
    setExpandedTabId(prevId => prevId === tabId ? null : tabId);
  };

  const handleKeyDown = (event: React.KeyboardEvent, tabId: string, index: number) => {
    let newIndex = index;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTabClick(tabId);
        return;
      default:
        return;
    }
    
    setFocusedTabIndex(newIndex);
    // Focus the new tab button
    const newTabButton = document.getElementById(`tab-${tabs[newIndex].id}`);
    newTabButton?.focus();
  };

  const expandedTab = tabs.find(tab => tab.id === expandedTabId);

  return (
    <div className="tab-panel-container">
      {/* Tab buttons - always visible on the left */}
      <div className="tab-buttons" role="tablist" aria-label="Sidebar tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={`tab-button ${expandedTabId === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
            title={tab.label}
            role="tab"
            aria-selected={expandedTabId === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={index === focusedTabIndex ? 0 : -1}
          >
            {tab.icon && <span className="tab-icon" aria-hidden="true">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Expanded content - shows when a tab is selected */}
      {expandedTab && (
        <div 
          className="tab-content-panel"
          role="tabpanel"
          id={`tabpanel-${expandedTab.id}`}
          aria-labelledby={`tab-${expandedTab.id}`}
        >
          <div className="tab-content-header">
            <h2>{expandedTab.label}</h2>
            <button
              className="tab-close-button"
              onClick={() => setExpandedTabId(null)}
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
          <div className="tab-content-body">
            {expandedTab.content}
          </div>
        </div>
      )}
    </div>
  );
}
