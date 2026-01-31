export type PortraitOption = {
  id: string;
  name: string;
  gender: 'male' | 'female'
  src: string;
};

const BASE = import.meta.env.BASE_URL;

export const PORTRAITS: PortraitOption[] = [
  { id: 'portrait-01', name: 'Defensive Baseliner', gender: 'male', src: `${BASE}portraits/portrait-01.png` },
  { id: 'portrait-02', name: 'Counterpuncher', gender: 'male', src: `${BASE}portraits/portrait-02.png` },
  { id: 'portrait-03', name: 'Power Server', gender: 'male', src: `${BASE}portraits/portrait-03.png` },
  { id: 'portrait-04', name: 'Aggressive Shotmaker', gender: 'female', src: `${BASE}portraits/portrait-04.png` },
  { id: 'portrait-05', name: 'Net Specialist', gender: 'female', src: `${BASE}portraits/portrait-05.png` },
  { id: 'portrait-06', name: 'All-Court Ace', gender: 'female', src: `${BASE}portraits/portrait-06.png` },
];
