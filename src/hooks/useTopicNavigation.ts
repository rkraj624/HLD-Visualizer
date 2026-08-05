import { useState } from 'react';

const TOPICS_WITH_TOURS = ['rate-limiting', 'load-balancing', 'caching', 'consistent-hashing'];

export function useTopicNavigation() {
  const [activeTopicId, setActiveTopicId] = useState<string>('rate-limiting');

  const getTourSeenKey = (topicId: string) => `tour-seen:${topicId}`;

  const [showTour, setShowTour] = useState(() => {
    return !localStorage.getItem(getTourSeenKey('rate-limiting'));
  });

  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (TOPICS_WITH_TOURS.includes(topicId) && !localStorage.getItem(getTourSeenKey(topicId))) {
      setShowTour(true);
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
