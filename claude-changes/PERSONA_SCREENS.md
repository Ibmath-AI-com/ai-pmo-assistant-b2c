# Persona Management — Claude Code Implementation Spec

## Overview

Implement the full **Personas** section of the AI PMO & Strategy Assistant application. This covers two main areas:

1. **Persona Management** — list/search/filter screen with action menu
2. **Create New Persona** — 4-step wizard (Basic Information → AI Behavior → Knowledge Base → Extra Settings)

Do **not** touch the top navigation bar — it already exists in the project. Slot the persona content below it.

---

## Design System Reference

Match the existing application's visual style precisely:

| Token | Value |
|---|---|
| Primary blue | `#1E3A8A` (dark navy) |
| Accent blue | `#2563EB` |
| Bright cyan/teal | `#06B6D4` or `#0EA5E9` (used for active tab underline, toggle, search button) |
| Background page | `#F8FAFC` (very light grey-white) |
| Card/panel bg | `#FFFFFF` |
| Table row alt | `#F0F4FF` (light lavender-blue tint) |
| Border | `#E2E8F0` |
| Text primary | `#1E293B` |
| Text secondary | `#64748B` |
| Text placeholder | `#94A3B8` |
| Badge RAG bg | `#EFF6FF`, icon fill `#2563EB` |
| Badge ILLM bg | `#EFF6FF`, icon fill `#2563EB` |
| Badge XLLM bg | `#FEF2F2`, icon fill `#DC2626` (X mark) |
| Active step pill | `#2563EB` background, white text |
| Inactive step pill | `#E2E8F0` background, `#94A3B8` text |
| Font | System sans-serif stack: `Inter, -apple-system, BlinkMacSystemFont, sans-serif` |
| Border radius inputs | `6px` |
| Border radius cards | `8px` |
| Border radius buttons | `6px` |

---

## Route Structure

Add these routes inside your existing router (do NOT create a new router):

```
/personas                    → PersonaManagement (list screen)
/personas/new                → CreatePersona (wizard, starts at step 1)
/personas/:id/view           → PersonaDetail (read-only view — same layout as Create but disabled)
/personas/:id/edit           → CreatePersona (wizard pre-populated)
```

---

## Screen 1 — Persona Management (List)

**File:** `src/pages/personas/PersonaManagement.tsx` (or `.jsx`)

### Layout

```
<PageTitle>Personas Management</PageTitle>

<FilterBar>            ← 2 rows of filter dropdowns + Search button
<ResultsHeader>        ← spacer left | "Add New Persona +" link right
<PersonaList>          ← repeating PersonaCard rows
```

### Filter Bar

Two rows, each containing 4 equal-width dropdowns. All dropdowns are outlined style (white bg, `#E2E8F0` border, `#94A3B8` placeholder text, chevron icon right).

**Row 1 dropdowns:**
- Document Title (free-text input, not dropdown)
- Document Type
- Document Collection
- Classification Level

**Row 2 dropdowns:**
- SDLC
- Domain
- Persona Relevance
- Status

Below the two rows, left-aligned: a solid **Search** button (`bg: #0EA5E9` or bright teal-blue, white text, `px-6 py-2`, rounded `6px`).

### Results Header

```
<div style="display:flex; justify-content:space-between; align-items:center; margin: 16px 0 8px;">
  <span />   {/* empty left */}
  <a href="/personas/new" style="color:#2563EB; font-weight:500; display:flex; align-items:center; gap:6px;">
    Add New Persona
    <PlusCircleIcon />   {/* filled teal/blue circle with + */}
  </a>
</div>
```

### Persona Card (repeating row)

Each persona is a white card with a light border and subtle bottom shadow. On hover: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`.

```
┌─────────────────────────────────────────────────────────────────┐
│  [Avatar]   Persona Name (bold)           [RAG✓] [ILLM✓] [XLLM✗]   [•••]  │
│             Persona Name | Persona Role Title | Persona Category            │
└─────────────────────────────────────────────────────────────────┘
```

**Avatar:** 56×56px circle. Contains an AI/network icon (use a SVG of interconnected nodes or a brain-circuit icon). Background is a light blue gradient (`#EFF6FF` to `#DBEAFE`). Border: `2px solid #BFDBFE`.

**Name:** `font-size: 15px; font-weight: 600; color: #1E293B`

**Subtitle row:** `font-size: 13px; color: #64748B` — pipe-separated: `Persona Name | Persona Role Title | Persona Category`

