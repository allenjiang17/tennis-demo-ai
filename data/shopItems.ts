import { ShopItem } from '../types';

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'pro-serve',
    player: 'Pro',
    shot: 'serve',
    stats: { power: 62, spin: 40, control: 55, shape: 50 },
    price: 0,
  },
  {
    id: 'pro-forehand',
    player: 'Pro',
    shot: 'forehand',
    stats: { power: 60, spin: 35, control: 58, shape: 55 },
    price: 0,
  },
  {
    id: 'pro-backhand',
    player: 'Pro',
    shot: 'backhand',
    stats: { power: 56, spin: 35, control: 52, shape: 45 },
    price: 0,
  },
  {
    id: 'federer-forehand',
    player: 'Federer',
    shot: 'forehand',
    stats: { power: 300, spin: 300, control: 80, shape: 65 },
    price: 300,
  },
  {
    id: 'nadal-forehand',
    player: 'Nadal',
    shot: 'forehand',
    stats: { power: 30, spin: 100, control: 65, shape: 100 },
    price: 320,
  },
  {
    id: 'djokovic-backhand',
    player: 'Djokovic',
    shot: 'backhand',
    stats: { power: 72, spin: 60, control: 300, shape: 60 },
    price: 300,
  },
  {
    id: 'serena-serve',
    player: 'Serena',
    shot: 'serve',
    stats: { power: 88, spin: 50, control: 62, shape: 50 },
    price: 320,
  },
  {
    id: 'sampras-serve',
    player: 'Sampras',
    shot: 'serve',
    stats: { power: 92, spin: 45, control: 58, shape: 50 },
    price: 340,
  },
  {
    id: 'henin-backhand',
    player: 'Henin',
    shot: 'backhand',
    stats: { power: 70, spin: 55, control: 74, shape: 40 },
    price: 280,
  },
];
