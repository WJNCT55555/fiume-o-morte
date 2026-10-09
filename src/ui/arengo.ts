/* ==========================================================================
   The Arengo — UI for the Charter's two councils.
   Bicameral by design: the Consiglio degli Ottimi (apportioned to the citizen
   body, three-year term) and the Consiglio dei Provvisori (the nine Corporations,
   60 seats). Both only exist once the Charter has been promulgated, so this
   module renders the empty state until `state.arengo` is present.

   This is a real ES module so it can import the chart directly; the legacy UI is
   a no-build IIFE and cannot, so `mountRenderer` exposes it on
   `globalThis.Fiume.Arengo` for views.js to call. The engine work
   (R.conveneArengo / R.ottimiChamber / R.provvisoriChamber) lives in rules.js —
   nothing here computes a seat.
   ========================================================================== */

import { parliament } from '../lib/d3-parliament';

interface PartySeat { id: string; zh: string; it: string; color: string; seats: number }

interface ChamberView {
  seats: number;
  byParty: Record<string, number>;
  byFaction?: Record<string, number>;
  byCorporation?: Record<string, { id: string; zh: string; it: string; seats: number; byParty: Record<string, number>; winner: string | null; share: number }>;
  citizens?: number;
  franchiseLevel?: number;
  termStart?: number;
  termEnd?: number | null;
}

interface ArengoState {
  ottimi: ChamberView;
  provvisori: ChamberView;
  convened: number;
}

interface Globals {
  Fiume?: {
    World?: {
      /** `order` is the left-to-right seat-chart axis declared in parties.js. */
      PARTY_BY_ID: Record<string, { zh: string; it: string; color: string; order?: number }>;
      FACTIONS?: Array<{ id: string; zh: string; it?: string; color?: string; order?: number }>;
    };
    I18N?: { lang?: string; t: (key: string, vars?: Record<string, string | number>) => string; L: (node: unknown) => string };
  };
}

function globals(): Globals {
  return (typeof globalThis !== 'undefined' ? globalThis : (window as unknown as Globals)) as Globals;
}

/** UI string in the active locale. Keeps this module out of the hardcoded-Chinese
    set: everything it prints goes through the shared catalogue. */
function T(key: string, vars?: Record<string, string | number>): string {
  const i18n = globals().Fiume?.I18N;
  return i18n ? i18n.t(key, vars) : key;
}

/** A content node ({zh, it}) in the active locale.
    Reads `I18N.lang` directly rather than going through `I18N.L`: this module is
    mounted by the React shell, and the indirection left the chamber legends
    printing Chinese in the Italian locale. `Core.L` is the same rule, spelled
    out here so the locale is unambiguous at the call site. */
function L(node: { zh?: string; it?: string } | undefined | null): string {
  if (node == null) return '';
  const lang = globals().Fiume?.I18N?.lang;
  if (lang === 'it') return node.it || node.zh || '';
  return node.zh || node.it || '';
}

/** Party blocs as the chart wants them, seated left to right along the spectrum.
    The chart hands contiguous arcs to parties in array order, so this order IS the
    seating plan: it must be the political axis (`W.PARTIES[].order`), not a
    ranking by size. A hemicycle sorted by seats tells you who won; sorted by
    ideology it tells you where the chamber stands, which is what the two councils
    are for. Parties absent from the table fall to the right, keeping their
    data order so nothing is silently dropped. */
function partyBlocs(byParty: Record<string, number>): PartySeat[] {
  const world = globals().Fiume?.World;
  const parties = world?.PARTY_BY_ID || {};
  const axis = (id: string) => {
    const o = parties[id]?.order;
    return typeof o === 'number' ? o : Number.MAX_SAFE_INTEGER;
  };
  return Object.keys(byParty)
    .filter(id => (byParty[id] || 0) > 0)
    .map(id => ({
      id,
      zh: parties[id]?.zh || id,
      it: parties[id]?.it || id,
      color: parties[id]?.color || '#8A7A5A',
      seats: byParty[id]
    }))
    .sort((a, b) => axis(a.id) - axis(b.id));
}

