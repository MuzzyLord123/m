/**
 * /compliance — replaces the old /health-safety/ page.
 *
 * The old page mentioned SafeContractor approval once, in a sentence, in the
 * middle of a paragraph. This page is written to be forwarded: a buyer should
 * be able to send the URL to their compliance team and have it answer the
 * pre-qualification questionnaire without a phone call.
 *
 * Which is exactly why the gaps in it are marked rather than filled. A
 * compliance page with an invented insurance limit on it is worse than no
 * compliance page, and it is the one page where being caught out ends the
 * relationship rather than starting it.
 */

export const compliance = {
  meta: {
    title:
      'Compliance, accreditation & insurance | McDonald Painting Contractors',
    description:
      'SafeContractor approval assessed by Alcumus, insurance, site-specific RAMS, COSHH, waste and environmental arrangements, and how we work in occupied buildings and out of hours.',
  },

  sheet: {
    title: 'Compliance and accreditation',
    standfirst:
      'The documents and the arrangements behind them, set out so they can be forwarded rather than requested. Where a figure or a certificate number is not yet published here it is marked as outstanding — it is not omitted, and it is not approximated.',
  },

  accreditation: {
    title: 'SafeContractor',
    body: [
      'McDonald Painting Contractors Ltd is SafeContractor approved. SafeContractor is a health and safety accreditation scheme operated by Alcumus, and it is a SSIP-recognised scheme, so an approval under it is accepted in place of a repeat assessment by most buyers who are members of the same mutual recognition arrangement.',
      'The assessment covers health and safety policy, risk assessment and method statement procedures, training and competence records, insurance, and the arrangements for managing subcontractors. It is renewed annually.',
    ],
    confirm: 'safecontractor',
    confirmNote:
      'Certificate number, the scope the assessment covers, the expiry date, and the certificate itself so it can be shown on this page.',
  },

  insurance: {
    title: 'Insurance',
    body: [
      'The company carries public liability and employers’ liability cover. Both figures, the insurer and the renewal date belong on this page, because they are the first two questions on every pre-qualification questionnaire and a buyer who has to email for them has already lost a day.',
    ],
    confirm: 'insurance',
    confirmNote:
      'Public liability limit, employers’ liability limit, insurer and renewal date.',
  },

  /**
   * The operational half. These are statements about method, and they are
   * written in the present tense because they describe how the work is run —
   * not about a certificate the company may or may not hold.
   */
  arrangements: [
    {
      number: '01',
      title: 'Risk assessments and method statements',
      body: 'Site-specific RAMS are issued before work starts, not a template with the address changed. On a programmed contract they are reissued for each phase, because the phase is what changes — the access, the occupied areas around it and the materials in use. Where a client has a permit-to-work system, we work inside it.',
    },
    {
      number: '02',
      title: 'COSHH',
      body: 'Safety data sheets and COSHH assessments are provided for every product brought on site, with the ventilation, PPE and storage requirements stated. In occupied buildings the assessment usually drives the product choice rather than the other way round — low-odour and water-based systems where people are still in the building, solvent-borne where the substrate demands it and the area can be isolated.',
    },
    {
      number: '03',
      title: 'Working in occupied buildings',
      body: 'Areas are segregated and signed, routes kept clear, and each area handed back in a usable state at the end of the shift rather than at the end of the job. Where a space has to be handed back for service the same day — a ward, a classroom, a dining room — that constraint is priced into the programme, not absorbed by working faster.',
    },
    {
      number: '04',
      title: 'Working at height and access',
      body: 'Access is agreed before the price: what can be reached from a tower, what needs a MEWP, what needs scaffold, where plant can stand, and who is supplying it. Fragile surfaces — sheet roofs, roof lights — are treated as fragile until a survey says otherwise.',
      confirm: 'asbestos-access',
      confirmNote:
        'IPAF and PASMA card holders, asbestos awareness training, and whether access plant is owned or hired in.',
    },
    {
      number: '05',
      title: 'Asbestos',
      body: 'In any building put up before 2000, we ask for sight of the asbestos register before anything is disturbed, and we do not sand, scrape or drill anything a survey has not cleared. Where the register is missing or out of date we say so in writing before we start rather than after.',
    },
    {
      number: '06',
      title: 'Waste, environment and site condition',
      body: 'Washings are contained rather than put down a drain, and paint, solvent and packaging waste is removed and disposed of through a licensed route rather than the client’s bins. Dust sheets down before, site cleared daily, and a photograph of the area as we found it where the work is in a public or trading space.',
      confirm: 'other-accreditations',
      confirmNote:
        'Any environmental policy, waste carrier registration, and whether CHAS, Constructionline or ISO 9001 / 14001 are held or in progress.',
    },
    {
      number: '07',
      title: 'People on site',
      body: 'Operatives are qualified to NVQ standard, and training is funded as the work calls for it. In schools and healthcare settings the question a client asks first is about checks on the individuals attending, not about the company.',
      confirm: 'dbs',
      confirmNote:
        'Whether operatives working in schools are DBS checked and how that record is kept.',
    },
  ],

  references: {
    title: 'References',
    body: 'References are available on request.',
    confirm: 'references',
    confirmNote:
      'Named references for education, healthcare and industrial contracts — and whether those clients have agreed to be named publicly or only to take a call.',
  },
} as const;
