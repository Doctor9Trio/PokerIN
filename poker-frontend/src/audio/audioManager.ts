import { Howl } from 'howler';
import { useUIStore } from '../store/uiStore';

export type SoundKey = 
  | 'card_deal'
  | 'chip_bet'
  | 'check'
  | 'fold'
  | 'pot_win'
  | 'your_turn';

// Map storing unique Howl instances for each sound key
const sounds: Record<SoundKey, Howl> = {
  card_deal: new Howl({ src: ['/audio/card_deal.mp3'], preload: true }),
  chip_bet: new Howl({ src: ['/audio/chip_bet.mp3'], preload: true }),
  check: new Howl({ src: ['/audio/check.mp3'], preload: true }),
  fold: new Howl({ src: ['/audio/fold.mp3'], preload: true }),
  pot_win: new Howl({ src: ['/audio/pot_win.mp3'], preload: true }),
  your_turn: new Howl({ src: ['/audio/your_turn.mp3'], preload: true }),
};

export function playSound(actionKey: SoundKey): void {
  // Check UI Store to see if audio is enabled
  const isAudioEnabled = useUIStore.getState().settings.audioEnabled;
  if (!isAudioEnabled) return;

  const sound = sounds[actionKey];
  if (sound) {
    try {
      sound.play();
    } catch (e) {
      console.warn(`[Audio] Failed to play sound: ${actionKey}`, e);
    }
  } else {
    console.warn(`[Audio] Sound key not found: ${actionKey}`);
  }
}

export function stopSound(actionKey: SoundKey): void {
  const sound = sounds[actionKey];
  if (sound) {
    sound.stop();
  }
}

// Convenience triggers used by legacy components
export const AudioTriggers = {
  onCardDeal:      () => playSound('card_deal'),
  onCheck:         () => playSound('check'),
  onFold:          () => playSound('fold'),
  onPotWin:        () => playSound('pot_win'),
  onYourTurn:      () => playSound('your_turn'),
  onChipBet:       () => playSound('chip_bet'),
  onTimerWarning:  () => {}, // No-op as per asset limits
  stopTimer:       () => {}, // No-op as per asset limits
};
