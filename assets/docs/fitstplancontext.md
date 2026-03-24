# context.md

We are designing a premium iOS to-do + habit tracking app in React Native.

The current Home screen already defines the visual direction of the product.
From now on, every new screen, component, card, modal, and interaction must follow the same design DNA and feel like part of the same app family.

---

## Product Vision

This app should not feel like a generic task manager.

It should feel like:
- premium
- calm
- collectible
- soft
- visual
- emotionally pleasing
- modern iOS
- slightly playful but still elegant

The product should feel closer to a "visual productivity companion" than a boring to-do app.

The upper hero section with the illustrated / diorama-style visual card is a core part of the brand identity.
We should continue using this visual language on all major screens.

---

## Core Design DNA

Preserve these principles across all screens:

- Soft rounded corners everywhere
- Large hero visual card near the top of key screens
- Warm off-white main panels
- Dark brown / charcoal typography instead of harsh pure black
- Premium spacing and alignment
- Cute but sophisticated illustrated 3D / diorama visual storytelling
- Calm UI with low clutter
- Minimal but rich information hierarchy
- iOS-first layout and spacing
- Clean safe-area handling
- Consistent bottom navigation
- No harsh, overly technical dashboard feel
- No generic Android-like layout patterns
- No ugly default form styling

The app should feel handcrafted, polished, and emotionally attractive.

---

## Tech / Platform Rules

- Platform: iOS-first
- Stack: React Native
- Use mock data for now
- Do not connect backend yet
- Do not implement Supabase yet
- Focus on UI architecture, screen consistency, reusable components, and believable user flows
- Use clean component structure
- Use reusable cards, chips, segmented controls, stat blocks, and input groups
- Prefer composition over repetitive screen-specific code
- Use Phosphor icons consistently
- Respect safe area on all screens
- Avoid broken modals, awkward overlays, and poor keyboard behavior

---

## Existing Navigation Logic

Bottom navigation should remain consistent and premium.

Tabs:
1. Home
2. Calendar
3. Progress
4. Profile
5. Add

The Add tab can be treated as a primary creation shortcut.

---

## Screen Planning Priority

Build the following screens in this order:

1. Add Task / Habit Screen
2. Home Filled State
3. Task Detail Screen
4. Calendar Screen
5. Progress Screen
6. AI Assistant Screen
7. Profile Screen
8. Edit Task Screen
9. Empty / Success / Completion states

---

# 1) Add Task / Habit Screen

## Goal
Create a premium creation screen where users can add either a normal task or a habit.

## Layout
Top:
- Large hero visual card
- Same family as Home screen hero card
- Diorama-like visual scene related to productivity / fitness / planning / routine
- Rounded rectangular container
- Soft premium look
- Not too crowded
- The visual must feel collectible and charming

Bottom panel:
- Large rounded panel in warm off-white
- Form sections with premium spacing
- Segmented control at top:
  - Task
  - Habit

## Task Mode Fields
- Title
- Category
- Priority
- Due date
- Time
- Reminder toggle
- Notes
- CTA button: Create Task

## Habit Mode Fields
- Title
- Category
- Frequency
- Goal count
- Preferred time
- Reminder toggle
- Notes
- CTA button: Create Habit

## Visual Style Notes
- Inputs should not look default/plain
- Use rounded soft input containers
- Category and priority should use chips or pill selectors
- Date and time selectors should look elegant and native-inspired
- CTA should feel premium and clear

## English Mock Data Examples
Use English mock content such as:
- Do 30 sit-ups
- Drink 2L water
- 15 min stretching
- Read 10 pages
- Deep work session
- Walk 6,000 steps
- Journal for 5 minutes
- Plan tomorrow

Categories can include:
- Health
- Focus
- Personal
- Study
- Fitness
- Work

Priority options:
- Low
- Medium
- High

Frequency options:
- Daily
- Weekdays
- 3 times a week
- Custom

---

# 2) Home Filled State

## Goal
Design the realistic version of the home screen after the user has added tasks and habits.

## Structure
Keep the existing home layout but make it feel alive.

Sections:
- Hero visual card
- Today title
- Segmented control:
  - Daily Habits
  - Goals
- Task list
- Summary stats

## Filled Content
Show believable mock tasks/habits in English, such as:
- Do 30 sit-ups
- Drink 2L water
- Read 10 pages
- Deep work session
- Call mom

## Card Types
### Task card
- checkbox
- title
- metadata row
- due time
- category
- priority or repeat badge

### Habit card
- title
- progress info
- count progress
- streak badge or small progress bar

## Design Notes
- Cards must be soft and clean
- Not too dense
- High legibility
- Subtle hierarchy
- Completion state should be satisfying
- Checked tasks should still look beautiful

---

# 3) Task Detail Screen

## Goal
Open when user taps a task from Home or Calendar.

## Layout
Top:
- Hero visual card themed to the selected task
- Example:
  - workout-related scene for sit-ups
  - desk scene for deep work
  - reading scene for book-related task

Bottom:
- task title
- status badge
- category
- due date and time
- reminder info
- repeat info
- notes
- subtasks if needed
- complete button
- edit button

## Notes
This screen must not feel like a boring utility form.
It should still feel premium, visual, and emotionally designed.

---

# 4) Edit Task Screen

