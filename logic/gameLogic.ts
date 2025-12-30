
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
  // Cartas especiais (Coringa/+4) sempre podem ser jogadas
  if (card.color === 'Especial') return true;
  // Mesma cor
  if (card.color === currentColor) return true;
  // Mesmo tipo (Pular, Inverter, +2)
  if (card.type === topCard.type && card.type !== CardType.NUMBER) return true;
  // Mesmo número
  if (card.type === CardType.NUMBER && topCard.type === CardType.NUMBER && card.value === topCard.value) return true;
  return false;
};

export const isValidCombo = (selectedCards: Card[], topCard: Card | undefined, currentColor: CardColor, isMyTurn: boolean): boolean => {
  if (selectedCards.length === 0 || !topCard) return false;
  if (!isMyTurn) return false;
  
  // A primeira carta do combo DEVE ser jogável em relação à mesa
  const firstCard = selectedCards[0];
  const canStart = isCardPlayable(firstCard, topCard, currentColor);
  if (!canStart) return false;

  // Se houver mais de uma carta, todas as subsequentes devem ter o mesmo VALOR ou TIPO da primeira
  for (let i = 1; i < selectedCards.length; i++) {
    const card = selectedCards[i];
    if (firstCard.type === CardType.NUMBER) {
      // Se for número, todos devem ser o mesmo número (independente da cor)
      if (card.type !== CardType.NUMBER || card.value !== firstCard.value) return false;
    } else {
      // Se for ação (Pular, Inverter, etc), todos devem ser o mesmo tipo
      if (card.type !== firstCard.type) return false;
    }
  }
  return true;
};

export const getBotMove = (hand: Card[], topCard: Card | undefined, currentColor: CardColor, botDifficulty: number = 0): Card[] => {
  if (!topCard) return [];
  
  // Encontra todas as cartas que poderiam iniciar uma jogada
  const starterPlayable = hand.filter(c => isCardPlayable(c, topCard, currentColor));
  if (starterPlayable.length === 0) return [];

  // Tenta encontrar o melhor combo possível para esvaziar a mão mais rápido
  let bestCombo: Card[] = [];

  for (const starter of starterPlayable) {
    let currentCombo: Card[] = [starter];
    
    // Procura outras cartas na mão que combinem com a iniciadora (mesmo número ou tipo)
    const matches = hand.filter(c => 
      c.instanceId !== starter.instanceId && 
      ((starter.type === CardType.NUMBER && c.type === CardType.NUMBER && c.value === starter.value) ||
       (starter.type !== CardType.NUMBER && c.type === starter.type))
    );
    
    currentCombo = [...currentCombo, ...matches];
    
    if (currentCombo.length > bestCombo.length) {
      bestCombo = currentCombo;
    }
  }

  // Se o bot achou um combo, ele joga. Se não, joga apenas uma carta válida.
  return bestCombo.length > 0 ? bestCombo : [starterPlayable[0]];
};

export const getRandomColor = (): CardColor => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};
