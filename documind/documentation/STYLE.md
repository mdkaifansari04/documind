# Style Guide

A reference for every micro-detail used across the Poof UI. Copy-paste friendly for use in other dark-mode SaaS projects.

---

## 1. Color System

### Brand palette (CSS custom properties)

```css
--poof-base: #0d0d0d; /* Page background */
--poof-violet: #c8b8ff; /* Primary highlight, links, badges */
--poof-accent: #7c5cfc; /* CTA, ring focus */
--poof-peach: #ffcba4; /* Warnings, expiring states */
--poof-mint: #b6f0d8; /* Success accents */
--poof-mist: #a0a0a0; /* Secondary text, muted labels */
```

### Surface colors (exact values used)

| Token                 | Value              | Usage                                       |
| --------------------- | ------------------ | ------------------------------------------- |
| Page bg               | `#0d0d0d`          | `bg-background` / `bg-poof-base`            |
| Card bg               | `#111` / `#111111` | `bg-[#111]` — cards, containers, feed rows  |
| Card bg hover         | `#151515`          | `hover:bg-[#151515]` — card hover lift      |
| Row bg                | `#141414`          | `bg-[#141414]` — table/list row background  |
| Row bg hover          | `white/4`          | `hover:bg-white/4` — row hover              |
| Popover / dropdown bg | `#1a1a1a`          | `bg-[#1a1a1a]` — DropdownMenuContent        |
| Outer container bg    | `bg-black`         | Wrapping table/list section                 |
| Skeleton              | `white/3`          | `bg-white/3` — loading placeholders         |
| Transparent fill      | `white/2`          | `bg-white/2` — segmented controls container |
| Tab selected fill     | `white/8`          | `bg-white/8` — active segmented pill        |

### Border colors

```
border-white/6    — default card & container border
border-white/8    — dropdown menu border
border-white/10   — dashed badge border, revealed-key banner
border-white/12   — card hover state border
border-white/4    — inner row dividers (feed separators)
border-poof-violet/20 — selection bar border
border-poof-violet/30 — selected card ring
```

---

## 2. Typography

### Font stacks

```css
--font-sans: "DM Sans", system-ui, sans-serif; /* Body, UI, everything */
--font-mono: "DM Mono", monospace; /* URLs, keys, code */
```

> `font-heading` / Syne is deprecated. **Do not use `font-heading`** on new pages. All titles use `font-sans`.

### Type scale (exact classes used)

| Size        | Class         | Where                                                        |
| ----------- | ------------- | ------------------------------------------------------------ |
| 9px         | `text-[9px]`  | Uppercase dashed status badges in feeds                      |
| 10px        | `text-[10px]` | Dashed pill badges, type chips, micro labels, per-page label |
| 11px        | `text-[11px]` | Table headers, URL monospace, pagination counters, sub-text  |
| xs (12px)   | `text-xs`     | Dropdown items, filter labels, subtitles, section links      |
| sm (14px)   | `text-sm`     | Card titles, section headings, primary body text             |
| base (16px) | `text-base`   | Dialog titles only                                           |
| 2xl         | `text-2xl`    | Dashboard metric values                                      |

### Font weights

```
font-medium     — section headings ("Recent Galleries"), metric labels
font-semibold   — card titles, metric values, gallery name
```

> Never `font-bold`. Never `font-heading font-bold`. Keep weights restrained.

### Text colors

```
text-white                 — primary text (titles, values, selected tabs)
text-white/90              — row primary text (slightly softer in tables)
text-poof-mist             — body secondary text
text-poof-mist/60          — permissions, descriptions
text-poof-mist/50          — segmented tab inactive, dashed badge text, filter labels
text-poof-mist/40          — meta text, URL monospace in feeds, timestamps, icon resting
text-poof-mist/35          — footer timestamps, sub-values
text-poof-mist/30          — search placeholder, 3-dot icon resting, URL secondary
text-white/15 or white/12  — initial letter fallback in empty cover images
```

