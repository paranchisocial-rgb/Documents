# Paranchi's Documents — GitHub Pages package

## Upload these files to your repo root
- index.html
- manifest.json
- sw.js
- icon-192x192.png
- icon-512x512.png
- icon-maskable-192x192.png
- icon-maskable-512x512.png
- apple-touch-icon.png

Then enable GitHub Pages (Settings → Pages → Deploy from branch → root).

## Offline behavior
First open needs internet once, to download the app itself plus the
fonts, JSZip, and pdf.js libraries it pulls from CDNs. After that first
successful load, a service worker (`sw.js`) has cached all of it, so
every future open — including with the phone in airplane mode — works
with zero connection. Your documents were always stored only on-device
(IndexedDB); this just makes the app shell itself load offline too.

If you ever update index.html and re-upload, bump `CACHE_VERSION` in
sw.js (e.g. `paranchi-docs-v2`) so installed users actually get the new
version instead of the old cached one.

## What changed in this version

**1. Animations stripped down to functional-only.** Removed everything
decorative: the shimmer sweep on loading skeletons (now flat static
placeholders), the pulsing rings + floating particles + bouncing icon
on empty states (now a static icon), the bobbing search icon + blinking
dots, the tap ripple effect, and the haptic-pulse glow on button taps.
What's left is only animation that's actually communicating something:
the splash sequence (~1.5s, once), card/list entrance fade (one-shot,
cheap), and the loading spinner while something's genuinely working
(PDF render, import, etc). Nothing decorative loops forever anymore.

**2. Device back button — immersive fullscreen + swipe.** The app now
requests fullscreen on first touch, which hides the Android system nav
bar (and the back button with it) on devices/WebViews that support it.
This is cosmetic only — it doesn't drive navigation logic itself
(that's what broke it before: v7 had fullscreen *also* triggering
back-navigation, which raced against the real back-button handler and
caused skipped screens or the app closing). Now there's one navigation
path (in-app buttons + the right-edge swipe gesture you already have),
and fullscreen is just there to hide the chrome around it.

Honest limit: a webpage can't force Android's OS-level back gesture or
hardware key to stop existing — that's controlled by the native shell,
not by anything running inside the WebView. If Kodular's own
BackPressed block is still doing something after this, the more
reliable fix is on the Kodular side: make BackPressed do nothing (don't
call WebViewer1.GoBack, don't close the screen), so the back key has no
effect and people navigate purely by swipe. `window.paranchiBack()` is
available if you'd rather wire the hardware key to drive in-app
navigation instead of disabling it outright.

**3. Dark theme re-colored.** Was navy blue on near-black, which washes
out and looks dim in bright light — the "glow on black" look just
doesn't hold up outdoors. Replaced with an emerald green accent
(alongside the existing gold) on a warmer, neutral near-black
background. Every glow, shadow, gradient, and splash-screen color tied
to the old blue has been remapped — nothing navy left in the dark
theme.

**4. Icon updated** to the artwork you sent — regenerated all sizes
(192, 512, maskable variants, apple-touch-icon) from it.

**5 & 6. Full offline support + full recheck**, unchanged from before:
manifest.json + sw.js still handle the offline caching (see the
previous section below), and JS syntax, HTML tag balance, and every
`getElementById` call were all re-verified against this version.