## Goal
Allow editing existing task/habit.

## Layout
Almost the same as Add screen:
- same hero card pattern
- same soft form language
- same premium spacing

Buttons:
- Save Changes
- Delete Task

---

# 5) Calendar Screen

## Goal
Provide time-based planning.

## Layout
Top:
- Hero visual card related to planning / calendar / scheduling
- Same design family as Home

Below:
- Month / Week toggle
- Horizontal day selector or compact calendar strip
- Selected day tasks
- Small completion summary

## Content
Each task row/card can show:
- title
- time
- category
- completion checkbox
- small badge

## Design Notes
This screen should feel elegant and clear, not like a dense enterprise calendar.
Keep it soft, premium, and readable.

---

# 6) Progress Screen

## Goal
Show motivation, consistency, and productivity in a stylish way.

## Layout
Top:
- Hero visual card themed around growth / streak / achievement

Below:
- Weekly completion card
- Best streak card
- Active habits card
- Total completed tasks card
- Small chart or visual summary
- Motivational insight block

## Example Stats
- Completion Rate
- 5 Day Streak
- 4 Active Habits
- 18 Tasks Completed This Week

## Notes
This screen should feel rewarding.
Avoid ugly charts or overly analytical dashboard styling.
Keep metrics simple, beautiful, and emotionally satisfying.

---

# 7) AI Assistant Screen

## Goal
Open from the AI badge on the Home hero card.

## Purpose
Allow the user to create tasks using chat or voice.

## Layout
Top:
- AI-themed hero visual card
- Same world as the rest of the app
- Soft glowing object / assistant-themed diorama feeling

Below:
- conversation area
- suggested prompt chips
- input bar
- voice button
- action suggestions

## Suggested Prompt Examples
- Plan my evening
- Add a workout task
- Build a study routine
- Organize my week
- Remind me to drink water

## Important
This screen must still match the product.
It should not suddenly feel like a generic chatbot app.

---

# 8) Profile Screen

## Goal
Show user account, preferences, and app settings.

## Layout
Top:
- profile hero card
- avatar / visual identity block
- same design family

Below:
- account
- notifications
- reminder preferences
- categories
- theme
- AI settings
- help
- export data

## Notes
Use grouped rounded cards.
Keep it premium and soft.
No ugly flat settings list.

---

# 9) Empty / Success / State Design

We need multiple UI states, not just one static screen.

For key screens, design:
- Empty state
- Filled state
- Completed state
- Success feedback state

Examples:
### Home
- No tasks yet
- 3 active tasks
- All tasks completed today

### Add
- Empty form
- Valid filled form
- Success created confirmation

### Calendar
- No tasks on selected day
- Multiple tasks scheduled

These states should feel intentional and beautiful.

---

## User Flow Planning

### Flow 1: First Use
- user finishes onboarding
- lands on Home empty state
- taps Add
- creates first task/habit
- returns to Home filled state

### Flow 2: Daily Use
- user opens Home
- checks off tasks
- progress stats update
- user opens Calendar to view tomorrow

### Flow 3: AI Creation
- user taps AI badge
- enters prompt like:
  "Tomorrow morning add 30 sit-ups and drink water"
- app generates suggested tasks
- user confirms
- tasks appear in Home and Calendar

### Flow 4: Habit Building
- user creates a daily habit
- reminder is enabled
- Progress screen starts showing streak

### Flow 5: Task Management
- user taps task
- opens detail
- edits or completes it
- UI updates consistently

---

## Component System To Build

Create reusable components for:
- HeroVisualCard
- SectionHeader
- SegmentedControl
- TaskCard
- HabitCard
- StatCard
- CategoryChip
- PriorityChip
- EmptyStateCard
- InputField
- TimeSelectorRow
- ReminderToggleRow
- CTAButton
- BottomNavBar

All components must follow the same visual system.

---

## Typography / Tone

Typography should feel:
- rounded
- modern
- premium
- readable
- calm

Tone of product copy:
- simple
- helpful
- polished
- not robotic
- not too playful
- not too corporate

Use English mock data in the app UI for now.

Examples:
- Today
- Daily Habits
- Goals
- No tasks yet
- Create your first task
- Completion Rate
- Create Task
- Save Changes
- Active Habits

---

## Interaction Notes

- Add subtle micro-interactions where logical
- Completion should feel satisfying
- Tab switching should feel stable
- No janky movement
- No cluttered nested interactions
- Prioritize visual calmness
- Keyboard handling must be correct on forms
- Tap targets must be comfortable for iOS

---

## What To Avoid

Do NOT do the following:
- Do not introduce a different visual style on new screens
- Do not use plain generic cards
- Do not create dense enterprise dashboards
- Do not use harsh black/white contrast everywhere
- Do not make the calendar too technical
- Do not make AI screen look unrelated
- Do not break the soft premium aesthetic
- Do not overuse gradients
- Do not overfill screens with too much text
- Do not use cheap-looking default form controls
- Do not create inconsistent radii or spacing

---

## Immediate Execution Task

Now start by designing and implementing:

### First:
Add Task / Habit Screen

Then:
### Second:
Home Filled State

Then:
### Third:
Task Detail Screen

Use reusable components and preserve the existing design language from the current Home screen.

All screens must look like they were designed by the same high-end product designer.