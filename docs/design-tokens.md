# Ikaai Academy — Design Tokens & Brand System

Derived from the official Ikaai India corporate website ([ikaaiindia.in](https://ikaaiindia.in/)) and the internal reference learning portal prototype.

---

## 1. Selected Typography System

Standardized on the **Bricolage Grotesque + Figtree** pairing established in the reference prototype:

- **Headings & Display**: `Bricolage Grotesque`, system-ui, sans-serif (**from prototype**)
  - Weights: `600` (SemiBold), `700` (Bold)
  - Line Heights: `1.2`–`1.25`
- **Body & UI**: `Figtree`, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif (**from prototype**)
  - Weights: `400` (Regular), `500` (Medium), `600` (SemiBold)
  - Line Heights: `1.55` (Body)

---

## 2. Token Registry & Strict Provenance

Every token is strictly classified as either **site-verified** (confirmed from `ikaaiindia.in`), **from prototype** (confirmed from `Ikaai Academy – Learning Portal Prototype.html`), or **derived** (calculated for accessibility/dark-mode completeness).

| Token Name | CSS Variable | Light Mode | Dark Mode | Provenance Status | Source & Verification Notes |
|:---|:---|:---|:---|:---:|:---|
| **Primary Brand** | `--color-primary` | `#00511E` | `#58C47F` | **site-verified** (Light) / **from prototype** (Dark) | `<meta name="theme-color" content="#00511e">` on `ikaaiindia.in`; dark mode `--g: #58c47f` in prototype |
| **On Primary** | `--color-on-primary` | `#FFFFFF` | `#08170D` | **from prototype** | Light `--on: #fff`; Dark `--on: #08170d` |
| **Primary Hover** | `--color-primary-hover` | `#003D16` | `#48B06F` | **derived** | 15% darkened brand green; Dark hover keeps `#08170D` dark text (6.78:1) |
| **Primary Tint** | `--color-primary-tint` | `#E1EFE4` | `#173223` | **from prototype** | Prototype `--g2: #e1efe4` & dark `--g2: #173223` |
| **Primary Light Border** | `--color-primary-line` | `#C5E2CD` | `#244732` | **derived** | Soft border for active module cards |
| **Page Background** | `--bg-main` | `#F3F7F1` | `#0D1A11` | **from prototype** | Prototype `--bg: #f3f7f1` & dark `--bg: #0d1a11` |
| **Card Surface** | `--bg-card` | `#FFFFFF` | `#142319` | **from prototype** | Prototype `--card: #fff` & dark `--card: #142319` |
| **Text Ink** | `--text-ink` | `#12261A` | `#E8F1EA` | **from prototype** | Prototype `--ink: #12261a` & dark `--ink: #e8f1ea` |
| **Text Muted** | `--text-muted` | `#5D7164` | `#9BB0A1` | **from prototype** | Prototype `--mut: #5d7164` & dark `--mut: #9bb0a1` |
| **Divider Line** | `--border-line` | `#DCE5D9` | `#24372B` | **from prototype** | Prototype `--line: #dce5d9` & dark `--line: #24372b` |
| **Success Icon Only**| `--color-success-icon`| `#1F9D4D` | `#34D399` | **from prototype** | Prototype `--ok: #1f9d4d`. Strictly for icons/borders (>=3:1). **Forbidden for body text**. |
| **Solid Success Fill**| `--color-success-fill`| `#15803D` | `#16A34A` | **derived** | Solid success fills: `#15803D` with `#FFFFFF` text (5.02:1) in light; `#16A34A` with `#052E16` text (4.52:1) in dark. |
| **On Success** | `--color-on-success` | `#FFFFFF` | `#052E16` | **derived** | Accessible text on solid success backgrounds. |
| **Warning / Amber** | `--color-warning` | `#B45309` | `#FBBF24` | **derived** | Light `#B45309` on white (5.02:1); Dark `#FBBF24` with `#2D1900` text (10.06:1). |
| **On Warning** | `--color-on-warning` | `#FFFFFF` | `#2D1900` | **derived** | Accessible contrast text on warning badges. |
| **Info Text** | `--color-info` | `#0C5A69` | `#38BDF8` | **derived** | Light `#0C5A69` on `#E6FCF5` (7.31:1); Dark `#38BDF8` on `#082F49` (6.48:1). |
| **Info Background** | `--color-info-bg` | `#E6FCF5` | `#082F49` | **derived** | Informational badge and callout surfaces. |
| **Card Radius** | `--radius-card` | `14px` | `14px` | **from prototype** | Prototype `--r: 14px`. |
| **Element Radius** | `--radius-element` | `10px`–`12px` | `10px`–`12px`| **site-verified** | Matches `rounded-xl` (12px) in website CSS & prototype inputs. |
| **Pill Radius** | `--radius-pill` | `9999px` | `9999px` | **site-verified** | Matches `rounded-full` in website CSS & prototype `.pill`. |
| **Shadow Card** | `--shadow-card` | `0 4px 20px rgba(0,0,0,0.03)` | `none` | **site-verified** | Extracted from `ikaaiindia.in` stylesheet. |
| **Shadow Float** | `--shadow-float` | `0 4px 12px rgba(0,0,0,0.15)` | `0 4px 16px rgba(0,0,0,0.4)` | **site-verified** | Extracted from `ikaaiindia.in` stylesheet. |
| **Icon Set** | Material Symbols Outlined | 20px / 24px | 20px / 24px | **site-verified** | Loaded on `ikaaiindia.in` via Google Fonts stylesheet link. |

---

## 3. Programmatically Calculated Contrast Audit

Contrast ratios were calculated using standard W3C relative luminance formulae via Python.

### Raw Script Output

```
=== CORE TOKENS CONTRAST AUDIT ===
Primary Ink #12261A on Page Bg #F3F7F1: 14.71:1
Primary Ink #12261A on Card Surface #FFFFFF: 15.93:1
Muted Text #5D7164 on Card Surface #FFFFFF: 5.23:1
Muted Text #5D7164 on Page Bg #F3F7F1: 4.83:1
Brand Green #00511E on Card Surface #FFFFFF: 9.56:1
Brand Green #00511E on Primary Tint #E1EFE4: 8.05:1
On-Primary #FFFFFF on Brand Green #00511E: 9.56:1
Success Icon #1F9D4D on Card Surface #FFFFFF: 3.51:1
Solid Success Fill #15803D on On-Success #FFFFFF: 5.02:1
Dark Success Fill #16A34A on Dark On-Success #052E16: 4.52:1
Dark Success Fill #16A34A on White #FFFFFF: 3.30:1
Light Warning #B45309 on Card Surface #FFFFFF: 5.02:1
Dark Warning #FBBF24 on Dark On-Warning #2D1900: 10.06:1
Light Info Text #0C5A69 on Light Info Bg #E6FCF5: 7.31:1
Dark Info Text #38BDF8 on Dark Info Bg #082F49: 6.48:1
Dark Ink #E8F1EA on Dark Bg #0D1A11: 15.52:1
Dark Ink #E8F1EA on Dark Card #142319: 14.17:1
Dark Muted #9BB0A1 on Dark Card #142319: 7.10:1
Dark Brand #58C47F on Dark Card #142319: 7.49:1
Dark On-Primary #08170D on Dark Brand #58C47F: 8.45:1
Dark On-Primary #08170D on Dark Brand Hover #48B06F: 6.78:1

=== LIGHT DEPARTMENT TABLE CONTRAST ===
HR Light (#5B21B6 on #F5F3FF): 8.19:1
Data Analyst Light (#0C5A69 on #E6FCF5): 7.31:1
Research Light (#003D16 on #E1EFE4): 10.52:1
Field Operations Light (#78350F on #FEF3C7): 8.15:1
Design Light (#831843 on #FDF2F8): 8.84:1
Social Media Light (#7C2D12 on #FFF7ED): 8.83:1
Business Development Light (#0369A1 on #F0F9FF): 5.57:1
Content Writing Light (#312E81 on #EEF2FF): 10.22:1

=== DARK DEPARTMENT TABLE CONTRAST ===
HR Dark (#DDD6FE on #2E1065): 10.97:1
Data Analyst Dark (#A5F3FC on #083344): 10.74:1
Research Dark (#86EFAC on #052E16): 10.62:1
Field Operations Dark (#FDE68A on #451A03): 12.03:1
Design Dark (#FBCFE8 on #500724): 10.88:1
Social Media Dark (#FED7AA on #431407): 11.56:1
Business Development Dark (#BAE6FD on #082F49): 10.46:1
Content Writing Dark (#C7D2FE on #1E1B4B): 10.72:1
```

---

## 4. Programme Department Contrast Palette (Programmatically Audited)

Every department color combination meets or exceeds WCAG 2.1 AA minimum contrast of **4.5:1** for regular text:

| Programme | Dot / Border | Light Badge Bg | Light Badge Text (AA >= 4.5:1) | Light Ratio | Dark Badge Bg | Dark Badge Text (AA >= 4.5:1) | Dark Ratio |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **HR** | `#7C3AED` | `#F5F3FF` | `#5B21B6` | **8.19 : 1** | `#2E1065` | `#DDD6FE` | **10.97 : 1** |
| **Data Analyst** | `#0B7285` | `#E6FCF5` | `#0C5A69` | **7.31 : 1** | `#083344` | `#A5F3FC` | **10.74 : 1** |
| **Research** | `#00511E` | `#E1EFE4` | `#003D16` | **10.52 : 1** | `#052E16` | `#86EFAC` | **10.62 : 1** |
| **Field Operations** | `#B45309` | `#FEF3C7` | `#78350F` | **8.15 : 1** | `#451A03` | `#FDE68A` | **12.03 : 1** |
| **Design** | `#BE185D` | `#FDF2F8` | `#831843` | **8.84 : 1** | `#500724` | `#FBCFE8` | **10.88 : 1** |
| **Social Media** | `#C2410C` | `#FFF7ED` | `#7C2D12` | **8.83 : 1** | `#431407` | `#FED7AA` | **11.56 : 1** |
| **Business Development**| `#0284C7` | `#F0F9FF` | `#0369A1` | **5.57 : 1** | `#082F49` | `#BAE6FD` | **10.46 : 1** |
| **Content Writing** | `#4338CA` | `#EEF2FF` | `#312E81` | **10.22 : 1** | `#1E1B4B` | `#C7D2FE` | **10.72 : 1** |

---

## 5. UI Application Rules

1. **Success Green Usage**: Never apply `#1F9D4D` to body text (3.51:1 fails text threshold). Use `#1F9D4D` strictly for icons and borders (>= 3:1 graphical elements). For solid button/pill backgrounds with white text, use **`#15803D`** (5.02:1 meets WCAG AA). In dark mode, use **`#16A34A`** with dark text `#052E16` (4.52:1 meets WCAG AA).
2. **Dark-Mode Button Hover**: In dark mode, primary interactive buttons keep dark text (`#08170D`) across both default state (`#58C47F`, 8.45:1) and hover state (`#48B06F`, 6.78:1), ensuring consistent high contrast.
3. **Typography**: Always use `font-heading` (`Bricolage Grotesque`) for headings and `font-sans` (`Figtree`) for interface copy and longform content.
