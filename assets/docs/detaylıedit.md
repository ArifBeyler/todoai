You are a senior product strategist, senior iOS UX architect, motion designer, and onboarding specialist working on a premium AI-powered to-do app.

Your task is to create a DEEPLY DETAILED onboarding and user flow plan for this app. Do not write code. Do not stay high level. I want a very concrete, product-ready planning document that I can use to implement the onboarding in Cursor.

APP CONTEXT
- This is a premium iOS to-do app.
- The app’s core magic is this:
  the user creates todos, and the app can generate personalized visuals/images based on those todos.
- The experience should feel emotional, exciting, premium, modern, elegant, and memorable.
- The onboarding should feel cinematic and highly polished, not generic.
- Long onboarding is acceptable. Too few screens is not the goal.
- Many onboarding screens, modals, transitions, and micro-animations are welcome as long as the flow remains clear and beautiful.
- The app must support multiple languages.
- Localization is a major emotional advantage:
  if a Spanish user opens the app, they should feel like the entire onboarding was crafted for them.
- The interface tone should feel premium, calm, intelligent, and motivating.
- The visual design language should feel modern iOS, polished, soft, premium, card-based, elegant, and cohesive.
- Every screen and every modal should feel designed with intent.

IMPORTANT PRODUCT DECISIONS
- We are NOT using email/password sign up.
- Authentication is Sign in with Apple only.
- If Apple provides the user’s name, the name input screen should be prefilled automatically.
- Example:
  if the Apple account gives the name “Arif”, the name field should already contain “Arif”.
- The user must be able to edit that name manually.
- The chosen display name must be saved separately as an editable in-app profile name.
- If Apple does not return a name, the app should gracefully fallback to a blank editable field or a soft placeholder.
- The app should use device/app language and fully localize onboarding copy.
- The onboarding must explain clearly that the app can generate visuals based on the user’s todos.

VERY IMPORTANT EXPERIENCE GOAL
I want onboarding in TWO MAJOR PHASES:

PHASE 1 — PRE-AUTH DISCOVERY ONBOARDING
This happens before Sign in with Apple.
Its purpose is:
- explain what the app is
- create desire
- show the emotional value
- show the visual generation magic
- make users think “I want this”

PHASE 2 — POST-AUTH PERSONALIZED ONBOARDING
This happens after Sign in with Apple.
Its purpose is:
- personalize the experience
- confirm the user’s name
- explain how their tasks become visuals
- explain photo usage if applicable
- prepare the user for permissions, paywall, and first real use
- deliver a strong “aha” moment before landing on Home

CORE ONBOARDING MOMENT TO INCLUDE
I specifically want a sequence like this:
- On one screen, todo cards/boxes appear one by one with animation.
- Example todos:
  “Feed the dinosaur”
  “Water the flowers”
  etc.
- Then on the next screen those todo cards disappear.
- Then one selected todo remains or transforms.
- Then a visual/image appears inside or from that todo card.
- This sequence should clearly communicate:
  “your tasks can become visuals”
- I want this exact type of transformation moment planned carefully.
- Suggest the best animation language for this transformation.

ANIMATION DIRECTION
- Motion is extremely important.
- Many screens can have their own motion identity.
- Typing animation can be used, especially in hero explanations and certain capability reveals.
- But do NOT use typing animation in a way that makes the onboarding feel slow or annoying.
- Plan where typing animation should be used, and where it should NOT be used.
- Every modal and important UI block should feel alive with subtle motion.
- I want a motion-aware plan, not static screen descriptions.

YOUR OUTPUT MUST BE EXTREMELY DETAILED AND STRUCTURED.

I want you to produce the following sections:

1) ONBOARDING STRATEGY SUMMARY
- Explain why the onboarding is split into pre-auth and post-auth.
- Explain the emotional purpose of each phase.
- Explain how long onboarding can still feel premium rather than tiring.
- Explain pacing, variation, and rhythm.

2) FULL USER FLOW MAP
Create the full onboarding flow step by step from first app open to landing on Home.
Include:
- splash
- pre-auth onboarding
- auth entry
- Sign in with Apple
- name confirmation
- personalization
- permissions soft-asks
- paywall placement
- photo upload placement if relevant
- first task example
- first visual explanation
- landing on home
For each step, explain:
- user goal
- product goal
- why this screen exists
- what should happen next

3) RECOMMENDED SCREEN-BY-SCREEN ONBOARDING PLAN
For every screen, provide:
- screen number
- screen name
- exact purpose
- recommended layout concept
- what appears first
- what animates in
- what the user reads
- what the user taps
- what emotional effect it should create
- whether it should be skippable
- whether it should auto-advance or wait for user action
- whether it should be full screen, modal-like, or card-driven

4) PRE-AUTH DISCOVERY ONBOARDING
Design this in depth.
This phase should include screens such as:
- cinematic welcome
- what the app does
- why normal to-do apps feel dead
- how this app makes tasks feel visual and alive
- todo cards appearing one by one
- todo card transforming into a generated visual
- multilingual/personal feel
- motivation / reward / consistency angle
- CTA to continue with Apple
For each screen, specify:
- copy direction
- interaction
- animation
- progression logic

