import path from 'node:path';
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

import { capabilities } from '@content/copy/capabilities';
import { compliance } from '@content/copy/compliance';
import { home } from '@content/copy/home';
import { programmed } from '@content/copy/programmed';
import { neededById } from '@content/needed';
import { SECTORS } from '@content/sectors';
import { PROGRAMMED_LABELS, SERVICES } from '@content/services';
import {
  accreditation,
  coverage,
  founded,
  insurance,
  phone,
  site,
  workforce,
} from '@content/site';
import { captionFields, getRecords } from '@/lib/projects';

/**
 * The capability statement.
 *
 * Six pages, generated from the same content files the website renders from —
 * content/copy, content/services.ts, content/sectors.ts and the project MDX. It
 * cannot drift from the site, because there is nothing for it to drift from.
 *
 * This is the primary conversion action on every commercial page, ahead of a
 * phone call, for two reasons. Requesting it captures a work email, which is
 * the lead a contractor actually wants. And a buyer who has to justify an
 * appointment internally needs something to forward — no other painting
 * contractor in the region will have one.
 *
 * On the printing: the cover is full-bleed graphite and the interior pages are
 * on bone. A six-page document printed entirely on a dark ground is a document
 * nobody prints twice, and this one is meant to be handed across a desk.
 *
 * The rule that applies to the site applies here, more strictly. Where a figure
 * is outstanding this document says so, in a marked row. A capability statement
 * with an invented insurance limit in it is a document that ends a relationship.
 */

const GRAPHITE = '#14181B';
const STEEL = '#232A2F';
const CONCRETE = '#CFC9BE';
const BONE = '#F4F2EE';
const HIVIS = '#E4FF32';
const LINE = '#39424A';
const RULE_LIGHT = '#B9B2A5';

const fontDir = path.join(process.cwd(), 'public', 'fonts', 'pdf');

let registered = false;
function registerFonts() {
  if (registered) return;

  Font.register({
    family: 'Plex',
    fonts: [
      { src: path.join(fontDir, 'IBMPlexSans-Regular.ttf'), fontWeight: 400 },
      { src: path.join(fontDir, 'IBMPlexSans-Medium.ttf'), fontWeight: 500 },
    ],
  });

  Font.register({
    family: 'Schibsted',
    fonts: [
      { src: path.join(fontDir, 'SchibstedGrotesk-Bold.ttf'), fontWeight: 700 },
      { src: path.join(fontDir, 'SchibstedGrotesk-ExtraBold.ttf'), fontWeight: 800 },
    ],
  });

  // react-pdf hyphenates by default, which puts breaks in the middle of words
  // like "SafeContractor". Off.
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}