### Tracking & transform

```
tracking-widest  — metric card labels (uppercase)
tracking-wider   — dashed status badges (uppercase)
uppercase        — metric labels, status badges, table column headers
tabular-nums     — metric values, pagination counters, view counts
```

---

## 3. Segmented Control (Tabs / Filter Pills)

The core pattern used for sort, filter, and status toggles across all pages.

```html
<!-- Container -->
<div
  class="flex items-center gap-0.5 rounded-md border border-white/6 bg-white/2 p-0.5"
>
  <!-- Individual pill -->
  <button
    class="rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors
    {active: 'bg-white/8 text-white'}
    {inactive: 'text-poof-mist/50 hover:text-poof-mist'}"
  >
    Label
  </button>
</div>
```

Key details:

- Container: `rounded-md`, `border-white/6`, `bg-white/2`, `p-0.5`
- Pill: `rounded-[5px]`, `px-2.5 py-1`, `text-[11px] font-medium`
- Active state: `bg-white/8 text-white`
- Inactive state: `text-poof-mist/50 hover:text-poof-mist`
- Gap between pills: `gap-0.5`
- No ring/outline on focus — keep it simple

---

## 4. Search Input

```html
<div class="relative flex-1 max-w-xs">
  <search
    class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-poof-mist/40"
  />
  <input
    class="h-8 rounded-md border-white/6 bg-white/3 pl-8 text-xs text-white placeholder:text-poof-mist/30"
    placeholder="Search..."
  />
</div>
```

Key details:

- Height: `h-8`
- Background: `bg-white/3`
- Border: `border-white/6`
- Text: `text-xs text-white`
- Placeholder: `placeholder:text-poof-mist/30`
- Icon: `h-3.5 w-3.5`, color `text-poof-mist/40`, positioned `left-2.5`
- Left padding for icon clearance: `pl-8`

---

## 5. Table / List Rows

### Container structure

```html
<!-- Outer wrapper -->
<div class="overflow-hidden rounded-lg border border-white/6 bg-black">
  <!-- Column headers -->
  <div
    class="grid grid-cols-[...] items-center gap-2 px-5 py-2.5
    text-[11px] font-medium tracking-wide text-poof-mist/50 uppercase"
  >
    ...
  </div>

  <!-- Rows container (adds padding for rounded inner cards) -->
  <div class="flex flex-col px-1 pb-1.5">
    <!-- Individual row -->
    <div
      class="group grid grid-cols-[...] items-center gap-2
      bg-[#141414] px-4 py-3 transition-colors duration-150 hover:bg-white/4
      {first: 'rounded-t-lg'}
      {last: 'rounded-b-lg'}"
    >
      ...
    </div>
  </div>
</div>
```

Key details:

- Outer container: `rounded-lg border-white/6 bg-black`
- Headers: `px-5 py-2.5`, `text-[11px]`, `uppercase tracking-wide`, `text-poof-mist/50`
- Inner rows padding: `px-1 pb-1.5`
- Row: `bg-[#141414]`, `px-4 py-3`, `hover:bg-white/4`
- First row: `rounded-t-lg`, Last row: `rounded-b-lg`
- Transition: `transition-colors duration-150`
- The `group` class is on the row for hover-reveal of the 3-dot menu

### Feed-style rows (no grid headers, stacked in container)

```html
<div class="overflow-hidden rounded-xl border border-white/6 bg-[#111]">
  <div
    class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/3
    {not-first: 'border-t border-white/4'}"
  >
    ...
  </div>
</div>
```

---

## 6. Dropdown Menu (3-Dot Actions)

### Trigger button

```html
<button
  class="flex h-7 w-7 items-center justify-center rounded-lg
  text-poof-mist/30 opacity-0 transition-all duration-150
  hover:bg-white/6 hover:text-poof-mist
  group-hover:opacity-100 focus-visible:opacity-100"
>
  <MoreHorizontal class="h-4 w-4" strokeWidth="{1.5}" />
</button>
```

