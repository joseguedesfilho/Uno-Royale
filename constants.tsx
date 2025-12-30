
import { ArenaTheme, CardType, CardColor, CardDefinition, TrophyReward } from './types';

export const ARENAS: ArenaTheme[] = [
  { name: 'Campo de Treino', bots: 1, minTrophies: 0, bgColor: 'bg-green-800', banner: 'https://picsum.photos/seed/arena1/800/400', bossPower: 'Começa com 4 cartas' },
  { name: 'Estádio Goblin', bots: 2, minTrophies: 0, bgColor: 'bg-emerald-900', banner: 'https://picsum.photos/seed/arena2/800/400', bossPower: 'Chance de Fúria extra' },
  { name: 'Fosso de Ossos', bots: 2, minTrophies: 0, bgColor: 'bg-stone-800', banner: 'https://picsum.photos/seed/arena3/800/400', bossPower: 'Não compra ao jogar Gelo' },
  { name: 'Parquinho da P.E.K.K.A', bots: 3, minTrophies: 0, bgColor: 'bg-purple-900', banner: 'https://picsum.photos/seed/arena4/800/400', bossPower: 'Sempre tem um +4 na manga' },
  { name: 'Vale de Feitiços', bots: 3, minTrophies: 0, bgColor: 'bg-indigo-900', banner: 'https://picsum.photos/seed/arena5/800/400', bossPower: 'IA joga cartas em dobro' },
  { name: 'Oficina do Construtor', bots: 4, minTrophies: 0, bgColor: 'bg-orange-900', banner: 'https://picsum.photos/seed/arena6/800/400', bossPower: 'Cartas de número valem dobro' },
  { name: 'Arena Real', bots: 4, minTrophies: 0, bgColor: 'bg-yellow-900', banner: 'https://picsum.photos/seed/arena7/800/400', bossPower: 'Inverte o turno aleatoriamente' },
  { name: 'Pico Congelado', bots: 4, minTrophies: 0, bgColor: 'bg-cyan-900', banner: 'https://picsum.photos/seed/arena8/800/400', bossPower: 'Sempre inicia com Gelo' },
  { name: 'Arena Lendária', bots: 5, minTrophies: 0, bgColor: 'bg-zinc-900', banner: 'https://picsum.photos/seed/arena9/800/400', bossPower: 'O Mestre Supremo de Uno' },
];

export const TROPHY_ROAD_REWARDS: TrophyReward[] = [
  { id: 'rew-1', trophiesRequired: 50, type: 'GOLD', value: 500, label: '500 Ouro' },
  { id: 'rew-2', trophiesRequired: 150, type: 'CHEST', value: 'Prata', label: 'Baú de Prata' },
  { id: 'rew-3', trophiesRequired: 300, type: 'GEMS', value: 50, label: '50 Gemas' },
  { id: 'rew-4', trophiesRequired: 400, type: 'BOSS', value: 1, label: 'Boss: Rei Goblin' },
  { id: 'rew-5', trophiesRequired: 600, type: 'GOLD', value: 1000, label: '1000 Ouro' },
  { id: 'rew-6', trophiesRequired: 800, type: 'BOSS', value: 2, label: 'Boss: Esqueleto Gigante' },
  { id: 'rew-7', trophiesRequired: 1000, type: 'CARD', value: 'spell-mirror', label: 'Carta: Espelho' },
];

export const ALL_CARDS: CardDefinition[] = [
  ...[0,1,2,3,4,5,6,7,8,9].map(n => ({
    id: `num-${n}`,
    type: CardType.NUMBER,
    baseColor: 'Blue' as CardColor,
    value: n,
    label: n === 0 ? 'Espírito de Gelo' : n === 7 ? 'Gigante Royale' : `Tropa ${n}`,
    rarity: n > 7 ? 'Rara' : 'Comum' as any,
    description: `Tropa básica de valor ${n}. Essencial para o deck.`,
    levelEffect: "+10% XP por vitória"
  })),
  { id: 'spell-freeze', type: CardType.SKIP, baseColor: 'Blue', label: 'Gelo', rarity: 'Épica', description: 'Congela o turno do próximo desafiante.', levelEffect: "+50 Ouro na Vitória" },
  { id: 'spell-log', type: CardType.REVERSE, baseColor: 'Red', label: 'O Tronco', rarity: 'Lendária', description: 'Inverte o fluxo da arena.', levelEffect: "+100 Ouro na Vitória" },
  { id: 'spell-rage', type: CardType.DRAW2, baseColor: 'Yellow', label: 'Fúria', rarity: 'Rara', description: 'Fúria Real: Próximo compra 2 cartas.', levelEffect: "+30 Ouro na Vitória" },
  { id: 'spell-skarmy', type: CardType.DRAW4, baseColor: 'Wild', label: 'Exército', rarity: 'Épica', description: 'Emboscada de Esqueletos: Próximo compra 4.', levelEffect: "+80 Ouro na Vitória" },
  { id: 'spell-mirror', type: CardType.WILD, baseColor: 'Wild', label: 'Espelho', rarity: 'Lendária', description: 'Reflete a cor que você desejar.', levelEffect: "+120 Ouro na Vitória" },
];

export const COLORS: CardColor[] = ['Red', 'Blue', 'Yellow', 'Green'];
export const INITIAL_GOLD = 1000;
export const INITIAL_GEMS = 100;