const s = StyleSheet.create({
  page: {
    backgroundColor: BONE,
    color: GRAPHITE,
    fontFamily: 'Plex',
    fontSize: 8.5,
    lineHeight: 1.5,
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 44,
  },
  coverPage: {
    backgroundColor: GRAPHITE,
    color: BONE,
    fontFamily: 'Plex',
    fontSize: 9,
    lineHeight: 1.55,
    padding: 46,
  },

  label: {
    fontFamily: 'Plex',
    fontWeight: 500,
    fontSize: 6.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#5A6169',
  },
  labelDark: { color: CONCRETE },

  h1: { fontFamily: 'Schibsted', fontWeight: 800, fontSize: 30, lineHeight: 1.04, letterSpacing: -0.6 },
  h2: { fontFamily: 'Schibsted', fontWeight: 800, fontSize: 15, lineHeight: 1.12, letterSpacing: -0.3 },
  h3: { fontFamily: 'Schibsted', fontWeight: 700, fontSize: 10, lineHeight: 1.2 },

  body: { fontSize: 8.5, lineHeight: 1.5 },
  bodyDark: { fontSize: 9, lineHeight: 1.5, color: CONCRETE },

  rule: { borderTopWidth: 0.75, borderTopColor: RULE_LIGHT, borderTopStyle: 'solid' },
  ruleDark: { borderTopWidth: 0.75, borderTopColor: LINE, borderTopStyle: 'solid' },
  ruleHeavy: { borderTopWidth: 1.5, borderTopColor: GRAPHITE, borderTopStyle: 'solid' },

  row: { flexDirection: 'row' },
  cell: { paddingVertical: 4, paddingRight: 8 },

  /**
   * The running footer: a rule and two lines of label type, repeated on every
   * interior sheet.
   *
   * It is three absolutely positioned siblings rather than one flex row, and
   * every one of them carries an explicit `lineHeight`. Both of those are
   * load-bearing, and both were found by rendering the document and looking at
   * it rather than by reading the code:
   *
   *   - An absolutely positioned box with `bottom` set and no height resolves
   *     against the page rather than its own content once the page fills up. It
   *     stretches the full height of the sheet and paints over everything on
   *     it. On a short page it behaves perfectly, which is how a bug like that
   *     survives a quick look and only appears on the pages that matter.
   *
   *   - The page sets `lineHeight: 1.5` and it is inherited. At 6.5pt that is a
   *     9.75pt line box, taller than a footer this short, and the overflow is
   *     clipped rather than shown — the rule draws and the text silently does
   *     not.
   */
  footerRule: {
    position: 'absolute',
    bottom: 40,
    left: 46,
    right: 46,
    height: 0.75,
    backgroundColor: RULE_LIGHT,
  },
  footerLeft: {
    position: 'absolute',
    bottom: 26,
    left: 46,
    lineHeight: 1.2,
  },
  footerRight: {
    position: 'absolute',
    bottom: 26,
    right: 46,
    textAlign: 'right',
    lineHeight: 1.2,
  },

  outstanding: {
    borderLeftWidth: 3,
    borderLeftColor: GRAPHITE,
    borderLeftStyle: 'solid',
    backgroundColor: '#E8E5DF',
    paddingVertical: 6,
    paddingHorizontal: 9,
    marginTop: 8,
  },
});

/**
 * The statement is a summary, not a reprint of the site, and it has six pages
 * to do it in. Rather than keep a second, shorter copy of every paragraph —
 * which would drift the moment one of them was edited — the long-form copy is
 * cut to its opening sentences here.
 *
 * The first sentence of each of these paragraphs carries the point; the rest is
 * the supporting detail, and the detail is what the website is for.
 */
function opening(text: string, sentences = 1): string {
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!parts) return text;
  return parts.slice(0, sentences).join('').trim();
}

function Label({ children, dark }: { children: string; dark?: boolean }) {
  return <Text style={[s.label, ...(dark ? [s.labelDark] : [])]}>{children}</Text>;
}

/** The same marker as on the site: an outstanding question, not a claim. */
function Outstanding({ id, note }: { id: string; note?: string }) {
  const needed = neededById(id);
  if (!needed) return null;
  return (
    <View style={s.outstanding}>
      <Text style={[s.label, { color: GRAPHITE }]}>To be confirmed</Text>
      <Text style={[s.body, { marginTop: 2 }]}>{note ?? needed.question}</Text>
    </View>
  );
}

/**
 * The running footer: the company's registered details on the left, the section
 * on the right, repeated on every interior sheet.
 *
 * Deliberately not a page number. react-pdf can supply one through a `render`
 * prop, and it works when this document is rendered by a plain Node script —
 * but not once the same code goes through the app's bundler, where the callback
 * never runs and that half of the footer comes out empty. A number that is
 * sometimes there and sometimes not is worse than no number, and a hardcoded
 * one becomes a lie the first time a paragraph grows and a section reflows onto
 * a second sheet. The section name is true either way.
 */
function PageFooter({ section }: { section: string }) {
  return (
    <>
      <View style={s.footerRule} fixed />
      <Text style={[s.label, s.footerLeft]} fixed>
        {site.legalName} · Company no. {site.companyNumber}
      </Text>
      <Text style={[s.label, s.footerRight]} fixed>
        {section}
      </Text>
    </>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Label>{number}</Label>
      <Text style={[s.h2, { marginTop: 4 }]}>{title}</Text>
      <View style={[s.ruleHeavy, { marginTop: 8 }]} />
    </View>
  );
}