- Hidden by default: `opacity-0`
- Shows on row hover: `group-hover:opacity-100`
- Keyboard accessible: `focus-visible:opacity-100`
- Size: `h-7 w-7`
- Icon: `h-4 w-4`, `strokeWidth={1.5}`
- Resting color: `text-poof-mist/30`
- Hover: `hover:bg-white/6 hover:text-poof-mist`

### Dropdown content

```html
<DropdownMenuContent
  align="end"
  class="w-40 rounded-lg border-white/8 bg-[#1a1a1a] p-1"
>
  <DropdownMenuItem class="gap-2 rounded-md px-2.5 py-1.5 text-xs">
    <Icon class="h-3 w-3 text-poof-mist/50" strokeWidth="{1.5}" />
    Label
  </DropdownMenuItem>

  <DropdownMenuSeparator class="my-1 bg-white/6" />

  <!-- Destructive item -->
  <DropdownMenuItem
    variant="destructive"
    class="gap-2 rounded-md px-2.5 py-1.5 text-xs"
  >
    <Trash2 class="h-3 w-3" strokeWidth="{1.5}" />
    Delete
  </DropdownMenuItem>
</DropdownMenuContent>
```

- Width: `w-36` to `w-44` depending on content
- Background: `bg-[#1a1a1a]`
- Border: `border-white/8`
- Padding: `p-1`
- Corner radius: `rounded-lg`
- Item radius: `rounded-md`
- Item padding: `px-2.5 py-1.5`
- Item text: `text-xs`
- Item gap: `gap-2`
- Item icon: `h-3 w-3`, `text-poof-mist/50`, `strokeWidth={1.5}`
- Separator: `my-1 bg-white/6`

---

## 7. Status Indicators

### Dot indicator (inline with text)

```html
<span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
<span class="text-[11px] text-emerald-300/60">Active</span>
```

| State   | Dot color           | Text color            |
| ------- | ------------------- | --------------------- |
| Active  | `bg-emerald-400/70` | `text-emerald-300/60` |
| Revoked | `bg-red-400/70`     | `text-red-300/60`     |
| Expired | `bg-poof-mist/30`   | `text-poof-mist/40`   |

### Dashed-border badge (gallery cards, feed items)

```html
<span
  class="inline-flex items-center gap-1 rounded-md
  border border-dashed border-white/10
  px-2 py-0.5 text-[10px] text-poof-mist/60"
>
  <ImageIcon class="h-2.5 w-2.5" strokeWidth="{1.5}" />
  12 photos
</span>
```

Colored variants:

```
Active link:   border-emerald-400/20  text-emerald-400/70
Expiring:      border-poof-peach/30   text-poof-peach
Feed active:   border-emerald-400/20  text-emerald-400/70
Feed revoked:  border-red-400/20      text-red-400/70
Feed expired:  border-white/10        text-poof-mist/40
```

### Type chip (links page)

```html
<span
  class="inline-block rounded-md px-2 py-0.5 text-[10px] font-medium
  bg-poof-violet/12 text-poof-violet"
>
  Gallery
</span>
```

| Type        | Classes                              |
| ----------- | ------------------------------------ |
| Gallery     | `bg-poof-violet/12 text-poof-violet` |
| Image       | `bg-poof-peach/12 text-poof-peach`   |
| Multi-image | `bg-poof-mint/12 text-poof-mint`     |

### Pulsing dot (dashboard metrics, attention-needed)

```html
<span class="relative flex h-2 w-2">
  <span
    class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 bg-poof-peach"
  />
  <span class="relative inline-flex h-2 w-2 rounded-full bg-poof-peach" />
</span>
```

---

## 8. Cards

### Data card (dashboard metrics)

