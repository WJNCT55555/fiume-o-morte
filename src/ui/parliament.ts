/* ==========================================================================
   A single-chamber seat chart, for anything that counts votes rather than
   sitting a council — the election results event is the first caller.

   Sibling of `arengo.ts`, and deliberately separate from it: the Arengo is two
   statutory councils that exist only once the Charter is promulgated, while this
   is one ad-hoc hemicycle for a tally (an election, a division, a congress). The
   chart geometry comes from `d3-parliament`, which draws into a host node and
   does NOT create the SVG root, so this module builds it.

   This is a real ES module; the legacy UI is a no-build IIFE and cannot import
   it, so `mountRenderer` exposes it on `globalThis.Fiume.Parliament`.
   ========================================================================== */

import { parliament } from '../lib/d3-parliament';

interface SeatBloc {
  /** Party id, used as the swatch class and the DOM key. */
  id: string;
  /** Already resolved to the active language by the caller. */
  name: string;
  seats: number;
  color: string;
}

interface SeatTally {
  seats: SeatBloc[];
  /** Chamber size for the caption; defaults to the sum of the blocs. */
  total?: number;
  /** Caption under the chart, already localised. */
  caption?: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag: string, cls?: string, text?: string): HTMLElement {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/** Build the chart plus its legend. Pure DOM; the caller appends the result. */
export function renderParliament(tally: SeatTally): HTMLElement {
  const blocs = (tally.seats || []).filter(b => b.seats > 0);
  const total = tally.total != null
    ? tally.total
    : blocs.reduce((sum, b) => sum + b.seats, 0);

  const wrap = el('div', 'parliament-tally');
  if (!blocs.length || total <= 0) {
    wrap.appendChild(el('div', 'assembly-empty', tally.caption || ''));
    return wrap;
  }

  /* ---- the hemicycle ---- */
  const chartBox = el('div', 'parliament-tally__chart');
  const width = 520;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'parliament-tally__svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${width / 2}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  chartBox.appendChild(svg);
  wrap.appendChild(chartBox);

  const chart = parliament().width(width) as unknown as
    (node: Element) => (data: Array<{ id: string; seats: number; color: string }>) => void;
  chart(svg)(blocs.map(b => ({ id: b.id, seats: b.seats, color: b.color })));

  /* ---- the legend: party, seats, share, read down ----
     Same order as the arcs above it, so the first swatch is always the leftmost
     bloc. Re-sorting by size here would break that correspondence. */
  const table = el('div', 'parliament-tally__legend');
  table.setAttribute('role', 'table');
  const share = (n: number) => Math.round((n / total) * 100) + '%';
  blocs.forEach(b => {
    const row = el('div', 'parliament-tally__row');
    const sw = el('span', 'parliament-tally__sw');
    sw.style.background = b.color;
    const nm = el('span', 'parliament-tally__n', b.name);
    const seats = el('b', 'parliament-tally__v num', String(b.seats));
    const pct = el('span', 'parliament-tally__p num', share(b.seats));
    row.appendChild(sw); row.appendChild(nm); row.appendChild(seats); row.appendChild(pct);
    table.appendChild(row);
  });
  wrap.appendChild(table);

  if (tally.caption) wrap.appendChild(el('div', 'parliament-tally__cap tiny dim2', tally.caption));
  return wrap;
}

/** Expose for the legacy IIFE, which cannot import this module. */
export function mountRenderer(): void {
  const g = globalThis as unknown as { Fiume?: Record<string, unknown> };
  g.Fiume = g.Fiume || {};
  g.Fiume.Parliament = { render: renderParliament };
}
