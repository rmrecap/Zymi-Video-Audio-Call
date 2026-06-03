# ZYMI Brand Asset Checklist

**Document Type:** Brand & Design Reference

**Last Updated:** June 1, 2026

---

## 1. Logo Files

| Asset | Format | Dimensions | Usage | Ready? |
|-------|--------|------------|-------|--------|
| Primary logo (horizontal) | SVG | Vector | Website header, app login screen, docs | ☐ |
| Primary logo (horizontal) | PNG | 512×512 px | Web, social media | ☐ |
| Primary logo (horizontal) | PNG | 192×192 px | Favicon fallback, small displays | ☐ |
| Logo mark (icon only) | SVG | Vector | App icon template, favicon, notification icon | ☐ |
| Logo mark (icon only) | PNG | 1024×1024 px | App store icons (scaled down as needed) | ☐ |
| Logo mark (icon only) | PNG | 512×512 px | Google Play Store icon | ☐ |
| Monochrome logo (white) | SVG | Vector | Dark backgrounds, loading screens | ☐ |
| Monochrome logo (black) | SVG | Vector | Light backgrounds, print | ☐ |

### Logo File Naming Convention
```
zymi-logo-primary.svg
zymi-logo-primary-512x512.png
zymi-logo-primary-192x192.png
zymi-logo-mark.svg
zymi-logo-mark-1024x1024.png
zymi-logo-mark-512x512.png
zymi-logo-mono-white.svg
zymi-logo-mono-black.svg
```

---

## 2. Icon Variations

| Icon Type | Size(s) | Format | Usage | Ready? |
|-----------|---------|--------|-------|--------|
| **App icon (iOS)** | 1024×1024 px | PNG (no alpha) | App Store listing | ☐ |
| **App icon (iOS — device)** | 180×180, 167×167, 152×152, 120×120, 76×76, 60×60, 40×40, 29×29, 20×20 px | PNG | iOS device home screen, settings, notifications | ☐ |
| **App icon (Android)** | 512×512 px, 192×192 px, 144×144 px, 96×96 px, 72×72 px, 48×48 px, 36×36 px | PNG | Google Play Store + device launcher | ☐ |
| **Adaptive icon (Android)** | Foreground 108×108 px, Background 108×108 px | PNG | Android 8+ adaptive icon | ☐ |
| **Favicon** | 32×32, 16×16 px | ICO / PNG | Browser tab | ☐ |
| **Favicon (SVG)** | Vector | SVG | Modern browsers | ☐ |
| **Notification icon** | 96×96 px | PNG (white/transparent) | Push notification badge | ☐ |
| **Web app manifest icon** | 512×512, 192×192 px | PNG | PWA manifest | ☐ |

### Icon Design Notes
- App icon should use the ZYMI logo mark on a solid background (primary brand color).
- Avoid using the full logo as the app icon — it won't be legible at small sizes.
- The notification icon must be white on a transparent background for platform compatibility.

---

## 3. Color Palette

| Role | Color Name | Hex | RGB | Usage |
|------|-----------|-----|-----|-------|
| **Primary** | ZYMI Blue | `#2563EB` | `(37, 99, 235)` | Primary buttons, links, header backgrounds, active states |
| **Secondary** | ZYMI Indigo | `#4F46E5` | `(79, 70, 229)` | Secondary buttons, hover states, accents |
| **Accent** | ZYMI Teal | `#14B8A6` | `(20, 184, 166)` | Badges, notifications, call buttons, highlights |
| **Success** | ZYMI Green | `#22C55E` | `(34, 197, 94)` | Online status, success messages, verified badges |
| **Warning** | ZYMI Amber | `#F59E0B` | `(245, 158, 11)` | Warning messages, pending indicators |
| **Danger** | ZYMI Red | `#EF4444` | `(239, 68, 68)` | Error states, delete actions, ban indicators |
| **Background (light)** | White | `#FFFFFF` | `(255, 255, 255)` | Light mode background |
| **Background (dark)** | ZYMI Dark | `#0F172A` | `(15, 23, 42)` | Dark mode background |
| **Surface (light)** | Gray 50 | `#F8FAFC` | `(248, 250, 252)` | Cards, dialogs in light mode |
| **Surface (dark)** | Slate 800 | `#1E293B` | `(30, 41, 59)` | Cards, dialogs in dark mode |
| **Text (light)** | Slate 900 | `#0F172A` | `(15, 23, 42)` | Primary text in light mode |
| **Text (dark)** | Gray 100 | `#F1F5F9` | `(241, 245, 249)` | Primary text in dark mode |
| **Text secondary (light)** | Slate 500 | `#64748B` | `(100, 116, 139)` | Secondary text, timestamps in light mode |
| **Text secondary (dark)** | Slate 400 | `#94A3B8` | `(148, 163, 184)` | Secondary text, timestamps in dark mode |
| **Border** | Slate 200 (light) / Slate 700 (dark) | `#E2E8F0` / `#334155` | `(226, 232, 240)` / `(51, 65, 85)` | Borders, dividers |