5) POST-AUTH PERSONALIZED ONBOARDING
Design this in depth.
This phase should include:
- welcome by name
- editable prefilled name screen using Apple-provided name when available
- explanation of personalization
- explanation of image generation based on tasks
- explanation of why a user photo may be needed
- how consistency of identity/style is maintained
- what happens after enough todos are added
- explanation of visual payoff and daily motivation
- preparation for first content generation
For each screen, specify:
- copy direction
- interaction
- animation
- what data is collected
- how not to make it feel invasive

6) PAYWALL PLACEMENT STRATEGY
I want you to decide the BEST place for the paywall in this flow.
Important:
- This app includes premium AI generation value.
- We want high conversion without killing excitement.
- Explain whether paywall should appear:
  before auth,
  immediately after auth,
  after personalization,
  after first aha moment,
  or at some hybrid point.
- Recommend the best option and justify it in detail.
- Mention what the user must understand emotionally BEFORE seeing the paywall.

7) NAME HANDLING STRATEGY
Plan the name step precisely:
- If Apple returns a name, prefill it.
- User can edit it.
- If Apple does not return a name, fallback gracefully.
- Returning users may not get name again from Apple, so the app should persist the chosen display name.
- Explain UX edge cases and best microcopy.
- Explain the ideal label, helper text, and CTA for this screen.

8) MULTI-LANGUAGE / LOCALIZATION STRATEGY
This is critical.
I want the onboarding designed for multilingual delight.
Cover:
- device language detection
- copy length expansion rules
- Spanish, Turkish, English examples
- dynamic layout for longer strings
- avoiding broken animations with localized text
- how typing animations should adapt to language
- culturally neutral but emotionally resonant wording
- how to make users feel “this app understands me” in their own language

9) ANIMATION & MOTION SPEC
This section must be very detailed.
For each major onboarding screen type, define:
- transition type
- entrance animation
- exit animation
- element staggering
- todo card animation behavior
- text animation behavior
- image reveal behavior
- modal presentation style
- haptic moments
- when to use typing animation
- when to prefer fade/slide/scale instead
- how to maintain premium feel without overdoing motion
Also define motion principles such as:
- calm, intentional, premium
- never chaotic
- never gamey in a cheap way
- delight through precision

10) MODAL & MICROINTERACTION PLAN
I want a specific section for:
- permission explanation modals
- info popups
- paywall presentation
- photo upload prompt
- success states
- loading states
- tiny celebratory moments
For each, explain:
- when it appears
- why it appears
- how it animates
- how it closes
- what emotional function it serves

11) FIRST-TIME USER EDUCATION PLAN
Explain what the user must understand before reaching Home:
- what the app is
- why it is different
- how todos relate to visuals
- whether photo is required
- what happens after enough tasks are added
- what premium unlocks
- what happens next after onboarding
Then explain what should be intentionally left for later to avoid overload.

12) EDGE CASES & UX FAILURES TO AVOID
List all possible issues such as:
- onboarding too long without variety
- too much typing animation
- asking for too much too early
- paywall too early
- unclear photo usage
- Apple name not returned
- localization breaking layout
- too many modals in a row
- weak transition into Home
For each issue, explain the solution.

13) FINAL RECOMMENDED FLOW
At the end, provide one final recommended flow from screen 1 to final Home entry.
Make it concrete and implementation-ready.
Use a numbered sequence.

14) BONUS: HIGH-IMPACT MOMENTS
At the end, add a section called:
“3 unforgettable moments in this onboarding”
These should be the biggest wow moments in the entire flow.

VERY IMPORTANT OUTPUT STYLE
- Be extremely concrete.
- Avoid generic product advice.
- Think like a world-class product designer planning an App Store-feature-worthy onboarding flow.
- Prioritize emotional sequencing and premium UX.
- The output should feel like an internal product strategy document.
- Make strong recommendations.
- Do not say “it depends” unless absolutely necessary.
- Do not write code.

You are a senior UX writer and localization strategist for a premium AI-powered iOS to-do app.

Your task is to create the onboarding copy system and localization approach for this app. Do not write code. Write product-ready copy guidance.

APP CONTEXT
- Premium iOS to-do app
- Users create tasks
- The app can generate visuals/images based on those tasks
- The app should feel emotional, premium, intelligent, elegant, and motivating
- The onboarding has many screens and rich motion
- The app supports multiple languages
- Sign in with Apple only
- User name may come from Apple and should be editable in onboarding

I need you to produce:

1) BRAND VOICE FOR ONBOARDING
Define the voice:
- premium
- warm
- motivating
- visually imaginative
- not childish
- not robotic
- not productivity-bro
- not overly cute
Explain the tone with examples.

