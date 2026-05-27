// Types for the poker application
export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'|'A';
export type CardString = string; // e.g. 'Ah', 'Ks', 'XX' (face-down)

export type GameStage =
  | 'WAITING'
  | 'PRE_FLOP'
  | 'FLOP'
  | 'TURN'
  | 'RIVER'
  | 'SHOWDOWN';

export type PlayerAction = 'CHECK' | 'CALL' | 'RAISE' | 'FOLD' | 'ALL_IN';

export interface PlayerState {
  seat_index: number;
  user_id: number;
  username: string;
  stack: string;        // INR decimal string
  hole_cards: CardString[];
  current_bet: string;  // INR decimal string
  is_folded: boolean;
  is_all_in: boolean;
  is_connected: boolean;
  is_ready: boolean;
  has_acted_this_round: boolean;
}

export interface SidePot {
  amount: string;
  eligible_seats: number[];
}

export interface WinnerInfo {
  seat_index: number;
  user_id: number;
  username: string;
  amount_won: string;
  hand_rank: string;
}

export interface TableState {
  table_id: string;
  hand_number: number;
  game_stage: GameStage;
  dealer_button: number;
  current_turn: number | null;
  pot: string;
  side_pots: SidePot[];
  community_cards: CardString[];
  current_bet: string;
  min_raise: string;
  players: PlayerState[];
  small_blind: string;
  big_blind: string;
  winners?: WinnerInfo[];
}

// WebSocket message types (server → client)
export type ServerMessage =
  | { type: 'TABLE_STATE_UPDATE'; state: TableState }
  | { type: 'RECEIVE_PRIVATE_CARDS'; cards: CardString[] }
  | { type: 'ACTION_REQUIRED'; valid_actions: PlayerAction[]; call_amount: string; min_raise: string; pot: string; timeout_seconds: number }
  | { type: 'HAND_RESULT'; winners: WinnerInfo[]; community_cards: CardString[]; players: Array<{ seat_index: number; username: string; hole_cards: CardString[]; is_folded: boolean }> }
  | { type: 'PLAYER_JOINED'; username: string; seat_index: number }
  | { type: 'PLAYER_LEFT'; username: string; seat_index: number }
  | { type: 'BUY_IN_CONFIRMED'; amount: string; new_stack: string }
  | { type: 'ERROR'; message: string }
  | { type: 'CHAT_MESSAGE'; username: string; message: string };

// WebSocket message types (client → server)
export interface PlayerActionMessage {
  type: 'PLAYER_ACTION';
  action: PlayerAction;
  amount?: number;
}

export interface BuyInMessage {
  type: 'BUY_IN';
  amount: number;
}
