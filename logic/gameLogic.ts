
import { Card, CardType, CardColor, Player } from '../types';
import { COLORS } from '../constants';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const colors: CardColor[] = ['Red', 'Blue', 'Yellow', 'Green'];
  
  colors.forEach(color => {
    // Números 0-9
    for (let i = 0; i <= 9; i++) {
      deck.push({ id: `${color}-${i}-${Math.random()}`, type: CardType.NUMBER, color, value: i, label: `Tropa ${i}`, imageUrl: '' });
      if (i !== 0) deck.push({ id: `${color}-${i}-2-${Math.random()}`, type: CardType.NUMBER, color, value: i, label: `Tropa ${i}`, imageUrl: '' });
    }
    // Cartas de Ação
    for (let i = 0; i < 2; i++) {
      deck.push({ id: `${color}-skip-${i}-${Math.random()}`, type: CardType.SKIP, color, label: 'Gelo', imageUrl: '' });
      deck.push({ id: `${color}-reverse-${i}-${Math.random()}`, type: CardType.REVERSE, color, label: 'O Tronco', imageUrl: '' });
      deck.push({ id: `${color}-draw2-${i}-${Math.random()}`, type: CardType.DRAW2, color, label: 'Fúria +2', imageUrl: '' });
    }
  });

  // Cartas Coringa (Especiais)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `wild-${i}-${Math.random()}`, type: CardType.WILD, color: 'Wild', label: 'Espelho', imageUrl: '' });
    deck.push({ id: `draw4-${i}-${Math.random()}`, type: CardType.DRAW4, color: 'Wild', label: 'Esq. Army +4', imageUrl: '' });
  }

  return deck.sort(() => Math.random() - 0.5);
};

export const isCardPlayable = (card: Card, topCard: Card, currentColor: CardColor): boolean => {
  if (card.color === 'Wild' || card.color === currentColor) return true;
  if (card.type === topCard.type && card.type !== CardType.NUMBER) return true;
  if (card.type === CardType.NUMBER && topCard.type === CardType.NUMBER && card.value === topCard.value) return true;
  return false;
};

export const getBotMove = (hand: Card[], topCard: Card, currentColor: CardColor): Card | null => {
  const playable = hand.filter(c => isCardPlayable(c, topCard, currentColor));
  if (playable.length === 0) return null;
  return playable.sort((a, b) => (a.type === CardType.NUMBER ? -1 : 1))[0];
};

export const getRandomColor = (): CardColor => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};