```html
<div
  class="rounded-xl border border-white/6 bg-[#111] p-4
  transition-colors hover:bg-[#141414]"
>
  <!-- Dot + label -->
  <div class="mb-3 flex items-center gap-2">
    <span class="relative flex h-2 w-2">
      <span class="relative inline-flex h-2 w-2 rounded-full bg-poof-violet" />
    </span>
    <span class="text-[10px] uppercase tracking-widest text-poof-mist/40"
      >Label</span
    >
  </div>
  <!-- Value -->
  <div class="text-2xl font-semibold tabular-nums text-white">42</div>
  <!-- Sub -->
  <p class="mt-1 text-[11px] text-poof-mist/35">Supporting text</p>
</div>
```

### Gallery-style card (with accent bar)

```html
<div
  class="group relative flex flex-col overflow-hidden rounded-xl
  border border-white/6 bg-[#111]
  transition-all duration-200 hover:border-white/12 hover:bg-[#151515]"
>
  <!-- 3px accent gradient bar -->
  <div class="h-0.75 w-full bg-linear-to-r from-violet-500 to-indigo-600" />

  <!-- Cover image area -->
  <div
    class="relative mx-4 mt-4 mb-3 aspect-video overflow-hidden rounded-lg bg-black/40"
  >
    <img
      class="h-full w-full object-cover transition-transform duration-300
      group-hover:scale-105"
    />
  </div>

  <!-- Body -->
  <div class="px-4 pb-4">
    <h3 class="truncate text-sm font-semibold text-white">Title</h3>
    <!-- Dashed badges here -->
    <p class="mt-auto pt-3 text-[11px] text-poof-mist/35">Updated 3d ago</p>
  </div>
</div>
```

Accent bar gradients (deterministic from name hash):

```
from-violet-500 to-indigo-600
from-cyan-400 to-blue-500
from-amber-400 to-orange-500
from-emerald-400 to-teal-500
from-rose-400 to-pink-500
from-fuchsia-400 to-purple-500
from-sky-400 to-blue-500
from-lime-400 to-emerald-500
```

### Empty cover fallback (initial letters)

```html
<div
  class="flex h-full w-full items-center justify-center bg-linear-to-br from-white/4 to-white/2"
>
  <span class="select-none text-2xl font-semibold tracking-tight text-white/15"
    >AB</span
  >
</div>
```

### Add / new item card

```html
<div
  class="group flex h-full min-h-52 flex-col items-center justify-center
  overflow-hidden rounded-xl
  border border-dashed border-white/10 bg-white/2
  transition-all duration-200
  hover:border-poof-violet/40 hover:bg-white/4"
>
  <div
    class="mb-3 flex h-11 w-11 items-center justify-center rounded-full
    border border-white/10 bg-white/4 text-poof-mist/50
    transition-colors
    group-hover:border-poof-violet/30 group-hover:bg-poof-violet/10 group-hover:text-poof-violet"
  >
    <Plus class="h-5 w-5" />
  </div>
  <p class="text-sm font-medium text-poof-mist/60 group-hover:text-white">
    New gallery
  </p>
</div>
```

---

## 9. Pagination

```html
<div
  class="flex items-center justify-between border-t border-white/6 px-4 py-2.5"
>
  <!-- Left: range + per-page -->
  <div class="flex items-center gap-3">
    <span class="text-[11px] tabular-nums text-poof-mist/50">1–10 of 42</span>
    <div class="flex items-center gap-1.5">
      <span class="text-[11px] text-poof-mist/40">per page</span>
      <select
        class="h-6 rounded-md border border-white/8 bg-white/5
        px-1.5 text-[11px] text-poof-mist outline-none
        transition-colors hover:border-white/12"
      >
        <option class="bg-[#1a1a1a]">10</option>
      </select>
    </div>
  </div>

  <!-- Right: page buttons -->
  <div class="flex items-center gap-1">
    <button
      class="flex h-6 w-6 items-center justify-center rounded-md
      text-poof-mist/40 transition-colors
      hover:bg-white/6 hover:text-white
      disabled:opacity-25 disabled:pointer-events-none"
    >
      <ChevronLeft class="h-3 w-3" strokeWidth="{1.5}" />
    </button>
    <span
      class="min-w-12 text-center text-[11px] tabular-nums text-poof-mist/60"
      >1/4</span
    >
    <!-- ...more buttons -->
  </div>
</div>
```