### Color Usage Guidelines
- **Primary** is the dominant color in the app UI.
- **Accent** is used sparingly for important action elements (call buttons, unread badges).
- **Always maintain WCAG AA contrast ratio** between text and background (minimum 4.5:1 for normal text, 3:1 for large text).
- Dark mode colors should be tested on actual OLED screens.

---

## 4. Typography

### 4.1 Font Family

| Usage | Font | Fallback |
|-------|------|----------|
| **Headings & UI** | Inter (sans-serif) | system-ui, -apple-system, sans-serif |
| **Monospace / Code** | JetBrains Mono | Fira Code, monospace |

### 4.2 Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, paragraph content |
| Medium | 500 | Buttons, labels, navigation |
| Semibold | 600 | Subheadings, emphasized text |
| Bold | 700 | Headings, titles, strong emphasis |

### 4.3 Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| **Display** | 36px / 2.25rem | Bold (700) | 1.2 | Page titles, hero text |
| **Heading 1** | 28px / 1.75rem | Bold (700) | 1.3 | Section headers |
| **Heading 2** | 22px / 1.375rem | Semibold (600) | 1.35 | Card titles, modal headers |
| **Heading 3** | 18px / 1.125rem | Semibold (600) | 1.4 | Chat group names, settings sections |
| **Body Large** | 16px / 1rem | Regular (400) | 1.5 | Chat messages, list items |
| **Body** | 14px / 0.875rem | Regular (400) | 1.5 | Secondary text, metadata |
| **Caption** | 12px / 0.75rem | Regular (400) | 1.4 | Timestamps, labels |
| **Small** | 10px / 0.625rem | Medium (500) | 1.3 | Badge counts, small indicators |

### 4.4 Font Sources
- **Inter**: https://rsms.me/inter/ — Self-host or use Google Fonts.
- **JetBrains Mono**: https://www.jetbrains.com/lp/mono/ — Self-host or use Google Fonts.

---

## 5. Screenshots

