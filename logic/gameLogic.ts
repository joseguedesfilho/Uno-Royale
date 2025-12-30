
import { Card, CardType, CardColor } from '../types';
import { COLORS, ALL_CARDS } from '../constants';

export const createDeck = (playerDeckIds?: string[]): Card[] => {
  const deck: Card[] = [];
  const colors: CardColor[] = ['Vermelho', 'Azul', 'Amarelo', 'Verde'];
  
  colors.forEach(color => {
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(num => {
      const copies = num === 0 ? 1 : 2;
      const cardDef = ALL_CARDS.find(c => c.type === CardType.NUMBER && c.value === num) || ALL_CARDS[0];
      
      for(let i = 0; i < copies; i++) {
        deck.push({
          ...cardDef,
          instanceId: `card-${color}-${num}-${i}-${Math.random()}`,
          color: color,
        });
      }
    });

    const actions = [CardType.SKIP, CardType.REVERSE, CardType.DRAW2];
    actions.forEach(type => {
      const cardDef = ALL_CARDS.find(c => c.type === type) || ALL_CARDS[10];
      for(let i = 0; i < 2; i++) {
        deck.push({
          ...cardDef,
          instanceId: `action-${color}-${type}-${i}-${Math.random()}`,
          color: color,
        });
      }
    });
  });

  const wilds = [CardType.WILD, CardType.DRAW4];
  wilds.forEach(type => {
    const cardDef = ALL_CARDS.find(c => c.type === type) || ALL_CARDS[14];
    for(let i = 0; i < 4; i++) {
      deck.push({
        ...cardDef,
        instanceId: `wild-${type}-${i}-${Math.random()}`,
        color: 'Especial',
      });
    }
  });

  return deck.sort(() => Math.random() - 0.5);
};

export const isCardPlayable = (card: Card, topCard: Card, currentColor: CardColor): boolean => {
  if (card.color === 'Especial') return true;
  if (card.color === currentColor) return true;
  if (card.type === topCard.type && card.type !== CardType.NUMBER) return true;
  if (card.type === CardType.NUMBER && topCard.type === CardType.NUMBER && card.value === topCard.value) return true;
  return false;
};

export const isExactMatch = (card: Card, topCard: Card, currentColor: CardColor): boolean => {
  if (card.color === 'Especial') return false;
  const isSameValue = card.type === CardType.NUMBER 
    ? (topCard.type === CardType.NUMBER && card.value === topCard.value)
    : (card.type === topCard.type);
  const isSameColor = card.color === currentColor;
  return isSameValue && isSameColor;
};

export const isValidCombo = (selectedCards: Card[], topCard: Card, currentColor: CardColor, isMyTurn: boolean): boolean => {
  if (selectedCards.length === 0) return false;
  const firstCard = selectedCards[0];
  const canStart = isMyTurn 
    ? isCardPlayable(firstCard, topCard, currentColor)
    : isExactMatch(firstCard, topCard, currentColor);
  if (!canStart) return false;
  for (let i = 1; i < selectedCards.length; i++) {
    const card = selectedCards[i];
    if (firstCard.type === CardType.NUMBER) {
      if (card.type !== CardType.NUMBER || card.value !== firstCard.value) return false;
    } else {
      if (card.type !== firstCard.type) return false;
    }
  }
  return true;
};

export const getBotMove = (hand: Card[], topCard: Card, currentColor: CardColor, botDifficulty: number = 0): Card[] => {
  const playable = hand.filter(c => isCardPlayable(c, topCard, currentColor));
  if (playable.length === 0) return [];

  // Lógica de "Mãos de Elite" para arenas superiores
  if (botDifficulty > 3) {
    // Guarda o +4 e o Wild se tiver outras opções, a menos que esteja com poucas cartas
    if (hand.length > 3) {
      const normalOptions = playable.filter(c => c.color !== 'Especial');
      if (normalOptions.length > 0) {
        // Tenta jogar ações primeiro para atrapalhar
        const actions = normalOptions.filter(c => c.type !== CardType.NUMBER);
        if (actions.length > 0) return [actions[0]];
        return [normalOptions[0]];
      }
    }
  }

  const firstCard = playable[0];
  if (firstCard.type === CardType.NUMBER) {
    return hand.filter(c => c.type === CardType.NUMBER && c.value === firstCard.value);
  }
  return [firstCard];
};

export const getRandomColor = (): CardColor => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};
