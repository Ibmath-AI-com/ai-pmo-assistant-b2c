# UI Design System — AI PMO & Strategy Assistant

Apply this design system to ALL pages and components in the project. This is the single source of truth for colors, typography, spacing, and component styles.

## Colors

### Primary Palette
- **Navy 900:** `#0F172A` — navbar background, dark surfaces
- **Navy 800:** `#1E293B` — sidebar hover states, secondary dark
- **Navy 700:** `#2D3A4F` — borders on dark surfaces

### Accent Colors
- **Blue 600:** `#1D4ED8` — gradient start for section headers
- **Blue 500:** `#3B82F6` — links, active states, primary buttons
- **Blue 400:** `#60A5FA` — donut chart progress, light accents
- **Cyan 500:** `#06B6D4` — Chat Mode header, teal accents
- **Cyan 400:** `#0891B2` — gradient end for cyan sections
- **Indigo 500:** `#6366F1` — send button

### Backgrounds
- **Body:** `#F1F5F9`
- **Chat area:** `#F8FAFC`
- **Cards / sidebars:** `#FFFFFF`
- **Input fields:** `#FFFFFF`
- **Hover on list items:** `#F8FAFC`
- **Alternating rows:** `#FAFBFC`

### Text
- **Primary:** `#111827`
- **Secondary:** `#6B7280`
- **Muted / placeholder:** `#9CA3AF`
- **Links:** `#3B82F6`
- **On dark backgrounds:** `#FFFFFF`

### Borders
- **Default:** `#E5E7EB`
- **Light dividers:** `#F3F4F6`
- **Input focus ring:** `#3B82F6`

### Status / Semantic
- **Red (high risk, errors):** `#EF4444`
- **Amber (medium risk, warnings):** `#FBBF24`
- **Green (success, active):** `#22C55E`

### Notification Badges
- **Red badge:** `#EF4444` with white text
- **Green badge:** `#22C55E` with white text

## Gradients

Use these exact gradients for section headers and special surfaces:

```css
/* Sidebar section headers (Personas, Ready Prompts, Recent Chats, Knowledge Hub) */
background: linear-gradient(135deg, #1E40AF, #1E293B);

/* Chat title header bar */
background: linear-gradient(135deg, #1E3A5F, #2D4A7A);

/* Chat Mode section header */
background: linear-gradient(135deg, #06B6D4, #0891B2);

/* Navbar */
background: #0F172A; /* solid, no gradient */
```

## Typography

Font family: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Navbar brand | 16px | 700 | white |
| Nav links | 14px | 500 | white |
| Section header text (in gradient bars) | 14px | 600 | white |
| Sidebar list items | 13px | 400 | #374151 |
| Chat messages | 14px | 400 | #374151 |
| Report card title | 15px | 700 | #111827 |
| Report card body text | 13px | 400 | #6B7280 |
| Small labels / metadata | 11px | 400 | #9CA3AF |
| Input placeholder | 14px | 400 | #9CA3AF |
| Buttons | 14px | 500 | white |
| "View more" links | 12px | 500 | #3B82F6 |

## Spacing

| Element | Value |
|---------|-------|
| Navbar height | 56px |
| Left sidebar width | 240px |
| Right sidebar width | 280px |
| Section header padding | 10px 16px |
| List item padding | 8px 16px |
| Card padding | 16px |
| Card internal gap | 12px |
| Chat message gap | 16px |
| Input bar height | 60px |

## Border Radius

| Element | Value |
|---------|-------|
| Cards | 12px |
| Buttons | 8px |
| Input fields | 8px |
| Avatars | 50% (circle) |
| Section headers | 8px 8px 0 0 (top corners only) |
| Dropdown / popups | 8px |
| Notification badges | 50% (pill) |
| Risk dots | 50% (circle, 8px diameter) |

## Shadows

```css
/* Cards */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

/* Popups / dropdowns */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

/* Hover on cards */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
```

## Component Styles

### Navbar
- Background: `#0F172A` solid
- Height: 56px, full width, fixed top
- Logo: left side, geometric hexagonal icon (blue/cyan) + white bold text
- Nav links: center, white, 14px, active link has white bottom border (2px)
- Right: bell icon with red badge, message icon with green badge, avatar circle + "Welcome, Name" + chevron

### Sidebar Section Headers
- Background: `linear-gradient(135deg, #1E40AF, #1E293B)`
- Text: white, 14px, bold
- Padding: 10px 16px
- Border radius: 8px 8px 0 0
- Right side: "+" icon or other action icon in white
- Used for: Personas, Ready Prompts, Recent Chats, Knowledge Hub

### List Items (sidebar)
- Padding: 8px 16px
- Border bottom: 1px solid #F3F4F6
- Icon (left, 16px, gray) + text (13px, #374151)
- Hover: background #F8FAFC
- Cursor: pointer

### Chat Message Bubble (user)
- Avatar: 36px circle, left side
- Bubble: light gray background (#F1F5F9), rounded 12px, padding 12px 16px
- Text: 14px, #374151

### Chat Message Bubble (AI — report card)
- Avatar: 36px AI hexagonal logo, left side
- Card: white background, border 1px solid #E5E7EB, rounded 12px, padding 20px
- Shadow: 0 1px 3px rgba(0,0,0,0.08)

### Donut Chart
- Size: 140px x 140px
- Background ring: `#111827` (dark)
- Progress ring: `#60A5FA` (blue)
- Stroke width: ~20px
- Center text: white, bold, 24px
- Rounded stroke caps

### Input Bar
- White background, border-top: 1px solid #E5E7EB
- "+" button: 36px circle, gray border, hover blue
- Text input: no border, flex-grow, 14px, placeholder #9CA3AF
- Emoji button: gray icon, hover blue
- Send button: `#6366F1` indigo, triangle/arrow icon, hover slight scale

### Buttons
- Primary: `#3B82F6` background, white text, rounded 8px, padding 8px 16px
- Secondary: white background, #E5E7EB border, #374151 text, rounded 8px
- Danger: `#EF4444` background, white text
- Ghost: transparent, #3B82F6 text, hover #EFF6FF background

### Tables (for admin pages)
- Header row: `#1E293B` background, white text, 13px bold
- Body rows: white, alternating #FAFBFC
- Border: 1px solid #E5E7EB
- Cell padding: 10px 16px
- Rounded top corners on header: 8px

### Form Inputs
- Background: white
- Border: 1px solid #E5E7EB
- Border radius: 8px
- Padding: 10px 14px
- Focus: border-color #3B82F6, ring 2px #3B82F620
- Placeholder: #9CA3AF
- Label: 13px, #374151, margin-bottom 4px

### Dropdown / Select
- Same as input styling
- Chevron icon right side, #9CA3AF
- Dropdown menu: white, shadow, rounded 8px, border #E5E7EB

### Wizard Step Indicators (for persona/KB creation)
- Active step: `#1D4ED8` blue background, white text, rounded 8px
- Inactive step: #F1F5F9 background, #6B7280 text
- Step text: 14px, font-weight 500

### Package/Pricing Cards
- Regular: white background, border #E5E7EB, rounded 16px
- Featured (Pro): `#0F172A` dark navy background, white text, blue CTA button
- Price: 36px bold
- CTA button: rounded 24px (pill shape)
