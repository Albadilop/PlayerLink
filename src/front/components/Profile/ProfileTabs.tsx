import React from "react";
import "./ProfileTabs.css";

export interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: string[];
}

const tabIcons: Record<string, string> = {
  info: "fa-solid fa-user",
  Games: "fa-solid fa-gamepad",
  comments: "fa-solid fa-comments",
};

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  tabs = ["info", "Games", "comments"],
}) => {
  return (
    <div className="profile-tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`profile-tab ${activeTab === tab ? "active" : ""}`}
          onClick={() => onTabChange(tab)}
        >
          <i className={tabIcons[tab] || "fa-solid fa-circle"} />
          <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          {activeTab === tab && <span className="profile-tab-indicator" />}
        </button>
      ))}
    </div>
  );
};
