export interface WishlistItem {
  id: string;
  title: string;
  priceEur: number;
  category: string;
  notes?: string;
  url?: string;
  isAiGenerated?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  spouseName?: string;
  spouseNickname?: string; // Secret Manito / Manita alias of spouse for exclusion
  email: string;
  password?: string; // User password for personalized login
  passwordHash?: string;
  nickname: string; // Secret Manito / Manita alias
  interests: string[];
  wishlist: WishlistItem[];
  assignedToId?: string; // ID of the person this participant must give a gift to
  hasSecretAssigned?: boolean;
}

export interface AuthSession {
  token: string;
  participant: Participant;
}

export interface OrganizerParticipant {
  id: string;
  nickname: string;
  spouseNickname?: string;
  wishlistCount: number;
  assignedToId?: string;
  assignedToNickname?: string | null;
}

export interface EventConfig {
  eventName: string;
  date: string;
  location: string;
  minBudgetEur: number;
  targetParticipants: number;
  isDrawFinalized: boolean;
  drawnAt?: string;
  emailConfig: {
    serviceId: string;
    templateId: string;
    publicKey: string;
    autoSendOnDraw?: boolean;
  };
}

export interface AiGiftSuggestion {
  title: string;
  estimatedPriceEur: number;
  category: string;
  reasoning: string;
  suggestedStores?: string;
}

export interface DrawPairingSummary {
  giverId: string;
  giverName: string;
  giverNickname: string;
  recipientId: string;
  recipientName: string;
  recipientNickname: string;
  recipientWishlistCount: number;
  isSpouseMatch: boolean;
  isSelfMatch: boolean;
}