Key details:

- Sits inside the table container, separated by `border-t border-white/6`
- Page buttons: `h-6 w-6`, icon `h-3 w-3`
- Per-page select: `h-6`, native `<select>`, dropdown bg matches `bg-[#1a1a1a]`
- Disabled: `disabled:opacity-25 disabled:pointer-events-none`
- Page indicator: `min-w-12 text-center` to prevent layout shift

---

## 10. Dialogs

### AlertDialog (destructive confirmation)

```html
<AlertDialogContent class="border-white/10 bg-poof-base text-white">
  <AlertDialogTitle class="text-base font-medium">Delete?</AlertDialogTitle>
  <AlertDialogDescription class="text-sm text-poof-mist">
    This action is permanent.
  </AlertDialogDescription>
  <AlertDialogCancel
    class="border-white/10 text-poof-mist hover:bg-white/5 hover:text-white"
  />
  <AlertDialogAction class="bg-red-500 text-white hover:bg-red-500/90" />
</AlertDialogContent>
```

### Edit Dialog

```html
<DialogContent class="border-white/10 bg-poof-base text-white sm:max-w-md">
  <h2 class="text-base font-medium text-white">Edit link</h2>
  <p class="mt-1 text-xs text-poof-mist/60">Supporting text.</p>

  <!-- Preview block inside dialog -->
  <div class="rounded-lg border border-white/6 bg-white/3 px-3 py-2.5">
    <p class="break-all font-mono text-[11px] text-poof-violet/80">...</p>
  </div>

  <!-- Input -->
  <input class="h-9 border-white/6 bg-white/3 text-xs text-white" />
</DialogContent>
```

---

## 11. Revealed Key Banner

```html
<div
  class="mb-4 rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-sm p-4 shadow-sm"
>
  <p class="text-sm font-medium text-white">API key created</p>
  <p class="mt-1 text-xs text-neutral-400">Copy it now — shown only once.</p>

  <!-- Code block with inline copy -->
  <div class="relative mt-3 group/code">
    <code
      class="block break-all rounded-lg bg-black/40 px-3 py-2 pr-9
      font-mono text-xs text-neutral-200 border border-white/5"
    >
      poof_abc123...
    </code>
    <button
      class="absolute top-1/2 right-2 -translate-y-1/2
      flex h-6 w-6 items-center justify-center rounded-md
      text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Copy class="h-3.5 w-3.5" strokeWidth="{1.5}" />
    </button>
  </div>
</div>
```

---

## 12. Selection Bar

```html
<div
  class="mb-4 flex items-center justify-between rounded-lg
  border border-poof-violet/20 bg-poof-violet/5 px-4 py-2.5"
>
  <div class="flex items-center gap-2.5">
    <span class="text-xs font-medium text-white">3 selected</span>
    <button class="text-poof-mist/50 transition-colors hover:text-white">
      <X class="h-3.5 w-3.5" />
    </button>
  </div>
  <button
    variant="ghost"
    size="sm"
    class="h-7 gap-1.5 text-xs text-red-400 hover:text-red-300"
  >
    <Trash2 class="h-3 w-3" /> Delete
  </button>
</div>
```

---

## 13. Checkbox (Selection Overlay)

```html
<Checkbox
  class="h-4 w-4 border-white/40 bg-black/50
  data-[state=checked]:border-poof-violet
  data-[state=checked]:bg-poof-violet"
/>
```

- Selected card ring: `ring-1 ring-poof-violet border-poof-violet/30`

---

## 14. Loading Skeletons

```html
<div class="h-28 animate-pulse rounded-xl bg-white/3 border border-white/6" />
```

- Use `animate-pulse` (Tailwind built-in)
- Background: `bg-white/3`
- Border: `border border-white/6`
- Match the shape of what they replace (`rounded-xl`, `rounded-lg`)

