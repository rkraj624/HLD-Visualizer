import React, { useState, useMemo } from 'react';
import {
  Search, X, PanelLeftClose, PanelLeft, Sparkles,
  Zap, GitBranch, ShieldAlert, Database, CircleDot, Layers,
  MessageSquare, Radio, Cloud, Lock, BookOpen, Activity, ChevronRight
} from 'lucide-react';
import { HLD_TOPICS, type HLDTopic } from '../utils/hldTopics';

interface SidebarProps {
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

// Icon mapping helper (20px crisp icons)
const TOPIC_ICONS: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5" />,
  GitBranch: <GitBranch className="w-5 h-5" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5" />,
  Database: <Database className="w-5 h-5" />,
  CircleDot: <CircleDot className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
  MessageSquare: <MessageSquare className="w-5 h-5" />,
  Radio: <Radio className="w-5 h-5" />,
  Cloud: <Cloud className="w-5 h-5" />,
  Lock: <Lock className="w-5 h-5" />,
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTopicId,
  onSelectTopic,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'interactive' | 'spec'>('all');

  // Filter topics based on search & category filter
  const filteredTopics = useMemo(() => {
    return HLD_TOPICS.filter((topic) => {
      const matchesSearch =
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFilter === 'interactive') return topic.status === 'interactive';
      if (selectedFilter === 'spec') return topic.status === 'hld-spec';
      return true;
    });
  }, [searchQuery, selectedFilter]);

  // Group filtered topics by category
  const groupedTopics = useMemo(() => {
    const groups: Record<string, HLDTopic[]> = {};
    filteredTopics.forEach((topic) => {
      if (!groups[topic.categoryName]) {
        groups[topic.categoryName] = [];
      }
      groups[topic.categoryName].push(topic);
    });
    return groups;
  }, [filteredTopics]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={onToggleOpen}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 sidebar-panel flex flex-col ${
          isOpen ? 'w-80 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-3.5 sidebar-header flex items-center justify-between min-h-[64px]">
          {isOpen ? (
            <>
              <div
                onClick={() => onSelectTopic('landing')}
                className="flex items-center gap-3 overflow-hidden cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 border border-white/20 glow-blue group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="truncate">
                  <h2 className="text-xs font-extrabold text-white tracking-tight font-heading truncate group-hover:text-cyan-300 transition-colors">
                    System Craft HLD Hub
                  </h2>
                  <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 animate-pulse" /> Home / Prep Hub
                  </p>
                </div>
              </div>

              <button
                onClick={onToggleOpen}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-gray-400 hover:text-white transition-colors border border-slate-700 flex items-center justify-center flex-shrink-0"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-cyan-400" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggleOpen}
              className="collapsed-rail-item text-cyan-400 border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 glow-cyan"
              title="Expand Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
              <div className="collapsed-rail-tooltip flex flex-col gap-0.5">
                <span className="text-xs font-extrabold text-cyan-300 font-heading">Expand Sidebar</span>
                <span className="text-[10px] text-gray-400 font-mono">View full HLD topics list</span>
              </div>
            </button>
          )}
        </div>

        {/* Expanded Mode Controls: Search & Category Filter */}
        {isOpen && (
          <div className="p-3.5 space-y-3.5 border-b border-white/10 bg-black/40">
            {/* Search Input Box */}
            <div className="sidebar-search-box">
              <Search className="sidebar-search-icon" />
              <input
                type="text"
                placeholder="Search HLD topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sidebar-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="sidebar-search-clear-btn"
                  title="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills Below Search with Generous Top Spacing */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none mt-3 pt-2 pb-0.5">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`sidebar-filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              >
                All ({HLD_TOPICS.length})
              </button>
              <button
                onClick={() => setSelectedFilter('interactive')}
                className={`sidebar-filter-btn ${selectedFilter === 'interactive' ? 'active' : ''}`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Simulators
              </button>
              <button
                onClick={() => setSelectedFilter('spec')}
                className={`sidebar-filter-btn ${selectedFilter === 'spec' ? 'active' : ''}`}
              >
                Specs
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Topics List */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 ${isOpen ? 'custom-scrollbar' : 'sidebar-contracted-scroll'}`}>
          {isOpen ? (
            // Expanded Mode: Category Grouped List
            Object.keys(groupedTopics).length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500 font-mono">
                No HLD topics found matching "{searchQuery}"
              </div>
            ) : (
              Object.entries(groupedTopics).map(([groupName, topics]) => (
                <div key={groupName} className="space-y-1.5">
                  <div className="sidebar-category-header">
                    <span>{groupName}</span>
                    <span className="text-gray-500 font-normal">({topics.length})</span>
                  </div>

                  <div className="space-y-1">
                    {topics.map((topic) => {
                      const isActive = topic.id === activeTopicId;
                      const icon = TOPIC_ICONS[topic.iconName] || <Zap className="w-4 h-4" />;

                      return (
                        <button
                          key={topic.id}
                          onClick={() => onSelectTopic(topic.id)}
                          className={`sidebar-topic-item ${isActive ? 'active' : ''}`}
                          style={{
                            ['--topic-accent' as any]: topic.accentColor,
                          }}
                        >
                          {/* Topic Icon Box */}
                          <div
                            className="sidebar-icon-box"
                            style={{
                              backgroundColor: `${topic.accentColor}18`,
                              borderColor: `${topic.accentColor}44`,
                              color: topic.accentColor,
                            }}
                          >
                            {icon}
                          </div>

                          {/* Title & Badge */}
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white font-heading truncate">
                              {topic.shortTitle || topic.title}
                            </span>

                            {topic.status === 'interactive' ? (
                              <span className="sidebar-topic-badge interactive flex-shrink-0">
                                ⚡ Live
                              </span>
                            ) : (
                              <span className="sidebar-topic-badge spec flex-shrink-0">
                                Spec
                              </span>
                            )}
                          </div>

                          <ChevronRight className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform ${isActive ? 'text-blue-400 translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )
          ) : (
            // Contracted Mode: Clean Icon Rail with Simple Topic Name Hover Label
            <div className="flex flex-col gap-2.5 items-center">
              {filteredTopics.map((topic) => {
                const isActive = topic.id === activeTopicId;
                const icon = TOPIC_ICONS[topic.iconName] || <Zap className="w-4 h-4" />;

                return (
                  <button
                    key={topic.id}
                    onClick={() => onSelectTopic(topic.id)}
                    className={`collapsed-rail-item ${isActive ? 'active' : ''}`}
                    title={topic.title}
                  >
                    <span style={{ color: isActive ? '#ffffff' : topic.accentColor }}>
                      {icon}
                    </span>

                    {/* Simple Topic Name Tooltip */}
                    <div className="collapsed-rail-tooltip">
                      {topic.shortTitle || topic.title}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-center text-[10px] text-gray-500 font-mono">
          {isOpen ? (
            <span>High-Level System Design Playground</span>
          ) : (
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mx-auto" title="HLD Suite Active" />
          )}
        </div>
      </aside>
    </>
  );
};
