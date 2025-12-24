// Slide data configuration for Wrapped feature
// Mock data and slide metadata

export const RELATIONSHIP_START_DATE = new Date('2020-01-01');

export interface SlideConfig {
  id: string;
  duration: number; // in milliseconds
}

export const SLIDE_CONFIGS: SlideConfig[] = [
  { id: 'intro', duration: 7000 },
  { id: 'turning-point', duration: 7000 },
  { id: 'where-it-started', duration: 8000 },
  { id: 'its-official', duration: 7000 },
  { id: 'day-counter', duration: 7000 },
  { id: 'time-stats', duration: 8000 },
  { id: 'top-month', duration: 7000 },
  { id: 'vibe-genres', duration: 8000 },
  { id: 'top-songs', duration: 7000 },
  { id: 'persona-card', duration: 8000 },
  { id: 'next-year-promise', duration: 8000 },
];

export const TOTAL_SLIDES = SLIDE_CONFIGS.length;

// Mock data for slides
export const MOCK_DATA = {
  topMonth: 'February',
  longestStreak: 14,
  genres: [
    'Late Night Drives',
    'Ordering Takeout',
    'Nap Time',
    'Binge Watching',
    'Deep Conversations',
  ],
  mostQuoted: "Idk, what do you want to eat?",
  persona: {
    title: 'The Cozy Explorers',
    traits: [
      { name: 'Cuddliness', value: 80 },
      { name: 'Patience', value: 30 },
      { name: 'Chaos', value: 200 },
      { name: 'Hunger', value: 70 },
    ],
  },
};