| Platform | Orientation | Dimensions | Content | Ready? |
|----------|-------------|------------|---------|--------|
| **Google Play (phone)** | Portrait | 1080×1920 px or 1080×2340 px | Chat list, chat view, call screen, nearby, settings | ☐ |
| **Google Play (tablet)** | Landscape | 1280×800 px or 1920×1200 px | Admin panel (ZRCS) or tablet chat view | ☐ |
| **App Store (6.5")** | Portrait | 1290×2796 px | Same as Play screenshots (retake for iOS) | ☐ |
| **App Store (5.5")** | Portrait | 1242×2208 px | Same content, different resolution | ☐ |
| **App Store (iPad)** | Both | 2048×2732 px (12.9") | Tablet-optimized layout | ☐ |
| **Website / marketing** | 16:9 | 1920×1080 px | Feature showcase, in-app mockups | ☐ |

### Screenshot Guidelines
- Show real-looking but clearly fake data (use placeholder usernames like "User123").
- No real email addresses, phone numbers, or confidential information.
- Use light mode for App Store screenshots (Apple prefers light mode in screenshots).
- Use dark mode for Google Play if it showcases the app's design better.
- Add captions/overlays: "Real-time Chat", "Voice & Video Calls", "Nearby Discovery", "Admin Panel".

---

## 6. Feature Graphic (Google Play)

| Requirement | Specification |
|-------------|--------------|
| **Dimensions** | 1024×500 px |
| **Format** | PNG or JPG |
| **Max file size** | 1 MB |
| **Content** | ZYMI logo + tagline + 3–4 feature icons/icons |
| **Text** | "ZYMI — Private Chat & Calling" (or shorter) |
| **Do not** | Include device frames, screenshots, or download buttons |

---

## 7. Preview Video (App Store)

| Requirement | Specification |
|-------------|--------------|
| **Duration** | 15–30 seconds (max 30 seconds) |
| **Resolution** | 1290×2796 px (6.5" iPhone) or 1242×2208 px (5.5" iPhone) |
| **Format** | M4V, MOV, or MP4 |
| **Max file size** | 500 MB |
| **Content** | Quick demo: launch → navigate chat → make a call → Nearby discovery |
| **Audio** | Optional. If used, must not be distracting. |
| **No** | Copyrighted music, unlicensed footage, or misleading content. |

---

## 8. Social Media Assets

| Platform | Asset | Dimensions | Format | Ready? |
|----------|-------|------------|--------|--------|
| **Twitter/X** | Profile photo | 400×400 px | PNG | ☐ |
| **Twitter/X** | Header image | 1500×500 px | PNG/JPG | ☐ |
| **GitHub** | Organization avatar | 512×512 px | PNG | ☐ |
| **GitHub** | Repository social preview | 1280×640 px | PNG | ☐ |
| **LinkedIn** | Company logo | 300×300 px | PNG | ☐ |
| **LinkedIn** | Banner image | 1584×396 px | PNG/JPG | ☐ |
| **YouTube** | Channel icon | 800×800 px | PNG | ☐ |
| **YouTube** | Channel banner | 2560×1440 px | PNG/JPG | ☐ |

### Social Media Branding Notes
- Use consistent imagery across all platforms.
- The ZYMI logo mark should be the primary profile photo asset.
- Headers/banners can feature the logo + a tagline + the app in use.
- Do not use AI-generated imagery for brand assets unless explicitly designed and approved.

---

## 9. Brand Usage Guidelines

### 9.1 Do's
- ✅ Use the ZYMI logo exactly as provided (no stretching, distorting, or recoloring).
- ✅ Use the official color palette for all ZYMI-branded materials.
- ✅ Maintain clear space around the logo (minimum 1/3 of the logo height on all sides).
- ✅ Use the correct file format for the intended medium (SVG for web, PNG for raster).

### 9.2 Don'ts
- ❌ Do not modify the logo (change colors, add effects, rotate, flip, add outlines).
- ❌ Do not use the logo for unauthorized commercial purposes.
- ❌ Do not use the logo in a way that implies endorsement of third-party products.
- ❌ Do not place the logo on busy backgrounds where it becomes unreadable.
- ❌ Do not use the logo as part of your own brand or product name.
- ❌ Do not use old or unofficial versions of the logo.

### 9.3 Logo Clear Space
```
┌─────────────────────────────────┐
│  ┌───────────┐                  │
│  │           │                  │
│  │   ZYMI    │   ← Clear space  │
│  │   Logo    │      = 1/3 height│
│  │           │                  │
│  └───────────┘                  │
│                                 │
└─────────────────────────────────┘
```

### 9.4 Minimum Sizes
| Medium | Minimum Logo Width | Minimum Logo Mark Width |
|--------|-------------------|------------------------|
| Digital (screen) | 120px | 32px |
| Print | 0.5 inch / 36pt | 0.2 inch / 14pt |
| Favicon | n/a | 16px |

---

## 10. File Storage & Organization

```
brand/
├── logo/
│   ├── zymi-logo-primary.svg
│   ├── zymi-logo-primary-512x512.png
│   ├── zymi-logo-primary-192x192.png
│   ├── zymi-logo-mark.svg
│   ├── zymi-logo-mark-1024x1024.png
│   ├── zymi-logo-mark-512x512.png
│   ├── zymi-logo-mono-white.svg
│   └── zymi-logo-mono-black.svg
├── icons/
│   ├── ios/
│   │   ├── ZYMI-AppIcon-1024.png
│   │   └── (individual sizes)
│   ├── android/
│   │   ├── ZYMI-PlayStore-Icon-512.png
│   │   ├── adaptive-foreground.png
│   │   └── adaptive-background.png
│   ├── favicon/
│   │   ├── favicon.ico
│   │   ├── favicon-32x32.png
│   │   ├── favicon-16x16.png
│   │   └── favicon.svg
│   └── notification-icon.png
├── colors/
│   └── zymi-palette.ase (Adobe Swatch Exchange)
├── typography/
│   └── zymi-typography-specs.pdf
├── screenshots/
│   ├── google-play/
│   │   ├── phone-1-chat-list.png
│   │   ├── phone-2-chat-view.png
│   │   ├── phone-3-call-screen.png
│   │   ├── phone-4-nearby.png
│   │   └── tablet-1-admin-panel.png
│   ├── app-store/
│   │   ├── ios-65-1-chat-list.png
│   │   ├── ios-65-2-chat-view.png
│   │   ├── ios-65-3-call-screen.png
│   │   ├── ios-55-1-chat-list.png
│   │   └── ipad-1-chat-view.png
│   └── website/
│       └── feature-showcase.png
├── marketing/
│   ├── google-play-feature-graphic.png
│   └── app-store-preview-video.mov
└── social-media/
    ├── twitter-profile.png
    ├── twitter-header.png
    ├── github-social-preview.png
    ├── linkedin-banner.png
    └── youtube-banner.png
```

---

## 11. Asset Checklist

### Pre-Launch
- [ ] Primary logo exported in all required formats.
- [ ] App icons generated for all required sizes (iOS + Android).
- [ ] Favicon created and linked in web app HTML.
- [ ] Notification icon created.
- [ ] Color palette documented and implemented in the app theme.
- [ ] Typography selected and implemented in the app.
- [ ] Google Play screenshots created and uploaded.
- [ ] App Store screenshots created and uploaded.
- [ ] Google Play feature graphic created and uploaded.
- [ ] App Store preview video (optional) created and uploaded.
- [ ] Social media profile photos and banners created.

### Maintenance
- [ ] Brand assets version-controlled in the repository under `assets/brand/`.
- [ ] Original source files (SVG, .sketch, .fig, .ai) backed up outside the repo.
- [ ] Any third-party fonts' licenses confirmed for app distribution.

---

*This is a brand and design reference document, not a legal document. No legal review required.*
