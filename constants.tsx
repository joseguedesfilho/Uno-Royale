
import { ArenaTheme, CardType, CardColor, CardDefinition, TrophyReward, ShopItem } from './types';

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
  { id: 'rew-1', trophiesRequired: 50, type: 'OURO', value: 500, label: '500 Ouro' },
  { id: 'rew-2', trophiesRequired: 150, type: 'BAU', value: 'Prata', label: 'Baú de Prata' },
  { id: 'rew-3', trophiesRequired: 300, type: 'GEMAS', value: 50, label: '50 Gemas' },
  { id: 'rew-4', trophiesRequired: 400, type: 'CHEFE', value: 1, label: 'Chefe: Rei Goblin' },
  { id: 'rew-5', trophiesRequired: 600, type: 'OURO', value: 1000, label: '1000 Ouro' },
  { id: 'rew-6', trophiesRequired: 800, type: 'CHEFE', value: 2, label: 'Chefe: Esqueleto Gigante' },
  { id: 'rew-7', trophiesRequired: 1000, type: 'CARTA', value: 'spell-mirror', label: 'Carta: Espelho' },
];

export const SHOP_ITEMS: ShopItem[] = [
  // Itens por Ouro (Acessíveis)
  { id: 'back-wood', category: 'Skins', type: 'VERSO_CARTA', label: 'Verso de Madeira', description: 'Design rústico para suas cartas.', cost: 500, currency: 'gold', icon: '🪵' },
  { id: 'back-metal', category: 'Skins', type: 'VERSO_CARTA', label: 'Verso de Metal', description: 'Resistência real em cada jogada.', cost: 1500, currency: 'gold', icon: '⛓️' },
  { id: 'frame-silver', category: 'Cosméticos', type: 'MOLDURA_AVATAR', label: 'Moldura de Prata', description: 'Destaque-se no lobby.', cost: 800, currency: 'gold', icon: '🖼️' },
  { id: 'title-king', category: 'Cosméticos', type: 'TITULO', label: 'Rei do Uno', description: 'Um título para os soberanos.', cost: 2000, currency: 'gold', icon: '📜' },
  { id: 'emoji-laugh', category: 'Cosméticos', type: 'EMOJI', label: 'Rei Rindo', description: 'Emoji clássico de provocação.', cost: 300, currency: 'gold', icon: '😂' },

  // Itens por Gemas (Premium)
  { id: 'effect-fire', category: 'Especiais', type: 'EFEITO_JOGADA', label: 'Efeito de Fogo', description: 'Animação explosiva ao jogar cartas especiais.', cost: 100, currency: 'gems', icon: '🔥' },
  { id: 'arena-jungle', category: 'Especiais', type: 'TEMA_ARENA', label: 'Arena da Selva', description: 'Mude o cenário da sua batalha.', cost: 250, currency: 'gems', icon: '🌴' },
  { id: 'chest-skin', category: 'Skins', type: 'BAU_SKIN', label: 'Baú de Skin', description: 'Dá uma skin aleatória para uma tropa.', cost: 150, currency: 'gems', icon: '🎁' },
  { id: 'avatar-pekka', category: 'Cosméticos', type: 'AVATAR_ANIMADO', label: 'P.E.K.K.A Animada', description: 'Avatar dinâmico para seu perfil.', cost: 200, currency: 'gems', icon: '🤖' },
  { id: 'gold-pack-mega', category: 'Moedas', type: 'PACOTE_OURO', label: '3000 Ouro', description: 'Pacote massivo de moedas.', cost: 120, currency: 'gems', icon: '💰' },
];

export const ALL_CARDS: CardDefinition[] = [
  ...[0,1,2,3,4,5,6,7,8,9].map(n => ({
    id: `num-${n}`,
    type: CardType.NUMBER,
    baseColor: 'Azul' as CardColor,
    value: n,
    label: n === 0 ? 'Espírito de Gelo' : n === 7 ? 'Gigante Royale' : `Tropa ${n}`,
    rarity: n > 7 ? 'Rara' : 'Comum' as any,
    description: `Tropa básica de valor ${n}. Essencial para o deck.`,
    levelEffect: "+10% XP por vitória"
  })),
  { id: 'spell-freeze', type: CardType.SKIP, baseColor: 'Azul', label: 'Gelo', rarity: 'Épica', description: 'Bloqueio Real: Congela o turno do próximo desafiante.', levelEffect: "+50 Ouro na Vitória" },
  { id: 'spell-log', type: CardType.REVERSE, baseColor: 'Vermelho', label: 'O Tronco', rarity: 'Lendária', description: 'Inversão Real: Inverte o fluxo da arena.', levelEffect: "+100 Ouro na Vitória" },
  { id: 'spell-rage', type: CardType.DRAW2, baseColor: 'Amarelo', label: 'Exerc. Esqueletos', rarity: 'Rara', description: 'Emboscada (+2): Próximo desafiante compra 2 cartas.', levelEffect: "+30 Ouro na Vitória" },
  { id: 'spell-skarmy', type: CardType.DRAW4, baseColor: 'Especial', label: 'Fúria', rarity: 'Épica', description: 'Fúria Real (+4): Escolha a cor e o próximo compra 4.', levelEffect: "+80 Ouro na Vitória" },
  { id: 'spell-mirror', type: CardType.WILD, baseColor: 'Especial', label: 'Espelho', rarity: 'Lendária', description: 'Reflexo Real: Muda a cor da arena para o que você desejar.', levelEffect: "+120 Ouro na Vitória" },
];

export const COLORS: CardColor[] = ['Vermelho', 'Azul', 'Amarelo', 'Verde'];
export const INITIAL_GOLD = 1000;
export const INITIAL_GEMS = 100;
