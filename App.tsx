import React, { useMemo, useState } from 'react';
import Game from './Game';
import Shop from './components/Shop';
import OpponentSelect from './components/OpponentSelect';
import { AiProfile, Loadout, PlayerStats, ShopItem } from './types';
import { SHOP_ITEMS } from './data/shopItems';
import { AI_PROFILES } from './data/aiProfiles';

const DEFAULT_LOADOUT: Loadout = {
  serveFirst: 'amateur-serve-1',
  serveSecond: 'amateur-serve-1',
  forehand: 'amateur-forehand-1',
  backhand: 'amateur-backhand-1',
  volley: 'amateur-volley-1',
  athleticism: 'amateur-athleticism-1',
};

const buildPlayerStats = (items: ShopItem[], loadout: Loadout): PlayerStats => {
  const byId = new Map(items.map(item => [item.id, item.stats]));
  const serveFirst = byId.get(loadout.serveFirst);
  const serveSecond = byId.get(loadout.serveSecond);
  const forehand = byId.get(loadout.forehand);
  const backhand = byId.get(loadout.backhand);
  const volley = byId.get(loadout.volley);
  const athleticism = byId.get(loadout.athleticism);
  if (!serveFirst || !serveSecond || !forehand || !backhand || !volley || !athleticism) {
    return {
      serveFirst: { power: 50, spin: 50, control: 50, shape: 50 },
      serveSecond: { power: 50, spin: 50, control: 50, shape: 50 },
      forehand: { power: 50, spin: 50, control: 50, shape: 50 },
      backhand: { power: 50, spin: 50, control: 50, shape: 50 },
      volley: { control: 50, accuracy: 50 },
      athleticism: { speed: 50, stamina: 50 },
    };
  }
  return {
    serveFirst: serveFirst as PlayerStats['serveFirst'],
    serveSecond: serveSecond as PlayerStats['serveSecond'],
    forehand: forehand as PlayerStats['forehand'],
    backhand: backhand as PlayerStats['backhand'],
    volley: volley as PlayerStats['volley'],
    athleticism: athleticism as PlayerStats['athleticism'],
  };
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<'shop' | 'opponent' | 'game'>('shop');
  const [wallet, setWallet] = useState(5000);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(
    new Set(['amateur-serve-1', 'amateur-forehand-1', 'amateur-backhand-1', 'amateur-volley-1', 'amateur-athleticism-1'])
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
