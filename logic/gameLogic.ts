
import { Card, CardType, CardColor, CardInstance } from '../types';
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

export const isCardPlayable = (card: Card, topCard: Card | undefined, currentColor: CardColor): boolean => {
  if (!card || !topCard) return false;
  if (card.color === 'Especial') return true;
  if (card.color === currentColor) return true;
  if (card.type === topCard.type && card.type !== CardType.NUMBER) return true;
  if (card.type === CardType.NUMBER && topCard.type === CardType.NUMBER && card.value === topCard.value) return true;
  return false;
};

export const isValidCombo = (selectedCards: Card[], topCard: Card | undefined, currentColor: CardColor, isMyTurn: boolean): boolean => {
  if (selectedCards.length === 0 || !topCard) return false;
  const firstCard = selectedCards[0];
  
  const canStart = isCardPlayable(firstCard, topCard, currentColor);
  if (!canStart) return false;

  for (let i = 1; i < selectedCards.length; i++) {
    const card = selectedCards[i];
    if (firstCard.type === CardType.NUMBER) {
      if (card.type !== CardType.NUMBER || card.value !== firstCard.value) return false;
    } else {
      if (card.type !== firstCard.type) return false;
    }
    if (card.color !== firstCard.color && card.color !== 'Especial') return false;
  }
  return true;
};

export const getBotMove = (hand: Card[], topCard: Card | undefined, currentColor: CardColor, botDifficulty: number = 0): Card[] => {
  if (!topCard) return [];
  const playable = hand.filter(c => isCardPlayable(c, topCard, currentColor));
  if (playable.length === 0) return [];

  // Bots tentam priorizar combos de números
  const numberPlayable = playable.filter(c => c.type === CardType.NUMBER);
  if (numberPlayable.length > 0) {
     const cardToPlay = numberPlayable[0];
     const combo = hand.filter(c => c.type === CardType.NUMBER && c.value === cardToPlay.value && c.color === cardToPlay.color);
     if (combo.length > 0) return combo;
  }

  // Bots inteligentes guardam cartas especiais para o final
  const normalCards = playable.filter(c => c.color !== 'Especial');
  const specialCards = playable.filter(c => c.color === 'Especial');

  let cardToPlay = normalCards.length > 0 ? normalCards[Math.floor(Math.random()*normalCards.length)] : specialCards[0];

  return [cardToPlay];
};

export const getRandomColor = (): CardColor => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};
