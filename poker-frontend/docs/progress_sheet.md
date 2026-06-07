# PokerIN — Progress Sheet

---

## Sprint: 2026-06-07_05:37:IST

**Project Phase:** Phase 5 — Virtual Economy & Cosmetics
**Status:** ✅ COMPLETE — `tsc --noEmit` passed with 0 errors

### Changes Made
| File | Action | Description |
|---|---|---|
| `docs/progress_sheet.md` | MODIFIED | This entry |
| `src/store/economyStore.ts` | NEW | Zustand + persist store: premiumCurrency, inventory[], equipped {felt, cardBack, avatarFrame}, equipItem(), purchaseItem() |
| `src/store/uiStore.ts` | MODIFIED | Added `'STOREFRONT'` to ModalName union |
| `src/components/ui/StorefrontModal.tsx` | NEW | Tabbed storefront (Chips / Felts / Card Backs); CSS Grid item cards with Buy+Equip states; hover scale effects |
| `src/components/ui/GlobalModalContainer.tsx` | MODIFIED | Added `STOREFRONT` case + import |
| `src/components/table/PokerTable.tsx` | MODIFIED | Reads `economyStore.equipped.felt` → maps to felt gradient; outer ring also tinted |
| `src/components/shared/PlayingCard.tsx` | MODIFIED | Reads `economyStore.equipped.cardBack` → renders themed card-back pattern |
| `src/pages/LobbyPage.tsx` | MODIFIED | Added 🛍 Store icon button to nav bar |

### Changes Needed / Next Steps — Phase 5.1
- [ ] Backend ledger: `POST /api/economy/purchase/` + authenticated payment verification
- [ ] Stripe / Razorpay chip top-up flow
- [ ] Server-side equipped cosmetics persistence (save to user profile)
- [ ] Avatar frame ring integration in `PlayerSeat.tsx`
- [ ] Animated card-back unlock reveal effect

---

---

## Sprint: 2026-06-07_05:27:IST

**Project Phase:** Phase 4.1 — Live Data Integration
**Status:** ✅ COMPLETE — `tsc --noEmit` passed with 0 errors

### Changes Made
| File | Action | Description |
|---|---|---|
| `docs/progress_sheet.md` | MODIFIED | This entry |
| `src/hooks/useWebSocket.ts` | MODIFIED | `HAND_RESULT` now calls `sessionStore.recordHandResult()` with real P&L and pot size |
| `src/api/leaderboardService.ts` | NEW | Typed Axios service; `fetchLeaderboard()` + `LeaderboardEntry` interface |
| `src/components/ui/LeaderboardModal.tsx` | MODIFIED | Mock data removed; `useEffect` fetch on mount; skeleton loader; error fallback; refresh fires live API |

### Changes Needed / Next Steps — Phase 5: Virtual Economy & Cosmetics
- [ ] Avatar cosmetics system (unlockable borders/initials colours)
- [ ] Backend `GET /api/leaderboard/` endpoint (aggregate query over wallet balances)
- [ ] Backend `GET /api/stats/` endpoint (win-rate, hands played per user)
- [ ] Chip purchase / top-up flow (virtual economy)
- [ ] Achievement / badge system

---

---

## Sprint: 2026-06-07_05:18:IST

**Project Phase:** Phase 4 — Progression & Retention
**Status:** ✅ COMPLETE — `tsc --noEmit` passed with 0 errors

### Changes Made
| File | Action | Description |
|---|---|---|
| `docs/progress_sheet.md` | MODIFIED | This entry |
| `src/store/sessionStore.ts` | NEW | Zustand session tracker — handsPlayed, totalWon/Lost, biggestPot, sessionStartTime, recordHandResult, resetSession |
| `src/store/uiStore.ts` | MODIFIED | Added `'LEADERBOARD'`, `'SESSION_SUMMARY'`, `'TUTORIAL'` to ModalName union |
| `src/components/ui/SessionSummaryModal.tsx` | NEW | Post-game summary modal — net P&L (color-coded), duration, hands played, Return to Lobby CTA |
| `src/components/ui/LeaderboardModal.tsx` | NEW | Scrollable rank table — top 3 gold/silver/bronze styling, mocked data, win-rate column |
| `src/components/ui/TutorialModal.tsx` | NEW | Tabbed modal — Tab 1: hand rankings visual cards; Tab 2: UI guide for chat/controls/timer |
| `src/components/ui/GlobalModalContainer.tsx` | MODIFIED | Added `SESSION_SUMMARY`, `LEADERBOARD`, `TUTORIAL` to switch; imported new modals |
| `src/pages/GameTablePage.tsx` | MODIFIED | Leave Table → opens SESSION_SUMMARY modal instead of navigating immediately |
| `src/pages/LobbyPage.tsx` | MODIFIED | Added Leaderboard & Tutorial icon buttons to nav bar |

### Changes Needed / Next Steps — Phase 4.1
- [ ] Hook Leaderboard to real backend aggregate API (`GET /api/leaderboard/`)
- [ ] Call `sessionStore.recordHandResult()` from `useWebSocket` on `HAND_RESULT` event
- [ ] Persist session history server-side (Django model + endpoint)
- [ ] Tutorial step-through overlay for first-time login users

---

---

## Sprint: 2026-06-07_05:12:IST