function el(tag: string, cls?: string, text?: string): HTMLElement {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/** One chamber: a caption, a hemicycle and a legend. */
function chamber(title: string, subtitle: string, blocs: PartySeat[], total: number, note?: string): HTMLElement {
  const box = el('div', 'arengo-chamber');
  const head = el('div', 'arengo-chamber__head');
  head.appendChild(el('strong', undefined, title));
  head.appendChild(el('span', 'tiny dim', subtitle));
  box.appendChild(head);

  const seatHost = el('div', 'arengo-chamber__chart');
  box.appendChild(seatHost);
  if (total > 0) {
    /* The chart draws into an SVG root it does not create, and it positions seats
       in absolute units around the centre. Without width/height attributes the
       root defaults to 300×150 and swallows every seat, so they are set here
       alongside the viewBox rather than left to the stylesheet. */
    const w = 520, h = w / 2;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'arengo-chamber__svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('role', 'img');
    seatHost.appendChild(svg);
    const chart = parliament().width(w) as unknown as
      (node: Element) => (data: Array<{ id: string; seats: number; color: string }>) => void;
    chart(svg)(blocs.map(b => ({ id: b.id, seats: b.seats, color: b.color })));
  } else {
    seatHost.appendChild(el('div', 'assembly-empty', T('ar.empty')));
  }

  const legend = el('div', 'arengo-legend');
  blocs.forEach(b => {
    const row = el('span', 'arengo-legend__item');
    const sw = el('span', 'swatch');
    sw.style.background = b.color;
    row.appendChild(sw);
    row.appendChild(el('span', undefined, L(b)));
    row.appendChild(el('b', 'num', T('ar.seats', { n: b.seats })));
    legend.appendChild(row);
  });
  box.appendChild(legend);
  if (note) box.appendChild(el('div', 'tiny dim2', note));
  return box;
}

/** The Corporations, each with its own blocs — this is what "elected by the nine
    Corporations" actually looks like, so it is shown rather than summarised. */
function corporationTable(prov: ChamberView): HTMLElement {
  const box = el('div', 'arengo-corps');
  const corps = prov.byCorporation || {};
  Object.keys(corps).forEach(cid => {
    const c = corps[cid];
    const row = el('div', 'arengo-corps__row');
    row.appendChild(el('span', 'arengo-corps__name', L(c)));
    row.appendChild(el('b', 'num', T('ar.seats', { n: c.seats })));
    const blocs = partyBlocs(c.byParty).map(b => L(b) + ' ' + b.seats).join(' · ');
    row.appendChild(el('span', 'tiny', blocs));
    box.appendChild(row);
  });
  return box;
}

/** Faction split of the player's own seats — the Legion is not one party. */
function factionNote(byFaction: Record<string, number> | undefined): string | null {
  if (!byFaction || !Object.keys(byFaction).length) return null;
  const factions = globals().Fiume?.World?.FACTIONS || [];
  const name = (id: string) => L(factions.filter(f => f.id === id)[0] || { zh: id });
  return T('ar.legionByFaction') + Object.keys(byFaction).map(id => name(id) + ' ' + byFaction[id]).join(' · ');
}

export function renderArengo(host: HTMLElement, state: { arengo?: ArengoState | null }): void {
  host.innerHTML = '';
  const a = state.arengo;

  if (!a) {
    const empty = el('div', 'assembly-empty');
    empty.appendChild(el('strong', undefined, T('ar.notconvoked')));
    empty.appendChild(el('span', undefined, T('ar.notconvoked.n')));
    host.appendChild(empty);
    return;
  }

  const wrap = el('div', 'arengo');
  wrap.appendChild(chamber(
    T('ar.ottimi'),
    T('ar.ottimi.rule'),
    partyBlocs(a.ottimi.byParty),
    a.ottimi.seats,
    [a.ottimi.citizens != null ? T('ar.citizens', { n: a.ottimi.citizens.toLocaleString() }) : null,
     a.ottimi.franchiseLevel != null ? T('ar.franchise', { n: a.ottimi.franchiseLevel }) : null,
     a.ottimi.termEnd != null ? T('ar.termEnd', { n: a.ottimi.termEnd }) : null,
     factionNote(a.ottimi.byFaction)].filter(Boolean).join(' · ')
  ));

  wrap.appendChild(chamber(
    T('ar.provvisori'),
    /* Counted from the chamber's own data, so the caption and the table below it
       cannot disagree. */
    T('ar.provvisori.rule', {
      c: Object.keys(a.provvisori.byCorporation || {}).length,
      n: a.provvisori.seats
    }),
    partyBlocs(a.provvisori.byParty),
    a.provvisori.seats,
    factionNote(a.provvisori.byFaction) || undefined
  ));

  wrap.appendChild(corporationTable(a.provvisori));
  host.appendChild(wrap);
}

/** Expose for the legacy IIFE, which cannot import this module. */
export function mountRenderer(): void {
  const g = globals() as Globals & { Fiume?: Record<string, unknown> };
  g.Fiume = g.Fiume || {};
  (g.Fiume as Record<string, unknown>).Arengo = { render: renderArengo };
}
