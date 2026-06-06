# PokerIN — Phase 2 Progress Sheet

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