**Capability badges (RAG, ILLM, XLLM):**

Each badge is a rounded pill/box ~60×52px, white background, `border: 1.5px solid #BFDBFE`, `border-radius: 10px`. Layout:

```
┌──────────┐
│  [icon]  │   ← checkmark circle (blue fill) OR X circle (red fill), 22×22px
│   RAG    │   ← label, 11px, #64748B, centered
└──────────┘
```

- RAG: blue checkmark circle icon (`#2563EB`), label "RAG"
- ILLM: blue checkmark circle icon (`#2563EB`), label "ILLM"  
- XLLM: red X circle icon (`#DC2626`), label "XLLM"

**Three-dot menu (`•••`):**

Clicking the `•••` button opens a small dropdown popover aligned to the right:

```
┌──────────┐
│  View    │
│  Edit    │
│  Download│
│  Delete  │
└──────────┘
```

Popover style: white bg, `border: 1px solid #E2E8F0`, `border-radius: 8px`, `box-shadow: 0 4px 12px rgba(0,0,0,0.12)`, `padding: 4px 0`. Each item: `padding: 7px 16px`, `font-size: 13px`, `color: #374151`, hover bg `#F1F5F9`. Delete item: `color: #EF4444`.

Menu actions:
- **View** → navigate to `/personas/:id/view`
- **Edit** → navigate to `/personas/:id/edit`
- **Download** → trigger JSON/PDF download of persona config
- **Delete** → show confirmation modal before deleting

Only one popover open at a time. Clicking anywhere outside closes it.

### State Management

```typescript
interface Persona {
  id: string
  name: string
  roleTitle: string
  category: string
  avatar?: string
  capabilities: {
    rag: boolean
    illm: boolean
    xllm: boolean
  }
}
```

Use local state or your existing state management. Seed with 3 mock personas for display.

---

## Screen 2 — Create New Persona (4-Step Wizard)

**File:** `src/pages/personas/CreatePersona.tsx`

### Wizard Shell

```
<PageTitle>Create New Persona</PageTitle>

<StepIndicator steps={4} currentStep={step} />

<WizardCard>
  {step === 1 && <Step1BasicInfo />}
  {step === 2 && <Step2AIBehavior />}
  {step === 3 && <Step3KnowledgeBase />}
  {step === 4 && <Step4ExtraSettings />}
</WizardCard>
```

### Step Indicator Bar

Horizontal row of 4 pills connected by a thin line. Render as:

```
[1. Basic Information] ——— [2. AI Behavior] ——— [3. Knowledge Base] ——— [4. Extra Settings]
```

**Active step pill:** `background: #2563EB`, white text, `font-weight: 600`, `border-radius: 20px`, `padding: 8px 20px`, `font-size: 13px`.

**Completed step pill:** same shape but `background: #E2E8F0`, `color: #94A3B8`, text same as label.

**Upcoming step pill:** same as completed.

**Connector line:** `height: 1px; background: #CBD5E1; flex: 1; margin: 0 4px`.

### Wizard Card

White card wrapping the step content:
```css
background: #FFFFFF;
border: 1.5px solid #BFDBFE;
border-radius: 10px;
padding: 32px;
margin-top: 20px;
```

Section title inside each card (e.g. "Knowledge base Basic Information"):
```css
font-size: 14px;
font-weight: 600;
color: #2563EB;
margin-bottom: 20px;
```

---

### Step 1 — Basic Information

**Section label:** "Knowledge base Basic Information"

Fields (all full-width, stacked vertically, `gap: 14px`):

| Field | Type | Placeholder |
|---|---|---|
| Persona Name | Text input | "Persona Name" |
| Persona Role Title | Text input | "Persona Role Title (formal role description)" |
| Persona Category | Dropdown | "Persona Category (PMO / Strategy / Risk / Portfolio / Custom)" |
| Persona Short Description | Textarea, ~4 rows | "Persona Short Description" |
| Avatar | File input row | Text field showing path + "Browse" button (outlined, `#2563EB` border, blue text) |

**Input style** (applies to all steps):
```css
width: 100%;
height: 40px;           /* 52px for textarea min-height */
border: 1px solid #E2E8F0;
border-radius: 6px;
padding: 0 12px;
font-size: 14px;
color: #1E293B;
background: #FFFFFF;
outline: none;

&:focus {
  border-color: #93C5FD;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}

&::placeholder {
  color: #94A3B8;
}
```

