import { useState, useEffect } from 'react';

const TOPICS_WITH_TOURS = ['rate-limiting', 'load-balancing', 'caching', 'consistent-hashing'];

// Read initial topic from URL hash (e.g. #/topic/rate-limiting or #/)
function getTopicFromHash(): string {
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') return 'landing';
  const match = hash.match(/^#\/topic\/([a-z0-9-]+)/i);
  return match ? match[1] : 'landing';
}

export function useTopicNavigation() {
  const [activeTopicId, setActiveTopicId] = useState<string>(getTopicFromHash);

  const getTourSeenKey = (topicId: string) => `tour-seen:${topicId}`;

  const [showTour, setShowTour] = useState(false);

  // Sync state with browser back/forward buttons (popstate event)
  useEffect(() => {
    const handleHashChange = () => {
      const topicFromHash = getTopicFromHash();
      setActiveTopicId(topicFromHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update browser URL hash without full reload
    if (topicId === 'landing') {
      window.location.hash = '#/';
    } else {
      window.location.hash = `#/topic/${topicId}`;
    }

    if (TOPICS_WITH_TOURS.includes(topicId) && !localStorage.getItem(getTourSeenKey(topicId))) {
      setShowTour(true);
    } else {
      setShowTour(false);
    }
  };

  const handleCloseTour = () => {
    localStorage.setItem(getTourSeenKey(activeTopicId), 'true');
    setShowTour(false);
  };

  const handleRestartTour = () => {
    localStorage.removeItem(getTourSeenKey(activeTopicId));
    setShowTour(true);
  };

  return {
    activeTopicId,
    showTour,
    handleSelectTopic,
    handleCloseTour,
    handleRestartTour,
  };
}
