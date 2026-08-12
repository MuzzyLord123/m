/**
 * /repairs — the page the whole rebuild is pointed at.
 *
 * This is the one thing on the site a competitor running the same bought theme
 * cannot copy, because it can only be written by someone who has opened a
 * hundred window frames and knows what is behind them.
 *
 * It is also the honest page: it says where a repair stops being the right
 * answer. Nobody in this trade writes that down, which is exactly why it is
 * worth writing down.
 */

export const repairs = {
  title: 'Rotten windows, soffits and fascias',
  standfirst:
    'We cut the rot out, splice new timber in and paint it properly. Here is what that actually involves, and the point at which we will tell you to stop paying us and get it replaced.',

  /** The comparison at the top of the page. */
  comparison: {
    project: 'external-masonry-and-windows',
    eyebrow: 'Window repair · Neston',
    before: 'Soft timber at the cill ends, paint gone at the joints',
    after: 'Spliced, filled, primed and finished',
  },

  /** What rot looks like, stage by stage. The reader is diagnosing their own house. */
  stages: {
    heading: 'What you are looking at',
    intro:
      'Timber does not fail all at once. It goes through the same four stages every time, and which one you are at decides what it costs.',
    items: [
      {
        stage: 'One',
        title: 'The paint has let go',
        body: 'Hairline cracks where two pieces of timber meet, and blistering on the elevation that gets the sun. Water does not come through paint, it comes in behind it — at the joints, around the putty line and up through the cut end of a board. The timber under it is still sound. This is the cheapest day you will ever have on that window.',
      },
      {
        stage: 'Two',
        title: 'The timber has greyed',
        body: 'Paint is off in patches and the bare wood has gone silver, with the grain standing proud when you run a hand over it. The surface fibres have broken down. Sanded back and primed the same day, it is still a decorating job rather than a repair.',
      },
      {
        stage: 'Three',
        title: 'Wet rot',
        body: 'The wood is darker than the timber around it and gives when you press it. Push a bradawl in: if it goes more than three or four millimetres under nothing but hand pressure, that timber has gone and no amount of filler will bring it back. It starts at the bottom — the bottom rail of a casement, the ends of a cill where the end grain is, the foot of a stile — because that is where the water sits.',
      },
      {
        stage: 'Four',
        title: 'The section has gone',
        body: 'Putty dropping out, glass loose in the rebate, the frame moving when you push the corner. The joints have opened. At this stage we will normally tell you that a repair is throwing good money after bad, and why.',
      },
    ],
  },

  /** Repair versus replace. The honest bit. */
  decision: {
    heading: 'Filled, spliced, or replaced',
    intro:
      'Three different jobs, and telling you which one you have is most of what we are for.',
    items: [
      {
        title: 'Filled',
        body: 'Shallow defects in timber that is otherwise hard. Two-part wood filler, mixed in small batches because it goes off in minutes, proud of the surface and sanded back flush. Not decorator’s caulk — caulk is for the gap between the frame and the plaster, and it belongs nowhere near an exterior repair.',
      },
      {
        title: 'Spliced',
        body: 'Where a section has gone soft but the member is otherwise sound. We cut back past the rot to bright, hard timber, cut a new piece to the same section, prime every face of it including the ones nobody will ever see, then glue and fix it in and work it back to the original profile. A cill end, the bottom rail of a casement, the foot of a door frame — all normal splice repairs.',
      },
      {
        title: 'Replaced',
        body: 'When a third or more of a member has gone, when the joints have opened and the frame is out of square, when a cill is soft the whole way through its depth, or when the rot has run back into the frame behind. We will say so. We would rather lose the repair than take money for something that is going to fail again in two years and be our name on it.',
      },
    ],
  },

  /** Soffits and fascias — the specific bit of expertise. */
  soffits: {
    heading: 'Why the soffits and fascias go first',
    body: [
      'Every house we look at, the boards under the gutter are further gone than the windows, and the owner is usually surprised. There are four reasons and they compound.',
      'They are horizontal, so water sits on them instead of running off. They are behind the gutter, so the face nobody sees gets everything that overflows in a downpour — and that is the face that was primed once at best when the house was built. The cut ends of the boards, where the timber drinks fastest, were often never sealed at all. And they are twenty feet up, so nobody has looked at them since the last time somebody put a ladder against the house.',
      'By the time it is visible from the ground it has usually been going for years. A soffit that is soft at the wall end, or a fascia that has split along the grain where the gutter brackets are screwed through it, wants boards off and new timber in — not another coat over the top.',
    ],
  },

  /** How the work is actually done. Preparation is most of it. */
  method: {
    heading: 'How the work goes',
    intro:
      'Preparation is most of the job. The painting is the quick part, and it is the part that gets the credit.',
    steps: [
      {
        title: 'Open it up',
        body: 'Scrape the loose paint off and find the edge of the sound stuff. What looked like one bad corner is often a third of the rail — better to know on day one than after the first coat.',
      },
      {
        title: 'Cut out to hard timber',
        body: 'Soft wood comes out until the chisel is biting into something that resists. Anything less and the rot carries on underneath the repair.',
      },
      {
        title: 'Let it dry',
        body: 'Filler and primer over wet timber will not hold, and this is the single most common reason a repair fails. If the wood is wet, it gets covered and left, and we come back. That is why we will occasionally tell you the job is a fortnight rather than a week.',
      },
      {
        title: 'Splice, fill and shape',
        body: 'New timber in, primed on all faces before it goes anywhere near the frame. Filler in thin layers rather than one thick one. Sanded back to the original profile so the repair is not a lump you can see from the path.',
      },
      {
        title: 'Prime the same day',
        body: 'Bare exterior timber gets primed the day it is sanded, including every cut end. End grain is where the water gets in, so it gets more primer, not less. Knots knotted. Nail holes filled after the primer, not before.',
      },
      {
        title: 'Finish, and more of it where it is exposed',
        body: 'Two coats as standard. A south-westerly gable takes the weather off the Dee for the whole of its life and gets another, because the alternative is being back in three years.',
      },
    ],
  },

  /** What a repair actually buys you. No promises we cannot keep. */
  honest: {
    heading: 'What a repair buys you',
    body: [
      'A properly spliced and primed repair on a sound frame will go as long as the rest of the paintwork, which on the exposed side of a house around here is somewhere between five and eight years before it wants doing again.',
      'What kills it is not the repair, it is leaving the repainting until the paint has already broken. If you get us back before the film cracks, the timber underneath never gets wet and the frame outlives all of us. That is the whole trick, and it is not much of a secret.',
    ],
  },

  cta: {
    heading: 'Send us a photograph of the worst one',
    body: 'A close-up of the corner you are worried about, and one of the whole window, tells us most of what we need. We will tell you honestly whether it is a fill, a splice or a joiner.',
  },
} as const;