**Navigation buttons** (bottom-right of card, all steps):
- "Back" button: outlined, `border: 1px solid #E2E8F0`, `color: #374151`, white bg. Hidden on step 1.
- "Next" button: solid `background: #1E3A8A` (dark navy), white text, `border-radius: 6px`, `padding: 10px 28px`. On step 4 this becomes "Submit".

---

### Step 2 — AI Behavior

**Section label:** "Personal AI behavior"

Fields:

| Field | Type | Placeholder / Options |
|---|---|---|
| System Instruction | Textarea, ~3 rows | "System instruction (Defines persona expertise, tone, constraints)" |
| Tone of Voice | Dropdown | "Tone of voice (Executive / Analytical / Advisory / Formal)" — options: Executive, Analytical, Advisory, Formal |
| Response Format Preferences | Dropdown | "Response Format Preferences (Structured Report / Bullet Points / Narrative)" — options: Structured Report, Bullet Points, Narrative |
| RAG and LLM Usage | Dropdown (left, ~45% width) + conditional second dropdown (right, ~50% width) | See below |

**RAG and LLM Usage — two-column row:**

Left dropdown "RAG and LLM usage" — when clicked shows a custom dropdown list with these exact options (rendered as a listbox, not a native select, to match the screenshot's open-dropdown appearance):

```
• Use RAG Only
• Use RAG & Internal LLM
• Use RAG, Internal LLM and External LLM
• Use RAG & External LLM
• Use Internal LLM Only
• Use Internal and External LLM Only
• Use External LLM Only
```

Right dropdown: "Select RAG / LLM based on your selection" — this dropdown's options populate dynamically based on the left selection:
- If RAG selected → show available knowledge bases
- If Internal LLM → show internal model options  
- If External LLM → show external model options (GPT-4, Claude, Gemini, etc.)

---

### Step 3 — Knowledge Base

**Section label:** "Knowledge base settings"

Fields:

| Field | Type | Placeholder / Options |
|---|---|---|
| Allowed Knowledge Base | Multi-select dropdown | "Allowed Knowledge base" |
| Allowed LLMs | Multi-select dropdown | "Allowed LLMs" |
| SDLC Applicability | Dropdown | "SDLC Applicability" — options: Initiation, Planning, Execution, Monitoring, Closure, All Phases |
| Domain Tags | Multi-select dropdown | "Domain Tags (Risk / Governance / KPI / Benefits / Portfolio / Change Management / Strategy Execution / KPIs / Strategy Planning)" |
| Retrieval Depth Level | Dropdown | "Retrieval Depth Level (Conservative / Standard / Deep Retrieval)" — options: Conservative, Standard, Deep Retrieval |

---

### Step 4 — Extra Settings

**Section label:** "Persona Extra Settings"

Fields:

| Field | Type | Placeholder / Options |
|---|---|---|
| Data Classification Limit | Dropdown | "Data Classification Limit (Public / Internal / Confidential / Restricted)" — options: Public, Internal, Confidential, Restricted |
| Access Level | Multi-select dropdown | "Access Level (Select roles who can access this persona)" |
| Hallucination Guard Mode | Toggle switch | Label left "• Hallucination Guard Mode", toggle right — **default ON** (blue/teal toggle) |

**Toggle switch style:**
```css
/* ON state */
.toggle-track {
  width: 44px; height: 24px;
  background: #06B6D4;   /* cyan/teal */
  border-radius: 12px;
}
.toggle-thumb {
  width: 20px; height: 20px;
  background: white;
  border-radius: 50%;
  transform: translateX(22px);
}

/* OFF state */
.toggle-track { background: #CBD5E1; }
.toggle-thumb { transform: translateX(2px); }
```

**Submit button** (step 4 only): Same style as "Next" but label is "Submit". On click: validate all 4 steps, POST to your API, show success toast, redirect to `/personas`.

---

## Shared Components to Create

### `DropdownSelect` component

A reusable styled dropdown that wraps a native `<select>` or implements a custom listbox. Props:

```typescript
interface DropdownSelectProps {
  placeholder: string
  options: { label: string; value: string }[]
  value: string | string[]
  onChange: (val: string | string[]) => void
  multiple?: boolean
  width?: string
}
```

Style: matches input style above. Right side: chevron-down SVG icon (`#94A3B8`). When open: options list has white bg, `border: 1px solid #BFDBFE`, `border-radius: 6px`, `box-shadow: 0 4px 12px rgba(0,0,0,0.1)`, max-height `220px`, overflow-y scroll.

### `WizardNav` component

Bottom navigation row for wizard cards:

```typescript
interface WizardNavProps {
  step: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  onSubmit?: () => void
}
```

---

## Form State (Wizard)

Use a single form state object held in the parent `CreatePersona` component and passed down as props. On "Next", validate the current step's required fields before advancing. Show inline error messages below invalid fields (`color: #EF4444`, `font-size: 12px`).

```typescript
interface PersonaFormState {
  // Step 1
  name: string
  roleTitle: string
  category: string
  shortDescription: string
  avatar: File | null

  // Step 2
  systemInstruction: string
  toneOfVoice: string
  responseFormat: string
  ragLlmUsage: string
  ragLlmSelection: string

  // Step 3
  allowedKnowledgeBases: string[]
  allowedLlms: string[]
  sdlcApplicability: string
  domainTags: string[]
  retrievalDepthLevel: string

  // Step 4
  dataClassificationLimit: string
  accessLevel: string[]
  hallucinationGuardMode: boolean
}
```

---

## File Structure to Create

```
src/
└── pages/
    └── personas/
        ├── PersonaManagement.tsx     ← Screen 1
        ├── CreatePersona.tsx         ← Screen 2 (wizard shell)
        ├── components/
        │   ├── PersonaCard.tsx       ← Single persona row card
        │   ├── PersonaFilterBar.tsx  ← Filter dropdowns + search
        │   ├── StepIndicator.tsx     ← Wizard step pills
        │   ├── WizardNav.tsx         ← Back / Next / Submit buttons
        │   ├── DropdownSelect.tsx    ← Reusable styled dropdown
        │   ├── ToggleSwitch.tsx      ← Hallucination guard toggle
        │   └── steps/
        │       ├── Step1BasicInfo.tsx
        │       ├── Step2AIBehavior.tsx
        │       ├── Step3KnowledgeBase.tsx
        │       └── Step4ExtraSettings.tsx
```

---

## Exact Visual Measurements

| Element | Value |
|---|---|
| Page horizontal padding | `32px` each side |
| Page title font size | `20px`, `font-weight: 700`, `color: #1E293B` |
| Filter row gap | `12px` between dropdowns |
| Filter bar bottom margin | `16px` |
| Persona card padding | `16px 20px` |
| Persona card margin-bottom | `8px` |
| Persona card border | `1px solid #E2E8F0` |
| Persona card border-radius | `8px` |
| Avatar size | `56px × 56px` |
| Gap between avatar and text | `16px` |
| Gap between text and badges | `auto` (flex push) |
| Badge width × height | `62px × 52px` |
| Gap between badges | `8px` |
| Three-dot button size | `32px × 32px`, `border-radius: 50%`, hover bg `#F1F5F9` |
| Wizard card min-height | `380px` |
| Step label font size | `13px` |
| Step pill padding | `8px 18px` |
| Input height | `40px` |
| Textarea min-height | `90px` |
| Button height | `40px` |
| Section label margin-bottom | `20px` |

---

## Behaviour Notes

1. **Filter search**: clicking "Search" filters the persona list client-side by matching document title substring (case-insensitive) and any selected dropdown values. Show "No results found" empty state if nothing matches.

2. **Add New Persona link**: teal/blue colour `#2563EB`, underline on hover, `+` icon is a filled circle with white plus inside (`bg: #06B6D4`, 20×20px).

3. **Wizard step validation**: only advance on "Next" if all required fields in the current step are filled. Required fields: Step 1 — name, roleTitle, category; Step 2 — systemInstruction, ragLlmUsage; Step 3 — none required (optional); Step 4 — dataClassificationLimit.

4. **Persona avatar fallback**: if no avatar uploaded, render the AI network SVG icon on a `#EFF6FF` background circle.

5. **Responsive**: minimum supported width `1024px`. The layout does not need to be mobile responsive — this is a desktop admin tool.

6. **Mock data**: seed 3 persona records so the list is never empty during development. Use realistic PMO persona names e.g. "PMO Director Persona", "Risk Analyst Persona", "Strategy Advisor Persona".

7. **Toast notifications**: on successful Create/Edit show a green success toast bottom-right: "Persona created successfully". On Delete show a red destructive toast: "Persona deleted".

8. **Confirmation modal for Delete**: simple modal with "Are you sure you want to delete this persona? This action cannot be undone." with Cancel (outlined) and Delete (red solid) buttons.
