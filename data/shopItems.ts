import { ShopItem } from '../types';

export const SHOP_ITEMS: ShopItem[] = [
  // Amateur (gray)
  { id: 'amateur-serve-1', player: 'Amateur', shot: 'serve', stats: { power: 45, spin: 35, control: 100, shape: 40 }, price: 0, tier: 'amateur' },
  { id: 'amateur-serve-2', player: 'Amateur', shot: 'serve', stats: { power: 55, spin: 45, control: 45, shape: 40 }, price: 20, tier: 'amateur' },
  { id: 'amateur-forehand-1', player: 'Amateur', shot: 'forehand', stats: { power: 45, spin: 40, control: 35, shape: 35 }, price: 20, tier: 'amateur' },
  { id: 'amateur-forehand-2', player: 'Amateur', shot: 'forehand', stats: { power: 40, spin: 45, control: 20, shape: 40 }, price: 40, tier: 'amateur' },
  { id: 'amateur-backhand-1', player: 'Amateur', shot: 'backhand', stats: { power: 35, spin: 35, control: 20, shape: 35 }, price: 20, tier: 'amateur' },
  { id: 'amateur-backhand-2', player: 'Amateur', shot: 'backhand', stats: { power: 30, spin: 50, control: 40, shape: 40 }, price: 40, tier: 'amateur' },
  { id: 'amateur-volley-1', player: 'Amateur', shot: 'volley', stats: { control: 40, accuracy: 40 }, price: 20, tier: 'amateur' },
  { id: 'amateur-volley-2', player: 'Amateur', shot: 'volley', stats: { control: 48, accuracy: 45 }, price: 40, tier: 'amateur' },
  { id: 'amateur-athleticism-1', player: 'Amateur', shot: 'athleticism', stats: { speed: 40, stamina: 45 }, price: 20, tier: 'amateur' },
  { id: 'amateur-athleticism-2', player: 'Amateur', shot: 'athleticism', stats: { speed: 45, stamina: 50 }, price: 40, tier: 'amateur' },

  // Pro (green) 20-100 ranking tier
  { id: 'hurkacz-serve', player: 'Hurkacz', shot: 'serve', stats: { power: 80, spin: 55, control: 70, shape: 45 }, price: 180, tier: 'pro' },
  { id: 'berrettini-serve', player: 'Berrettini', shot: 'serve', stats: { power: 85, spin: 45, control: 65, shape: 45 }, price: 200, tier: 'pro' },
  { id: 'fritz-forehand', player: 'Fritz', shot: 'forehand', stats: { power: 78, spin: 60, control: 72, shape: 55 }, price: 220, tier: 'pro' },
  { id: 'de-minaur-forehand', player: 'De Minaur', shot: 'forehand', stats: { power: 72, spin: 65, control: 78, shape: 60 }, price: 220, tier: 'pro' },
  { id: 'dimitrov-backhand', player: 'Dimitrov', shot: 'backhand', stats: { power: 70, spin: 70, control: 80, shape: 55 }, price: 220, tier: 'pro' },
  { id: 'musetti-backhand', player: 'Musetti', shot: 'backhand', stats: { power: 68, spin: 75, control: 76, shape: 60 }, price: 220, tier: 'pro' },
  { id: 'kasatkina-volley', player: 'Kasatkina', shot: 'volley', stats: { control: 75, accuracy: 72 }, price: 200, tier: 'pro' },
  { id: 'badosa-volley', player: 'Badosa', shot: 'volley', stats: { control: 78, accuracy: 70 }, price: 200, tier: 'pro' },
  { id: 'svitolina-athleticism', player: 'Svitolina', shot: 'athleticism', stats: { speed: 70, stamina: 78 }, price: 200, tier: 'pro' },
  { id: 'tiafoe-athleticism', player: 'Tiafoe', shot: 'athleticism', stats: { speed: 72, stamina: 70 }, price: 200, tier: 'pro' },

  // Elite (blue) 1-20 ranking tier
  { id: 'djokovic-serve', player: 'Djokovic', shot: 'serve', stats: { power: 95, spin: 70, control: 90, shape: 50 }, price: 360, tier: 'elite' },
  { id: 'serena-serve', player: 'Serena', shot: 'serve', stats: { power: 100, spin: 60, control: 88, shape: 50 }, price: 380, tier: 'elite' },
  { id: 'nadal-forehand', player: 'Nadal', shot: 'forehand', stats: { power: 85, spin: 100, control: 82, shape: 80 }, price: 380, tier: 'elite' },
  { id: 'alcaraz-forehand', player: 'Alcaraz', shot: 'forehand', stats: { power: 90, spin: 92, control: 88, shape: 70 }, price: 380, tier: 'elite' },
  { id: 'sinner-backhand', player: 'Sinner', shot: 'backhand', stats: { power: 88, spin: 80, control: 90, shape: 65 }, price: 380, tier: 'elite' },
  { id: 'swiatek-backhand', player: 'Swiatek', shot: 'backhand', stats: { power: 82, spin: 85, control: 92, shape: 70 }, price: 380, tier: 'elite' },
  { id: 'federer-volley', player: 'Federer', shot: 'volley', stats: { control: 110, accuracy: 92 }, price: 360, tier: 'elite' },
  { id: 'barty-volley', player: 'Barty', shot: 'volley', stats: { control: 105, accuracy: 90 }, price: 350, tier: 'elite' },
  { id: 'murray-athleticism', player: 'Murray', shot: 'athleticism', stats: { speed: 85, stamina: 90 }, price: 360, tier: 'elite' },
  { id: 'sabalenka-athleticism', player: 'Sabalenka', shot: 'athleticism', stats: { speed: 88, stamina: 82 }, price: 360, tier: 'elite' },

  // Special (purple) 1-20 with perk
  { id: 'special-djokovic-serve', player: 'Djokovic', shot: 'serve', stats: { power: 102, spin: 75, control: 95, shape: 55 }, price: 520, tier: 'special', perk: 'Return vision: slightly slower serve timer for the opponent.' },
  { id: 'special-serena-serve', player: 'Serena', shot: 'serve', stats: { power: 110, spin: 65, control: 92, shape: 55 }, price: 520, tier: 'special', perk: 'Ace pressure: minor bonus to serve speed in clutch points.' },
  { id: 'special-nadal-forehand', player: 'Nadal', shot: 'forehand', stats: { power: 92, spin: 115, control: 88, shape: 90 }, price: 560, tier: 'special', perk: 'Heavy topspin: forces deeper opponent positioning.' },
  { id: 'special-alcaraz-forehand', player: 'Alcaraz', shot: 'forehand', stats: { power: 95, spin: 100, control: 92, shape: 85 }, price: 560, tier: 'special', perk: 'Change-up: occasional timing forgiveness boost.' },
  { id: 'special-medvedev-backhand', player: 'Medvedev', shot: 'backhand', stats: { power: 90, spin: 85, control: 98, shape: 75 }, price: 560, tier: 'special', perk: 'Depth control: tighter bounce variance.' },
  { id: 'special-swiatek-backhand', player: 'Swiatek', shot: 'backhand', stats: { power: 88, spin: 90, control: 98, shape: 80 }, price: 560, tier: 'special', perk: 'Counterpunch: slight speed boost on stretched hits.' },
  { id: 'special-federer-volley', player: 'Federer', shot: 'volley', stats: { control: 125, accuracy: 98 }, price: 520, tier: 'special', perk: 'Soft hands: reduces volley timing sensitivity.' },
  { id: 'special-henin-volley', player: 'Henin', shot: 'volley', stats: { control: 120, accuracy: 94 }, price: 520, tier: 'special', perk: 'Knife touch: drop volleys slow down more.' },
  { id: 'special-halep-athleticism', player: 'Halep', shot: 'athleticism', stats: { speed: 92, stamina: 96 }, price: 520, tier: 'special', perk: 'Endurance: stamina decay reduced slightly.' },
  { id: 'special-murray-athleticism', player: 'Murray', shot: 'athleticism', stats: { speed: 90, stamina: 98 }, price: 520, tier: 'special', perk: 'Grinding: speed loss per rally hit reduced.' },
];
