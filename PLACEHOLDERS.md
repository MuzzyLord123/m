# PLACEHOLDERS.md

Real assets Quooro needs to supply. Nothing on this list may be invented.

## Resolved by deletion — fabricated credibility removed

| What | Where it was | Action taken |
| --- | --- | --- |
| Invented purchase notifications ("Manchester Pub — Business Site — 2 hours ago", "Cardiff Fitness Studio", "Bristol Dental Practice", …) | `SocialProofRotator`, rendered **twice** on `/packages` | **Deleted.** Component and both call sites removed. |
| Invented customer list ("A Cardiff law firm", "A Leeds consultancy", "A Glasgow retailer", …) | `SocialProofToast`, rendered on the **homepage** via `Layout.tsx` | **Deleted.** Component and call site removed. |
| Six named testimonials ("Mark T., Director"; "Priya S., Founder"; "David R., Operations Manager"; "Sarah K."; "James W."; …), each with a 5-star rating and a company | `TestimonialCarousel`, rendered on the **homepage** | **Deleted.** Component and call site removed. See P2 for what real quotes would need. |
| 14 website screenshots presented as the studio's work, tiled in 3D behind the homepage headline | `FloatingScreenshotHero` + `src/assets/hero-screenshots/*` | **Deleted.** Hero rebuilt around the globe (`HomeHero.tsx`); the 14 `.webp` files are gone from the repo. |
| Six flag-marked "client locations" (USA, Germany, Australia, Canada, UAE) joined by animated arcs on the globe | `Globe3D.tsx` | **Deleted.** One marker remains, on the real studio location in Wales. |
| Client logo marquee | `ClientLogoMarquee.tsx` (unreferenced) | **Deleted.** No real client logos exist to put in it. |
| "SOC-2 aligned practices" | `HOME_WHY_DEFAULTS` → Enterprise Security card | **Replaced** with "AES-256 encryption at rest, 2FA, and role-based access on every account" — true, and verifiable against the schema. SOC 2 is an audited attestation the studio does not hold. |
| "Serving Clients **Worldwide** — from local businesses to global enterprises… 24/7 support across time zones" | `home_global_reach` header + the Worldwide card | **Rewritten** as "One studio. Any postcode." The section now describes what the work covers, not who has bought it. |
| Six invented portfolio outcomes: "+150% online orders", "+200% leads", "+£50K monthly sales", "10K+ active users", "500K patients served", "+300% inquiries", under the line "Real results from real clients" | `/portfolio` | **Rewritten.** The page is now "Reference Builds", explicitly labelled as design studies rather than client projects, and each entry describes what the build demonstrates instead of an outcome that never happened. |
| Four social icons linking to `href="#"` | `Footer.tsx` | **Deleted.** Buttons shaped like profiles that go nowhere. Restore them when there are real accounts to link. |
| Homepage bottom CTA "View Our Work" → `/portfolio` | `Index.tsx` CTA | **Repointed** to `/features` ("See what's included"). `/portfolio` still exists and is still linked from the nav and footer, but the homepage no longer sends buyers there expecting a client roster. Resolve properly under P1. |

Owner confirmed these were not real customers. They are gone rather than
restyled — a "someone just bought this" notification about a customer who does
not exist is a false representation of a transaction, not a design choice.

The same reasoning applies to the rest of the table: a screenshot wall, a
testimonial carousel and a map of client cities are all *evidence claims*. A
buyer reads them as proof. Restyling them would have made the claim look better
without making it true.

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

None exist. The six that were on the homepage were invented and have been
deleted. No replacements will be written.
`[PLACEHOLDER: 2-3 real client quotes with name, role, company, and permission]`

Until those exist the homepage simply has no testimonial section. That is the
correct state — an empty slot is not a design problem, it is an honest one.

### P2b. Stock imagery still on the homepage

One stock render remains, in the Apps & Dashboards section
(`src/assets/hero-workspace.jpg` — an iMac showing a generic dashboard). It is
captioned "Modern development tooling / Experienced system design", which is a
capability statement rather than a claim of client work, so it stays for now,
colour-graded into the palette. Replace it with a real screen from a real build
when one is available.

`code-transform.webp` was removed from the homepage entirely: violet-lit stock
photography showing an invented "Welcome / About Us" site, with the section
heading laid over the busy half of the image so half the sentence was
unreadable. That section is now typographic.

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

### P6. Placeholder WhatsApp number (removed 2026-07-29)

The Packages page floating "Need Help?" button linked to
`wa.me/447000000000` — an obviously fake number that would have dead-ended a
real enquiry. It now routes to `/get-started`.
`[PLACEHOLDER: if the studio wants WhatsApp contact, wire the real number]`

### P7. Legal entity name

The Support page and Terms of Service name **Echelon Sites Ltd** as the
contracting entity while the brand everywhere else is Quooro. Left untouched —
a legal name is not a design decision. `[PLACEHOLDER: owner to confirm the
registered company name and whether Terms should read "Quooro (a trading name
of …)" ]`

### P8. Fabricated service statistics (removed 2026-07-29)

The SEO page led with "250% Average Traffic Increase / Top 3 Ranking
Positions / 400+ Keywords Ranked / 95% Client Retention" and the Account
Management page with "100% Response Rate / <2hrs Response Time / 500+ Brands
Protected". No client record supports any of these. All removed. "24/7
monitoring" survives only as a commitment inside the Enterprise plan copy.
`[PLACEHOLDER: real, checkable service outcomes if/when the studio has them]`

### P9. Fabricated client stories (removed 2026-07-29)

Success Stories carried six invented clients (TechStart Solutions, Bloom &
Grow Florists, Urban Fitness Studio, Hartley Legal, Artisan Coffee Co.,
NextGen Accounting) with fabricated quotes, invented named people, stock
Unsplash photos, three named "testimonials", and a stats band (500+
projects / 98% satisfaction / 250% traffic growth / 4.9/5). Preview Stories
carried six more (Sarah M., James T., Emily C., Marcus W., Rebecca F.,
David P.) plus conversion stats (94% convert / 67% upgrade / 100%
recommend / 4.9/5). All removed. Success Stories now leads with verifiable
claims and the real project journey; Preview Stories tells three
second-person scenario walkthroughs explicitly framed as hypothetical.
`[PLACEHOLDER: real client stories, with written permission, as they happen]`
