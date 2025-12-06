import React from 'react';
import './ProfileTabs.css';

export interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: string[];
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  tabs = ['info', 'Games', 'comments'],
}) => {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab}
          className={activeTab === tab ? 'active' : ''}
          onClick={() => onTabChange(tab)}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
};

