# Thrivel ID React Native port notes

## v2.0.2 chat parity
- Assessment rebuilt as a persistent ChatGPT-style conversation matching the current web assessment chat: centered email gate, AI/user message history, AI orb, typing state, acknowledgement messages, sticky bottom answer composer, option pills, multi-select send, number/slider controls and photo flow.
- AI Health Coach rebuilt to mirror the current web mobile layout: fixed 64px header, centered empty state, full-height conversation, gradient user bubbles, unboxed assistant responses, formatted Markdown-like text, thinking state and docked rounded composer.
- Both screens use dynamic branding colors from `/settings`; existing logo/assets continue to load API-first through the shared branding layer.
- Logged-in dashboard routing and recommendation parity from v2.0.1 are retained.