**Project Phase:** Phase 3 — Social & Communication (Integration)
**Status:** ✅ COMPLETE — `tsc --noEmit` passed with 0 errors

### Changes Made
| File | Action | Description |
|---|---|---|
| `docs/progress_sheet.md` | MODIFIED | This entry appended |
| `src/store/uiStore.ts` | MODIFIED | Added `selectedPlayer: PlayerProfileData \| null` payload + `openPlayerProfile()` typed action |
| `src/components/ui/GlobalModalContainer.tsx` | MODIFIED | Added `PLAYER_PROFILE` case → renders `<PlayerProfileCard />` driven by `uiStore.selectedPlayer` |
| `src/pages/GameTablePage.tsx` | MODIFIED | Chat sidebar integrated as fixed right-rail tray; `sendChat` wired from hook; Buy-in modal migrated to pure Tailwind; all inline styles removed from button bar |
| `src/components/table/PlayerSeat.tsx` | MODIFIED | Avatar div upgraded to `<button>`; `onClick` → `openPlayerProfile()`; `cursor-pointer` + `group` hover ring added; animations/timer/cards untouched |

### Changes Needed / Next Steps — Phase 4
- [ ] Global Leaderboard page (`/leaderboard`) with server-side ranking API
- [ ] Player stats persistence — backend endpoint for win-rate, hands played, biggest pot
- [ ] Tutorial / onboarding overlay for first-time users
- [ ] Friends list panel + invite-by-username flow
- [ ] Backend `SEND_CHAT_MESSAGE` consumer handler (Django Channels)
- [ ] Token refresh / silent re-auth on 401 (long session support)

---

---

## Sprint: 2026-06-07_04:56:IST

**Project Phase:** Phase 3 — Social, Communication & Title UI
**Status:** ✅ COMPLETE — `tsc --noEmit` passed with 0 errors

### Changes Made
| File | Action | Description |
|---|---|---|
| `docs/progress_sheet.md` | MODIFIED | This entry appended |
| `src/pages/AuthPage.tsx` | MODIFIED | Full premium Title Screen overhaul — radial felt bg, glassmorphic card, Framer Motion entrance, gold focus states, pulsating CTA |
| `src/store/gameStore.ts` | MODIFIED | `ChatMessage` typed interface; `addChatMessage()` action; backward-compat `addChat` preserved; strict 50-msg cap |
| `src/hooks/useWebSocket.ts` | MODIFIED | `CHAT_MESSAGE` → `addChatMessage`; `sendChat(msg)` emitter added to return value |
| `src/components/game/TableChat.tsx` | NEW | Collapsible real-time chat sidebar; auto-scroll; system vs player styling; 8 quick-emote shortcuts |
| `src/components/ui/PlayerProfileCard.tsx` | NEW | Reusable profile modal (avatar, balance, stats placeholders, report button) triggered via `uiStore` |

### Changes Needed / Next Steps
- [ ] Friends List panel + invite-by-username flow
- [ ] Backend `SEND_CHAT_MESSAGE` consumer handler (Django Channels)
- [ ] Wire `TableChat` into `GameTablePage` layout with toggle button
- [ ] Wire `PlayerSeat` avatar click → `openModal('PLAYER_PROFILE')` passing `userId`
- [ ] `uiStore` modal payload: extend `ModalName` to pass typed data (e.g., `selectedPlayerId`)
- [ ] Token refresh / silent re-auth on 401 responses

---

## Sprint: 2026-06-07_04:18:IST (Phase 2 — COMPLETE)

---

## Sprint: 2026-06-07_04:18:IST

**Project Phase:** Phase 2 — Core UI/UX Wrappers & Polish
**Status:** ✅ COMPLETE — `tsc --noEmit` passed with 0 errors

### Changes Made
| File | Action | Description |
|---|---|---|
| `docs/progress_sheet.md` | NEW | This tracker |
| `src/store/uiStore.ts` | NEW | Global UI Zustand store (modals, loading, settings) |
| `src/App.tsx` | MODIFIED | Flat → nested routing; GlobalLayout wraps protected routes |
| `src/components/layout/GlobalLayout.tsx` | NEW | Root layout wrapper; auto-triggers DISCONNECT_ALERT modal |
| `src/components/ui/GlobalModalContainer.tsx` | NEW | Central modal renderer driven by uiStore.activeModal |
| `src/components/ui/LoadingScreen.tsx` | NEW | Full-screen framer-motion loading overlay |
| `src/pages/LobbyPage.tsx` | MODIFIED | Rebuilt as full Main Menu dashboard using pure Tailwind |

### Changes Needed / Next Steps
- [ ] Full `<SettingsModal />` body with toggle rows wired to `uiStore.settings`
- [ ] Wire `uiStore.settings.audioEnabled` → `audioManager.ts` `setMuted()` call
- [ ] Build Title/Splash Screen with animation (Phase 2.2)
- [ ] Migrate remaining `style={{}}` inline styles in `PokerTable.tsx`, `PlayerSeat.tsx`, `ActionConsole.tsx` to Tailwind custom tokens
- [ ] Add collapsible chat sidebar panel to `GameTablePage`
- [ ] Token refresh / silent re-auth on 401 (long session support)
- [ ] Responsive breakpoints audit on LobbyPage dashboard for mobile

---

## Audit Reference: 2026-06-06 (Phase 1)

**Status:** COMPLETE
**Document:** `../architecture_audit.md`
