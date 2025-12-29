
import { Card, CardType, CardColor, CardDefinition } from '../types';
import { COLORS, ALL_CARDS } from '../constants';

export const createDeck = (playerDeckIds?: string[]): Card[] => {
  const deck: Card[] = [];
  const colors: CardColor[] = ['Red', 'Blue', 'Yellow', 'Green'];
  
  // Se não houver deck definido (ex: bots ou fallback), usa o catálogo completo
  const sourceCards = playerDeckIds 
    ? ALL_CARDS.filter(c => playerDeckIds.includes(c.id))
    : ALL_CARDS;

  sourceCards.forEach(cardDef => {
    // Para cada definição no deck, criamos versões em múltiplas cores para o jogo fluir
    const cardColors = cardDef.baseColor === 'Wild' ? ['Wild' as CardColor] : colors;
    
    cardColors.forEach(color => {
      // Adicionamos 2 cópias de cada para garantir volume de deck
      for(let i = 0; i < 2; i++) {
        deck.push({
          ...cardDef,
          instanceId: `${cardDef.id}-${color}-${i}-${Math.random()}`,
          color: color
        });
      }
    });
  });

  return deck.sort(() => Math.random() - 0.5);
};

export const isCardPlayable = (card: Card, topCard: Card, currentColor: CardColor): boolean => {
  if (card.color === 'Wild') return true;
  if (card.color === currentColor) return true;
  if (card.type === topCard.type && card.type !== CardType.NUMBER) return true;
  if (card.type === CardType.NUMBER && topCard.type === CardType.NUMBER && card.value === topCard.value) return true;
  return false;
};

export const isExactMatch = (card: Card, topCard: Card, currentColor: CardColor): boolean => {
  if (card.color === 'Wild') return false;
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

export const getBotMove = (hand: Card[], topCard: Card, currentColor: CardColor): Card[] => {
  const playable = hand.filter(c => isCardPlayable(c, topCard, currentColor));
  if (playable.length === 0) return [];
  const firstCard = playable[0];
  if (firstCard.type === CardType.NUMBER) {
    return hand.filter(c => c.type === CardType.NUMBER && c.value === firstCard.value);
  }
  return [firstCard];
};

export const getRandomColor = (): CardColor => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};