2) COPY PRINCIPLES
Define writing principles for onboarding:
- short but emotional
- clear but cinematic
- avoid generic productivity clichés
- explain magic without sounding fake
- sound premium in English, Turkish, and Spanish

3) SCREEN COPY DIRECTION
For each major onboarding screen type, give:
- headline style
- supporting text style
- CTA style
- helper text style
Screen types:
- cinematic intro
- capability reveal
- todo cards demonstration
- visual transformation moment
- Sign in with Apple entry
- prefilled name screen
- personalization explanation
- photo explanation
- paywall warm-up
- permission soft-ask
- first success state

4) MULTI-LANGUAGE STRATEGY
Cover:
- English
- Turkish
- Spanish
Explain:
- how to maintain the same emotional tone across all three
- what kinds of phrases become awkward when translated
- how to avoid overly long text
- how to preserve rhythm for animated onboarding
- how typing animation should adapt to different languages
- how CTA labels should stay natural in each language

5) SAMPLE COPY SETS
Write multiple premium headline/subheadline options for:
- what this app does
- your tasks becoming visuals
- motivation and momentum
- personalized experience
- name confirmation
- photo explanation
- premium unlock lead-in
Create at least 8 options for each category.
Do not make them cheesy.

6) NAME SCREEN COPY
Create the best UX copy for the screen where the user’s name is prefilled from Apple.
Need:
- title
- subtitle
- field label
- helper text
- CTA
- fallback copy if no name is available
Need versions in English, Turkish, and Spanish.

7) PERMISSION SOFT-ASK COPY
Create soft, respectful copy for:
- photo access or photo upload request
- notification permission explanation
- any generation/loading state
Need versions in English, Turkish, and Spanish.

8) MICROCOPY FOR MOTION MOMENTS
Write small text snippets for:
- typed text moments
- transforming todo card moments
- image reveal moments
- loading transitions
- success checkmarks
Need these to feel premium and satisfying.

9) PAYWALL WARM-UP COPY
Do not write a full paywall.
Instead, write the best warm-up copy that emotionally prepares the user for premium AI generation.
Need:
- lead-in headlines
- reassuring subtext
- “why premium exists” framing
- no pushy sales tone

10) FINAL RECOMMENDATION
At the end, choose the strongest copy direction for this app and explain why.

Output style:
- very detailed
- highly practical
- product-ready
- premium
- no code

You are a senior motion designer and iOS interaction designer.

Your task is to define a premium motion system for the onboarding of a high-end AI-powered to-do app. Do not write code. Create a motion specification document.

APP CONTEXT
- Premium iOS to-do app
- Users create tasks
- The app can generate visuals/images from those tasks
- Onboarding is intentionally rich, detailed, and multi-screen
- There are many modals, transitions, reveals, and educational moments
- Motion is one of the key reasons the onboarding should feel magical
- The experience must remain elegant, calm, premium, and iOS-native
- Typing animation is desired in some places, but should not become tiring

I need you to produce:

1) MOTION PHILOSOPHY
Define the motion philosophy of the onboarding:
- premium
- intelligent
- calm
- precise
- slightly cinematic
- emotionally rewarding
- never messy
- never gimmicky

2) SCREEN TRANSITION SYSTEM
Define the primary transition patterns between onboarding screens:
- horizontal progression
- vertical reveals
- fade-through moments
- modal overlays
- zoom emphasis moments
Explain where each should be used.

3) TODO CARD ANIMATION SYSTEM
Define how todo cards behave:
- entrance
- stagger
- hover/parallax feel if any
- selection
- collapse
- morph into image
- replacement by image
- disappearance
This is a core storytelling moment, so be very detailed.

4) TEXT ANIMATION SYSTEM
Define:
- when typing animation should be used
- max length for typing text
- when to avoid typing
- alternatives like fade-up, mask reveal, or staggered word reveal
- headline motion vs body text motion

5) IMAGE REVEAL SYSTEM
Define how generated visuals should appear:
- blur-to-sharp
- masked reveal
- card morph
- subtle scale settle
- loading shimmer
- timing guidance
Explain the emotional meaning of each.

6) MODAL MOTION SYSTEM
Define motion for:
- permission explainer modals
- feature education popups
- paywall presentation
- success overlays
- loading overlays
Need:
- entry
- emphasis
- dismiss
- background treatment
- layering feel

7) HAPTIC SYSTEM
Suggest where haptics should happen:
- important card landings
- todo-to-image transformation
- success confirmations
- paywall reveal
- permission confirmations
Keep it premium and restrained.

8) PACING RULES
Explain how to prevent onboarding fatigue:
- variation in timing
- short vs long moments
- where to auto-advance
- where to wait for user interaction
- how to let users skip without ruining the experience

9) ACCESSIBILITY & REDUCED MOTION
Define how this onboarding should adapt for reduced motion users without losing clarity.

10) FINAL MOTION RECOMMENDATION
At the end, provide a final motion recipe for the full onboarding from first screen to Home.

Output style:
- specific
- product-ready
- implementation-oriented
- no code