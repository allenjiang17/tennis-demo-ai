import React, { useMemo, useState } from 'react';
import Game from './Game';
import Shop from './components/Shop';
import { Loadout, PlayerStats, ShopItem } from './types';
import { SHOP_ITEMS } from './data/shopItems';

const DEFAULT_LOADOUT: Loadout = {
  serveFirst: 'pro-serve',
  serveSecond: 'pro-serve',
  forehand: 'pro-forehand',
  backhand: 'pro-backhand',
};

const buildPlayerStats = (items: ShopItem[], loadout: Loadout): PlayerStats => {
  const byId = new Map(items.map(item => [item.id, item.stats]));
  const serveFirst = byId.get(loadout.serveFirst);
  const serveSecond = byId.get(loadout.serveSecond);
  const forehand = byId.get(loadout.forehand);
  const backhand = byId.get(loadout.backhand);
  if (!serveFirst || !serveSecond || !forehand || !backhand) {
    return {
      serveFirst: { power: 50, spin: 50, control: 50, shape: 50 },
      serveSecond: { power: 50, spin: 50, control: 50, shape: 50 },
      forehand: { power: 50, spin: 50, control: 50, shape: 50 },
      backhand: { power: 50, spin: 50, control: 50, shape: 50 },
    };
  }
  return { serveFirst, serveSecond, forehand, backhand };
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<'shop' | 'game'>('shop');
  const [wallet, setWallet] = useState(1000);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(
    new Set(['pro-serve', 'pro-forehand', 'pro-backhand'])
  );
  const [loadout, setLoadout] = useState<Loadout>(DEFAULT_LOADOUT);

  const playerStats = useMemo(
    () => buildPlayerStats(SHOP_ITEMS, loadout),
    [loadout]
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
    return <Game playerStats={playerStats} onExit={() => setScreen('shop')} />;
  }

  return (
    <Shop
      items={SHOP_ITEMS}
      wallet={wallet}
      ownedIds={ownedIds}
      loadout={loadout}
      onBuy={handleBuy}
      onEquip={handleEquip}
      onStart={() => setScreen('game')}
    />
  );
};

export default App;