---

## 15. Empty States

```html
<div class="px-6 py-16 text-center">
  <div
    class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/4"
  >
    <Icon class="h-4 w-4 text-poof-mist/40" strokeWidth="{1.5}" />
  </div>
  <p class="text-sm text-poof-mist">No items found</p>
  <p class="mt-0.5 text-xs text-poof-mist/40">Supporting text.</p>
</div>
```

---

## 16. Avatar Circles (Deterministic Color)

```tsx
const avatarColors = [
  "bg-violet-500/20 text-violet-300",
  "bg-cyan-500/20 text-cyan-300",
  "bg-amber-500/20 text-amber-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-rose-500/20 text-rose-300",
  "bg-blue-500/20 text-blue-300",
  "bg-orange-500/20 text-orange-300",
  "bg-teal-500/20 text-teal-300",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}
```

```html
<div
  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold
  {avatarColor}"
>
  A
</div>
```

---

## 17. Icon Conventions

- Default icon size in rows/menus: `h-3 w-3` or `h-3.5 w-3.5`
- `strokeWidth={1.5}` on all Lucide icons (thinner, more refined)
- Search icon: `h-3.5 w-3.5`
- Dropdown trigger icon: `h-4 w-4`
- Badge inline icons: `h-2.5 w-2.5`
- Status dots: `h-1.5 w-1.5`
- Metric dots: `h-2 w-2`
- Icons inside empty-state circles: `h-4 w-4` in a `h-10 w-10` container

---

## 18. Animation

### Page entrance

```css
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-up {
  animation: fade-up 0.4s ease-out forwards;
}
```

Apply `animate-fade-up` to the outermost page container.

### Staggered card delay

```tsx
style={{ animationDelay: `${index * 0.04}s` }}
```

Use `0.04s`–`0.06s` per card for grid stagger.

### Hover image zoom

```
transition-transform duration-300 group-hover:scale-105
```

### Hover overlay (actions on image)

```
opacity-0 transition-opacity group-hover:opacity-100
```

---

## 19. Tailwind v4 Syntax Notes

These are **required** in Tailwind v4 — the old syntax will throw lint warnings:

| Old (v3)            | New (v4)            |
| ------------------- | ------------------- |
| `bg-gradient-to-r`  | `bg-linear-to-r`    |
| `bg-gradient-to-br` | `bg-linear-to-br`   |
| `min-w-[3rem]`      | `min-w-12`          |
| `z-[1]`             | `z-1`               |
| `hover:!text-white` | `hover:text-white!` |
| `aspect-[16/9]`     | `aspect-video`      |
| `h-[3px]`           | `h-0.75`            |

---

## 20. Section Header Pattern

```html
<div class="flex items-center justify-between">
  <h2 class="text-sm font-medium text-white">Section Title</h2>
  <Link class="group inline-flex items-center gap-1 text-xs text-poof-mist/50
    transition-colors hover:text-poof-violet">
    View all
    <ArrowRight class="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
  </Link>
</div>
```

---

## 21. Quick Reference Cheat Sheet

```
Page wrapper:       mx-auto max-w-5xl py-2 font-sans animate-fade-up
Card:               rounded-xl border-white/6 bg-[#111] hover:bg-[#151515]
Table outer:        rounded-lg border-white/6 bg-black
Table row:          bg-[#141414] px-4 py-3 hover:bg-white/4
Dropdown:           rounded-lg border-white/8 bg-[#1a1a1a] p-1
Segmented control:  rounded-md border-white/6 bg-white/2 p-0.5
Active pill:        rounded-[5px] bg-white/8 text-white
Search input:       h-8 border-white/6 bg-white/3 text-xs
Dialog:             border-white/10 bg-poof-base text-white
Delete button:      bg-red-500 hover:bg-red-500/90
Skeleton:           animate-pulse rounded-xl bg-white/3 border-white/6
3-dot trigger:      h-7 w-7 opacity-0 group-hover:opacity-100
```
