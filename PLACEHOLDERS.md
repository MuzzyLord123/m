# PLACEHOLDERS.md

Real assets Quooro needs to supply. Nothing on this list may be invented.

## Resolved by deletion — fabricated credibility removed

| What | Where it was | Action taken |
| --- | --- | --- |
| Invented purchase notifications ("Manchester Pub — Business Site — 2 hours ago", "Cardiff Fitness Studio", "Bristol Dental Practice", …) | `SocialProofRotator`, rendered **twice** on `/packages` | **Deleted.** Component and both call sites removed. |
| Invented customer list ("A Cardiff law firm", "A Leeds consultancy", "A Glasgow retailer", …) | `SocialProofToast`, rendered on the **homepage** via `Layout.tsx` | **Deleted.** Component and call site removed. |

Owner confirmed these were not real customers. They are gone rather than
restyled — a "someone just bought this" notification about a customer who does
not exist is a false representation of a transaction, not a design choice.

## Open — real assets required

### P1. Portfolio work — the big one

Owner confirmed: *"there just images not actual sites"*. The ~14 screenshots
tiled behind the homepage hero, and the six `/portfolio/*` case entries
(`local-cafe-landing`, `consulting-firm`, `fashion-ecommerce`, `saas-platform`,
`freelancer-portfolio`, plus index), do **not** represent real client work.

They cannot be presented as a portfolio. Two honest routes:

**Route A — capability showcase (recommended, available now).** Reframe as
clearly-labelled demonstration builds: *"Reference builds — design studies, not
client work."* Keeps the visual weight, tells the truth, and is a normal thing
for a young studio to publish.

**Route B — real work.** Ship one real project properly rather than six invented
ones. One honest case study outperforms six fictional ones with any buyer who
reads carefully.

`[PLACEHOLDER: 1-3 real client projects — screenshots, the brief, what changed
for the client, permission to name them]`

### P2. Testimonials

None exist. No invented quotes will be added.
`[PLACEHOLDER: 2-3 real client quotes with name, role, company, and permission]`

### P3. Statistics and claims

The homepage trust strip asserts *enterprise-grade security / UK-based team /
built for scale / full ownership*. "UK-based team" and "full ownership" are
verifiable and fine. The other two are vague enough to be meaningless.
`[PLACEHOLDER: any real, checkable numbers — projects delivered, years trading,
response time, uptime]`

### P4. Team and place

The studio is in Wales, and the brief is right that this is a differentiator.
Currently it appears only in the footer and the Terms page, never as positioning.
`[PLACEHOLDER: studio photograph or a real location image; founder name and
photo if the owner wants a face on the site]`

### P5. Open Graph imagery

`og-quooro.jpg` predates this design system and will be off-brand once Night
Shift lands.
`[PLACEHOLDER: regenerate OG images in the new direction — 1200x630]`
