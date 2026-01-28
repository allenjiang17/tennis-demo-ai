import React, { useMemo, useState } from 'react';
import Game from './Game';
import Shop from './components/Shop';
import OpponentSelect from './components/OpponentSelect';
import { AiProfile, Loadout, PlayerStats, ShopItem } from './types';
import { SHOP_ITEMS } from './data/shopItems';
import { AI_PROFILES } from './data/aiProfiles';

const DEFAULT_LOADOUT: Loadout = {
  serveFirst: 'pro-serve',
  serveSecond: 'pro-serve',
  forehand: 'pro-forehand',
  backhand: 'pro-backhand',
  forehandVolley: 'pro-fh-volley',
  backhandVolley: 'pro-bh-volley',
  athleticism: 'pro-athleticism',
};

const buildPlayerStats = (items: ShopItem[], loadout: Loadout): PlayerStats => {
  const byId = new Map(items.map(item => [item.id, item.stats]));
  const serveFirst = byId.get(loadout.serveFirst);
  const serveSecond = byId.get(loadout.serveSecond);
  const forehand = byId.get(loadout.forehand);
  const backhand = byId.get(loadout.backhand);
  const forehandVolley = byId.get(loadout.forehandVolley);
  const backhandVolley = byId.get(loadout.backhandVolley);
  const athleticism = byId.get(loadout.athleticism);
  if (!serveFirst || !serveSecond || !forehand || !backhand || !forehandVolley || !backhandVolley || !athleticism) {
    return {
      serveFirst: { power: 50, spin: 50, control: 50, shape: 50 },
      serveSecond: { power: 50, spin: 50, control: 50, shape: 50 },
      forehand: { power: 50, spin: 50, control: 50, shape: 50 },
      backhand: { power: 50, spin: 50, control: 50, shape: 50 },
      forehandVolley: { control: 50, accuracy: 50 },
      backhandVolley: { control: 50, accuracy: 50 },
      athleticism: { speed: 50, stamina: 50 },
    };
  }
  return {
    serveFirst: serveFirst as PlayerStats['serveFirst'],
    serveSecond: serveSecond as PlayerStats['serveSecond'],
    forehand: forehand as PlayerStats['forehand'],
    backhand: backhand as PlayerStats['backhand'],
    forehandVolley: forehandVolley as PlayerStats['forehandVolley'],
    backhandVolley: backhandVolley as PlayerStats['backhandVolley'],
    athleticism: athleticism as PlayerStats['athleticism'],
  };
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<'shop' | 'opponent' | 'game'>('shop');
  const [wallet, setWallet] = useState(5000);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(
    new Set(['pro-serve', 'pro-forehand', 'pro-backhand', 'pro-fh-volley', 'pro-bh-volley', 'pro-athleticism'])
  );
  const [loadout, setLoadout] = useState<Loadout>(DEFAULT_LOADOUT);
  const [selectedAi, setSelectedAi] = useState<AiProfile>(AI_PROFILES[0]);

  const playerStats = useMemo(
    () => buildPlayerStats(SHOP_ITEMS, loadout),
    [loadout]
  );
  const aiStats = useMemo(
    () => buildPlayerStats(SHOP_ITEMS, selectedAi.loadout),
    [selectedAi]
  );

  const handleBuy = (item: ShopItem) => {
    if (ownedIds.has(item.id)) return;
    if (item.price > wallet) return;
    setWallet(prev => prev - item.price);
    setOwnedIds(prev => new Set([...Array.from(prev), item.id]));
  };

  const handleEquip = (item: ShopItem, slot: keyof Loadout) => {
    if (!ownedIds.has(item.id)) return;
    setLoadout(prev => ({ ...prev, [slot]: item.id }));
  };

  if (screen === 'game') {
    return (
      <Game
        playerStats={playerStats}
        aiStats={aiStats}
        aiProfile={selectedAi}
        onExit={() => setScreen('shop')}
      />
    );
  }

  if (screen === 'opponent') {
    return (
      <OpponentSelect
        profiles={AI_PROFILES}
        selectedId={selectedAi.id}
        onSelect={profile => {
          setSelectedAi(profile);
          setScreen('game');
        }}
        onBack={() => setScreen('shop')}
      />
    );
  }

  return (
    <Shop
      items={SHOP_ITEMS}
      wallet={wallet}
      ownedIds={ownedIds}
      loadout={loadout}
      onBuy={handleBuy}
      onEquip={handleEquip}
      onStart={() => setScreen('opponent')}
    />
  );
};

export default App;
