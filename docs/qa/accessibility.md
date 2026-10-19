# Accessibility verification

Chromium automated9cases/42.5s PASS (`S09-browser-verified.log`): keyboard-only eight-order completion; original note focus, arrow/Space changes, Escape return; native modal Tab wrap/Escape/trigger return;320/390/768/landscape and CSSzoom200/400; system reduced motion initial preference and fixed-do setting. All four axe screens (home/workbench/question/settings) have zero violations. Modal focus escape and zoom-clipped close button were reproduced, fixed and retested; initial failure log retained.

Actual computed WCAG contrast: body9.382, muted text4.794, button border4.904, slot border4.850, selected outline5.868. Normal text target4.5, essential UI target3. Main buttons>=44px, pads>=48px/gap8px, piano black keys36px with equivalent pads. Product44px target is distinct from WCAG2.2's24px minimum.

Screenshots `output/playwright/S09-*` were captured;390px question screen was visually inspected. Enlargement tests use CSS zoom; OS text scale and browser-menu zoom were not directly operated. Physical touchscreen, VoiceOver, TalkBack and human assistive-technology sessions are **NOT RUN**. Automated success does not establish full WCAG AA conformance.

S11 final clean: Chromium/Firefox/Windows WebKit, 9 cases each, 27 PASS/1.4min (2026-10-19 15:56:51 UTC). Includes keyboard-only eight orders, axe and enlarged layouts. Windows WebKit is not iOS Safari; physical AT remains NOT RUN. See test-report.md and final clean summary.
