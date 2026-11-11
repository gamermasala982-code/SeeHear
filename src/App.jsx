import React, { useState, useEffect } from 'react';
import {
  Home,
  FolderOpen,
  BookOpen,
  Sparkles,
  MessageSquare,
  CalendarCheck,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import {
  SAMPLE_DOCUMENTS,
  INITIAL_STUDY_TASKS,
} from './data/mockData.js';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import HomeDashboard from './components/HomeDashboard.jsx';
import DocumentLibrary from './components/DocumentLibrary.jsx';
import DocumentReader from './components/DocumentReader.jsx';
import ExplanationPanel from './components/ExplanationPanel.jsx';
import CrossSourceQA from './components/CrossSourceQA.jsx';
import StudyPlanner from './components/StudyPlanner.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';

const DEFAULT_SETTINGS = {
  readerFontSize: '1.0625rem',
  readerMaxWidth: '68ch',
  readerLineHeight: '1.75',
  highContrast: false,
  reducedMotion: false,
};

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'documents', label: 'My Documents', icon: FolderOpen },
  { id: 'reader', label: 'Reader', icon: BookOpen },
  { id: 'understand', label: 'Understand', icon: Sparkles },
  { id: 'ask', label: 'Ask Across Sources', icon: MessageSquare },
  { id: 'planner', label: 'Study Planner', icon: CalendarCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [documents, setDocuments] = useState(SAMPLE_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState(SAMPLE_DOCUMENTS[0].id);
  const [activeSectionId, setActiveSectionId] = useState(
    SAMPLE_DOCUMENTS[0].sections[0].id
  );
  const [recentDocIds, setRecentDocIds] = useState([
    SAMPLE_DOCUMENTS[0].id,
    SAMPLE_DOCUMENTS[1].id,
  ]);

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('seehear_language') || 'en';
  });

  const [explanationStyle, setExplanationStyle] = useState('simple');

  const [studyTasks, setStudyTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('seehear_tasks');
      return saved ? JSON.parse(saved) : INITIAL_STUDY_TASKS;
    } catch {
      return INITIAL_STUDY_TASKS;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('seehear_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 3-Second Welcome Screen Timer with cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Apply CSS custom properties & accessibility attributes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--reader-font-size', settings.readerFontSize);
    root.style.setProperty('--reader-max-width', settings.readerMaxWidth);
    root.style.setProperty('--reader-line-height', settings.readerLineHeight);
    root.setAttribute('data-high-contrast', String(Boolean(settings.highContrast)));
    root.setAttribute('data-reduced-motion', String(Boolean(settings.reducedMotion)));
    try {
      localStorage.setItem('seehear_settings', JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('seehear_language', language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem('seehear_tasks', JSON.stringify(studyTasks));
    } catch {
      // Ignore storage errors
    }
  }, [studyTasks]);

  const handleNavigate = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenDocument = (docId, targetSection = 'reader') => {
    setActiveDocId(docId);
    const targetDoc = documents.find((d) => d.id === docId);
    if (targetDoc?.sections?.[0]) {
      setActiveSectionId(targetDoc.sections[0].id);
    }
    setRecentDocIds((prev) => [docId, ...prev.filter((id) => id !== docId)].slice(0, 4));
    handleNavigate(targetSection);
  };

  const handleJumpToUnderstand = (docId, secId) => {
    setActiveDocId(docId);
    setActiveSectionId(secId);
    handleNavigate('understand');
  };

  const handleAddLocalDocument = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    if (newDoc.sections?.[0]) {
      setActiveSectionId(newDoc.sections[0].id);
    }
    setRecentDocIds((prev) => [newDoc.id, ...prev.filter((id) => id !== newDoc.id)].slice(0, 4));
  };

  const handleUpdateSettings = (partial) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setLanguage('en');
  };

  // Study planner handlers
  const handleAddTask = (task) => setStudyTasks((prev) => [task, ...prev]);
  const handleToggleTask = (taskId) =>
    setStudyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  const handleUpdateTask = (taskId, updates) =>
    setStudyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  const handleDeleteTask = (taskId) =>
    setStudyTasks((prev) => prev.filter((t) => t.id !== taskId));

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  const renderNavItems = () => (
    <ul className="nav-list">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isCurrent = activeSection === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              className="nav-item-btn"
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => handleNavigate(item.id)}
            >
              <IconComponent size={17} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div>
      {/* Compact Mobile Topbar */}
      <header className="mobile-topbar">
        <button
          type="button"
          className="brand-wordmark"
          style={{ fontSize: '1.5rem' }}
          onClick={() => handleNavigate('home')}
        >
          SeeHear
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="mobile-drawer" aria-label="Mobile Navigation">
            <div>
              <div className="brand-header">
                <button
                  type="button"
                  className="brand-wordmark"
                  onClick={() => handleNavigate('home')}
                >
                  SeeHear
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X size={18} />
                </button>
              </div>
              <nav aria-label="Primary Mobile">{renderNavItems()}</nav>
            </div>
            <div className="sidebar-footer">
              Read Anything. Understand Everything. In Your Language.
            </div>
          </aside>
        </>
      )}

      <div className="app-shell">
        {/* Desktop Sidebar */}
        <aside className="sidebar" aria-label="Primary Sidebar">
          <div>
            <div className="brand-header">
              <button
                type="button"
                className="brand-wordmark"
                onClick={() => handleNavigate('home')}
                title="Return to SeeHear Home"
              >
                SeeHear
              </button>
              
            </div>
            <nav aria-label="Primary">{renderNavItems()}</nav>
          </div>

          <div className="sidebar-footer">
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Active Language: {language.toUpperCase()}
            </div>
            <div>Read Anything. Understand Everything. In Your Language.</div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="main-workspace">
          {activeSection === 'home' && (
            <HomeDashboard
              documents={documents}
              recentDocIds={recentDocIds}
              studyTasks={studyTasks}
              onOpenDocument={handleOpenDocument}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'documents' && (
            <DocumentLibrary
              documents={documents}
              onAddLocalDocument={handleAddLocalDocument}
              onOpenDocument={handleOpenDocument}
            />
          )}

          {activeSection === 'reader' && (
            <DocumentReader
              documents={documents}
              activeDocId={activeDocId}
              onSelectDocId={setActiveDocId}
              language={language}
              onChangeLanguage={setLanguage}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onNavigate={handleNavigate}
              onJumpToUnderstand={handleJumpToUnderstand}
            />
          )}

          {activeSection === 'understand' && (
            <ExplanationPanel
              documents={documents}
              activeDocId={activeDocId}
              onSelectDocId={setActiveDocId}
              activeSectionId={activeSectionId}
              onSelectSectionId={setActiveSectionId}
              explanationStyle={explanationStyle}
              onChangeStyle={setExplanationStyle}
              language={language}
              onChangeLanguage={setLanguage}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'ask' && (
            <CrossSourceQA
              documents={documents}
              onOpenDocument={handleOpenDocument}
              language={language}
              onChangeLanguage={setLanguage}
            />
          )}

          {activeSection === 'planner' && (
            <StudyPlanner
              tasks={studyTasks}
              documents={documents}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onOpenDocument={handleOpenDocument}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsPanel
              language={language}
              onChangeLanguage={setLanguage}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetDefaults={handleResetDefaults}
            />
          )}
        </main>
      </div>
    </div>
  );
}
