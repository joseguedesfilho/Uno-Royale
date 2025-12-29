
import { ArenaTheme, CardType, CardColor, Card } from './types';

export const ARENAS: ArenaTheme[] = [
  { name: 'Campo de Treino', bots: 1, minTrophies: 0, bgColor: 'bg-green-800', banner: 'https://picsum.photos/seed/arena1/800/400' },
  { name: 'Estádio Goblin', bots: 2, minTrophies: 0, bgColor: 'bg-emerald-900', banner: 'https://picsum.photos/seed/arena2/800/400' },
  { name: 'Fosso de Ossos', bots: 3, minTrophies: 300, bgColor: 'bg-stone-800', banner: 'https://picsum.photos/seed/arena3/800/400' },
  { name: 'Parquinho da P.E.K.K.A', bots: 4, minTrophies: 600, bgColor: 'bg-purple-900', banner: 'https://picsum.photos/seed/arena4/800/400' },
  { name: 'Vale de Feitiços', bots: 5, minTrophies: 1000, bgColor: 'bg-indigo-900', banner: 'https://picsum.photos/seed/arena5/800/400' },
  { name: 'Oficina do Construtor', bots: 6, minTrophies: 1300, bgColor: 'bg-amber-800', banner: 'https://picsum.photos/seed/arena6/800/400' },
  { name: 'Arena Real', bots: 7, minTrophies: 1600, bgColor: 'bg-yellow-800', banner: 'https://picsum.photos/seed/arena7/800/400' },
  { name: 'Pico Congelado', bots: 8, minTrophies: 2000, bgColor: 'bg-sky-800', banner: 'https://picsum.photos/seed/arena8/800/400' },
  { name: 'Arena da Selva', bots: 9, minTrophies: 2300, bgColor: 'bg-lime-900', banner: 'https://picsum.photos/seed/arena9/800/400' },
  { name: 'Arena Lendária', bots: 10, minTrophies: 3000, bgColor: 'bg-slate-900', banner: 'https://picsum.photos/seed/arena10/800/400' },
];

export const CARD_MAPPING = {
  [CardType.SKIP]: { label: 'Gelo', img: '❄️' },
  [CardType.REVERSE]: { label: 'O Tronco', img: '🪵' },
  [CardType.DRAW2]: { label: 'Fúria', img: '🧪' },
  [CardType.DRAW4]: { label: 'Exército de Esqueletos', img: '💀' },
  [CardType.WILD]: { label: 'Espelho', img: '🪞' },
};

export const COLORS: CardColor[] = ['Red', 'Blue', 'Yellow', 'Green'];

export const INITIAL_GOLD = 500;
export const INITIAL_GEMS = 50;
