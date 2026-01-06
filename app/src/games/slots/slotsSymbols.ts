/**
 * Slot machine symbols configuration
 * Inspired by legacy UltraSlots but adapted for current architecture
 */

export interface SlotSymbol {
  id: string;
  emoji: string;
  name: string;
  multiplier: number;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const SLOT_SYMBOLS: SlotSymbol[] = [
  {
    id: 'cherry',
    emoji: '🍒',
    name: 'Cherry',
    multiplier: 2,
    color: '#ff4757',
    rarity: 'common',
  },
  {
    id: 'lemon',
    emoji: '🍋',
    name: 'Lemon',
    multiplier: 3,
    color: '#ffd700',
    rarity: 'common',
  },
  {
    id: 'grape',
    emoji: '🍇',
    name: 'Grape',
    multiplier: 4,
    color: '#9b59b6',
    rarity: 'common',
  },
  {
    id: 'watermelon',
    emoji: '🍉',
    name: 'Watermelon',
    multiplier: 5,
    color: '#e74c3c',
    rarity: 'rare',
  },
  {
    id: 'bell',
    emoji: '🔔',
    name: 'Bell',
    multiplier: 8,
    color: '#f39c12',
    rarity: 'rare',
  },
  {
    id: 'star',
    emoji: '⭐',
    name: 'Star',
    multiplier: 10,
    color: '#00d4ff',
    rarity: 'epic',
  },
  {
    id: 'diamond',
    emoji: '💎',
    name: 'Diamond',
    multiplier: 15,
    color: '#3498db',
    rarity: 'epic',
  },
  {
    id: 'seven',
    emoji: '7️⃣',
    name: 'Lucky Seven',
    multiplier: 25,
    color: '#ffd700',
    rarity: 'legendary',
  },
];

/**
 * Get a random symbol (weighted by rarity)
 */
export const getRandomSymbol = (): SlotSymbol => {
  const weights = {
    common: 40,
    rare: 30,
    epic: 20,
    legendary: 10,
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const symbol of SLOT_SYMBOLS) {
    random -= weights[symbol.rarity];
    if (random <= 0) {
      return symbol;
    }
  }

  return SLOT_SYMBOLS[0]; // Fallback
};

/**
 * Map outcome number to symbols
 * Outcome is a 3-digit number where each digit represents a symbol index
 */
export const outcomeToSymbols = (outcome: number): SlotSymbol[] => {
  const outcomeStr = outcome.toString().padStart(3, '0');
  return [
    SLOT_SYMBOLS[parseInt(outcomeStr[0]) % SLOT_SYMBOLS.length],
    SLOT_SYMBOLS[parseInt(outcomeStr[1]) % SLOT_SYMBOLS.length],
    SLOT_SYMBOLS[parseInt(outcomeStr[2]) % SLOT_SYMBOLS.length],
  ];
};

/**
 * Check if symbols are a winning combination
 */
export const isWinningCombination = (symbols: SlotSymbol[]): boolean => {
  return symbols[0].id === symbols[1].id && symbols[1].id === symbols[2].id;
};

/**
 * Get multiplier for a winning combination
 */
export const getWinMultiplier = (symbols: SlotSymbol[]): number => {
  if (!isWinningCombination(symbols)) return 0;
  return symbols[0].multiplier;
};