/**
 * Rendered here rather than in the route handler so the JSX stays in a .tsx
 * file — a Next route handler is route.ts, and JSX does not belong in it.
 */
export async function renderCapabilityStatement(): Promise<Buffer> {
  const issued = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  }).format(new Date());

  return renderToBuffer(<CapabilityStatement issued={issued} />);
}

export function CapabilityStatement({ issued }: { issued: string }) {
  registerFonts();

  const records = getRecords().filter((r) => r.status !== 'wanted').slice(0, 3);

  const meta: [string, string][] = [
    ['Coverage', 'United Kingdom'],
    ['Base', site.base],
    ['Accreditation', `${accreditation.name} · assessed by ${accreditation.body}`],
    ['Company number', site.companyNumber],
    ['Operatives', `Qualified to ${workforce.qualification} standard`],
    ['Issued', issued],
  ];

  return (
    <Document
      title={`Capability statement — ${site.legalName}`}
      author={site.legalName}
      subject="Commercial and industrial painting contracts"
      creator={site.legalName}
      producer={site.legalName}
    >
      {/* 1 — Cover sheet ------------------------------------------------- */}
      <Page size="A4" style={s.coverPage}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Label dark>Capability statement</Label>
          <Label dark>{issued}</Label>
        </View>

        <View style={{ marginTop: 150 }}>
          <Text style={[s.h1, { color: BONE }]}>{site.legalName}</Text>
          <Text style={[s.h2, { color: HIVIS, marginTop: 14 }]}>
            Commercial and industrial painting contractors
          </Text>
          <View style={{ borderTopWidth: 3, borderTopColor: HIVIS, borderTopStyle: 'solid', width: 120, marginTop: 20 }} />
          <Text style={[s.bodyDark, { marginTop: 20, maxWidth: 380 }]}>
            {coverage.wider}. Day-to-day work from {coverage.localLong}.
          </Text>
        </View>

        <View style={{ marginTop: 'auto' }}>
          <View style={s.ruleDark} />
          {meta.map(([k, v]) => (
            <View key={k} style={[s.row, s.ruleDark]}>
              <View style={[s.cell, { width: 130 }]}>
                <Label dark>{k}</Label>
              </View>
              <View style={[s.cell, { flex: 1 }]}>
                <Text style={[s.body, { color: BONE }]}>{v}</Text>
              </View>
            </View>
          ))}
          <View style={[s.row, { marginTop: 20, justifyContent: 'space-between' }]}>
            <View>
              <Label dark>Contact</Label>
              <Text style={[s.h2, { color: BONE, marginTop: 4 }]}>
                {phone.who} · {phone.display}
              </Text>
            </View>
            <View>
              <Label dark>Website</Label>
              <Text style={[s.body, { color: BONE, marginTop: 4 }]}>
                {site.url.replace(/^https?:\/\//, '')}
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/* 2 — Capability summary and schedule of works --------------------- */}
      <Page size="A4" style={s.page}>
        <SectionTitle number="01" title="What we do" />

        <Text style={[s.body, { maxWidth: 460 }]}>{home.sheet.standfirst}</Text>

        <View style={[s.row, { marginTop: 22 }]}>
          {home.figures.map((f) => (
            <View key={f.label} style={{ flex: 1, paddingRight: 10 }}>
              <View style={[s.ruleHeavy, { marginBottom: 8 }]} />
              <Text style={{ fontFamily: 'Schibsted', fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>
                {f.figure}
              </Text>
              <View style={{ marginTop: 5 }}>
                <Label>{f.label}</Label>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 28 }}>
          <Text style={s.h3}>Schedule of works</Text>
          <View style={[s.ruleHeavy, { marginTop: 8 }]} />
          <View style={[s.row, s.rule]}>
            <View style={[s.cell, { width: 118 }]}>
              <Label>Service</Label>
            </View>
            <View style={[s.cell, { flex: 1 }]}>
              <Label>Typical application</Label>
            </View>
            <View style={[s.cell, { width: 92 }]}>
              <Label>Programmed</Label>
            </View>
          </View>
          {SERVICES.map((row) => (
            <View key={row.service} style={[s.row, s.rule]} wrap={false}>
              <View style={[s.cell, { width: 118 }]}>
                <Text style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 8.5 }}>
                  {row.service}
                </Text>
              </View>
              <View style={[s.cell, { flex: 1 }]}>
                <Text style={{ fontSize: 8.5, lineHeight: 1.45 }}>{row.application}</Text>
              </View>
              <View style={[s.cell, { width: 92 }]}>
                <Text style={{ fontSize: 8.5 }}>{PROGRAMMED_LABELS[row.programmed]}</Text>
              </View>
            </View>
          ))}
        </View>

        <PageFooter section="Capability" />
      </Page>

      {/* 3 — Sector experience ------------------------------------------- */}
      <Page size="A4" style={s.page}>
        <SectionTitle number="02" title="Sectors" />

        {SECTORS.map((sector) => (
          <View key={sector.number} style={[s.row, s.rule, { paddingVertical: 7 }]} wrap={false}>
            <View style={{ width: 34 }}>
              <Text style={{ fontFamily: 'Schibsted', fontWeight: 800, fontSize: 13, letterSpacing: -0.3 }}>
                {sector.number}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.h3}>{sector.label}</Text>
              <Text style={{ fontSize: 8.5, lineHeight: 1.5, marginTop: 3 }}>{sector.summary}</Text>
            </View>
          </View>
        ))}

        <View style={{ marginTop: 26 }}>
          <Text style={s.h3}>{programmed.sheet.title}</Text>
          <View style={[s.rule, { marginTop: 6, marginBottom: 8 }]} />
          <Text style={[s.body, { maxWidth: 470 }]}>{opening(programmed.sheet.standfirst, 1)}</Text>
          <View style={{ marginTop: 12 }}>
            {programmed.stages.map((stage) => (
              <View key={stage.number} style={[s.row, { marginTop: 8 }]} wrap={false}>
                <View style={{ width: 34 }}>
                  <Label>{stage.number}</Label>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 8.5 }}>
                    {stage.title}
                  </Text>
                  <Text style={{ fontSize: 8.5, lineHeight: 1.5, marginTop: 2 }}>
                    {opening(stage.body)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <PageFooter section="Sectors" />
      </Page>

      {/* 4 — Compliance and accreditation -------------------------------- */}
      <Page size="A4" style={s.page}>
        <SectionTitle number="03" title="Compliance and accreditation" />

        <Text style={s.h3}>{compliance.accreditation.title}</Text>
        {compliance.accreditation.body.map((para, i) => (
          <Text key={i} style={[s.body, { marginTop: 6, maxWidth: 470 }]}>
            {opening(para)}
          </Text>
        ))}
        <Outstanding
          id={compliance.accreditation.confirm}
          note={compliance.accreditation.confirmNote}
        />

        <View style={{ marginTop: 20 }}>
          <Text style={s.h3}>{compliance.insurance.title}</Text>
          <View style={[s.rule, { marginTop: 6 }]} />
          <View style={[s.row, s.rule]}>
            <View style={[s.cell, { width: 150 }]}>
              <Label>Public liability</Label>
            </View>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.body}>{insurance.publicLiability ?? 'To be confirmed'}</Text>
            </View>
          </View>
          <View style={[s.row, s.rule]}>
            <View style={[s.cell, { width: 150 }]}>
              <Label>Employers’ liability</Label>
            </View>
            <View style={[s.cell, { flex: 1 }]}>
              <Text style={s.body}>{insurance.employersLiability ?? 'To be confirmed'}</Text>
            </View>
          </View>
          <Outstanding id={compliance.insurance.confirm} note={compliance.insurance.confirmNote} />
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={s.h3}>Arrangements</Text>
          <View style={[s.ruleHeavy, { marginTop: 6 }]} />
          {compliance.arrangements.map((item) => (
            <View key={item.number} style={[s.row, s.rule, { paddingVertical: 6 }]} wrap={false}>
              <View style={{ width: 34, paddingTop: 2 }}>
                <Label>{item.number}</Label>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 8.5 }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 8.5, lineHeight: 1.5, marginTop: 2 }}>
                  {opening(item.body)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <PageFooter section="Compliance" />
      </Page>

      {/* 5 — Site records ------------------------------------------------- */}
      <Page size="A4" style={s.page}>
        <SectionTitle number="04" title="Site records" />

        <Text style={[s.body, { maxWidth: 470, marginBottom: 16 }]}>
          Each record carries the same seven fields so two jobs can be compared without
          reading two paragraphs. Where a field has not been confirmed with the client it
          is marked outstanding rather than filled in.
        </Text>

        {records.map((record) => (
          <View key={record.slug} style={{ marginBottom: 18 }} wrap={false}>
            <Text style={s.h3}>{record.title}</Text>
            <Text style={{ fontSize: 8.5, lineHeight: 1.5, marginTop: 3, marginBottom: 6 }}>
              {record.summary}
            </Text>
            <View style={s.ruleHeavy} />
            {captionFields(record).map((field) => (
              <View key={field.label} style={[s.row, s.rule]}>
                <View style={[s.cell, { width: 150 }]}>
                  <Label>{field.label}</Label>
                </View>
                <View style={[s.cell, { flex: 1 }]}>
                  <Text style={[s.body, !field.value ? { color: '#6C7078' } : {}]}>
                    {field.value ?? 'To be confirmed'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        <PageFooter section="Site records" />
      </Page>

      {/* 6 — Contact ------------------------------------------------------ */}
      <Page size="A4" style={s.page}>
        <SectionTitle number="05" title="Contact" />

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Label>Enquiries</Label>
            <Text style={[s.h2, { marginTop: 4 }]}>{phone.who}</Text>
            <Text style={[s.h2, { marginTop: 2 }]}>{phone.display}</Text>
            <Text style={[s.body, { marginTop: 10, maxWidth: 240 }]}>
              {site.url.replace(/^https?:\/\//, '')}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Label>Registered details</Label>
            <View style={[s.rule, { marginTop: 6 }]} />
            {[
              ['Registered name', site.legalName],
              ['Company number', site.companyNumber],
              ['Base', site.base],
              ['Coverage', coverage.wider],
              ...(founded.year ? ([['Trading since', String(founded.year)]] as [string, string][]) : []),
            ].map(([k, v]) => (
              <View key={k} style={[s.row, s.rule]}>
                <View style={[s.cell, { width: 100 }]}>
                  <Label>{k}</Label>
                </View>
                <View style={[s.cell, { flex: 1 }]}>
                  <Text style={s.body}>{v}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={s.h3}>{capabilities.answered.title}</Text>
          <View style={[s.ruleHeavy, { marginTop: 6 }]} />
          {capabilities.answered.items.map((item) => (
            <View key={item.q} style={[s.rule, { paddingVertical: 7 }]} wrap={false}>
              <Text style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 8.5 }}>{item.q}</Text>
              <Text style={{ fontSize: 8.5, lineHeight: 1.5, marginTop: 2 }}>
                {opening(item.a, 2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 26, borderTopWidth: 3, borderTopColor: GRAPHITE, borderTopStyle: 'solid', paddingTop: 10 }}>
          <Text style={[s.body, { color: STEEL, maxWidth: 470 }]}>
            This statement is generated from the same content as{' '}
            {site.url.replace(/^https?:\/\//, '')}, so the two cannot disagree. Anything
            marked “to be confirmed” is outstanding rather than omitted.
          </Text>
        </View>

        <PageFooter section="Contact" />
      </Page>
    </Document>
  );
}
