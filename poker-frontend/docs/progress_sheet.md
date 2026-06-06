# PokerIN — Progress Sheet

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
