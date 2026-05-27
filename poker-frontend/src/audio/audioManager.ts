/**
 * Howler.js audio manager for poker game sounds.
 *
 * Audio sprite file should be placed at: /public/audio/poker-sprites.webm
 * and /public/audio/poker-sprites.mp3 as fallback.
 *
 * To generate: Use Audacity or ffmpeg to concatenate sound clips with silence
 * between them, matching the sprite offsets below.
 *
 * Fallback: If no sprite file exists, sounds are silently skipped.
 */
import { Howl, Howler } from 'howler';

// Sprite timing map (start_ms, duration_ms)
const SPRITE_MAP: Record<string, [number, number]> = {
  card_deal:    [0,     500],
  card_flip:    [600,   400],
  check:        [1100,  800],
  chip_place:   [2000,  600],
  chip_riffle:  [2700,  900],
  fold:         [3700,  500],
  pot_win:      [4300, 1500],
  tick_warning: [6000,  300],
};

type SoundKey = keyof typeof SPRITE_MAP;

let sound: Howl | null = null;
let initialized = false;

function initSound() {
  if (initialized) return;
  initialized = true;

  sound = new Howl({
    src: ['/audio/poker-sprites.webm', '/audio/poker-sprites.mp3'],
    sprite: SPRITE_MAP,
    volume: 0.7,
    onloaderror: () => {
      console.warn('[Audio] Poker sprite file not found. Audio will be silent.');
      sound = null;
    },
  });
}

export function playSound(key: SoundKey, loop = false): void {
  initSound();
  if (!sound) return;

  try {
    const id = sound.play(key as string);
    if (loop && typeof id === 'number') sound.loop(true, id);
  } catch (e) {
    // Silently fail — audio is enhancement, not critical
  }
}

export function stopSound(_key: SoundKey): void {
  if (!sound) return;
  // Stop all currently playing sounds (Howler stop without id stops all)
  sound.stop();
}

export function setVolume(vol: number): void {
  Howler.volume(Math.max(0, Math.min(1, vol)));
}

export function muteAll(muted: boolean): void {
  Howler.mute(muted);
}

// Convenience triggers used by useWebSocket
export const AudioTriggers = {
  onCardDeal:      () => playSound('card_deal'),
  onCommunityCard: () => playSound('card_flip'),
  onCheck:         () => playSound('check'),
  onChipPlace:     () => playSound('chip_place'),
  onRiffle:        () => playSound('chip_riffle'),
  onFold:          () => playSound('fold'),
  onPotWin:        () => playSound('pot_win'),
  onTimerWarning:  () => playSound('tick_warning', true),
  stopTimer:       () => stopSound('tick_warning'),
};
