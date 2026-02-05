// Slide data configuration for Wrapped feature
// Mock data and slide metadata

export const RELATIONSHIP_START_DATE = new Date('2025-11-19T00:00:00');

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
  topMonth: 'December',
  longestStreak: 5,
  genres: [
    'choc waffle',
    'Most Random Couple',
    'Late night Emart',
    'Kene pressure tunang',
    'strawberry and melon',
    'non-celen',
    'minecrafter',
    'acah2 software engineer',
    'ayammm',
  ],
  mostQuoted: "Idk, what do you want to eat?",
  persona: {
    title: 'Chaos & Cuddles Inc.',
    traits: [
      { name: 'Ragebaiting', value: 200 },
      { name: 'Cari Pintu', value: 70 },
      { name: 'Cuddliness', value: 99 },
      { name: "I love U's given", value: 180 },
    ],
  },
};



