export type PortraitOption = {
  id: string;
  name: string;
  gender: 'male' | 'female'
  src: string;
};

export const PORTRAITS: PortraitOption[] = [
  { id: 'portrait-01', name: 'Defensive Baseliner', gender: 'male',src: '/portraits/portrait-01.png' },
  { id: 'portrait-02', name: 'Counterpuncher', gender: 'male', src: '/portraits/portrait-02.png' },
  { id: 'portrait-03', name: 'Power Server', gender: 'male', src: '/portraits/portrait-03.png' },
  { id: 'portrait-04', name: 'Aggressive Shotmaker', gender: 'female', src: '/portraits/portrait-04.png' },
  { id: 'portrait-05', name: 'Net Specialist', gender: 'female', src: '/portraits/portrait-05.png' },
  { id: 'portrait-06', name: 'All-Court Ace', gender: 'female', src: '/portraits/portrait-06.png' },
];
