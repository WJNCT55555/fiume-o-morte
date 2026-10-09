/* ==========================================================================
   Parliament seat chart — dependency-free.
   The layout is the classic d3-parliament arc packing: the hemicycle is divided
   into concentric rows sized so that the total seat count fits, seats are placed
   evenly along each row, then sorted by angle and handed to the parties in the
   order given, so a party's bloc reads as a contiguous wedge.
   This file keeps the original factory API (`parliament()(...)` with chainable
   `.width()` / `.enter` / `.update` / `.exit` / `.on`) but renders with plain DOM
   and SVG: the project ships no d3, and the rest of the UI is dependency-free
   (see src/legacy/ui/lib/charts.js), so adding a ~30-package charting stack for
   one arc diagram was not worth it.
   Usage:
     const chart = parliament().width(620).on('click', cb);
     chart(selectionLikeNode)([{ id:'LEG', seats:20, color:'#C9A227' }, ...]);
   ========================================================================== */

export interface ParliamentParty {
  id?: string;
  seats: number | unknown[];
  color?: string;
  [key: string]: unknown;
}

interface SeatPoint {
  polar: { r: number; teta: number };
  cartesian: { x: number; y: number };
  party?: ParliamentParty;
  data?: unknown;
}

export interface ParliamentChart {
  (node: Element | null): (data: ParliamentParty[]) => void;
  width(value?: number): unknown;
  height(value?: number): unknown;
  innerRadiusCoef(value?: number): unknown;
  enter: { smallToBig(value?: boolean): unknown; fromCenter(value?: boolean): unknown };
  update: { animate(value?: boolean): unknown };
  exit: { bigToSmall(value?: boolean): unknown; toCenter(value?: boolean): unknown };
  on(type: string, callback: ((event: Event, d: SeatPoint) => void) | null): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Number of seats in a party entry, whether it is a bloc or an explicit list. */
function seatsOf(party: ParliamentParty): number {
  return typeof party.seats === 'number' ? Math.floor(party.seats) : party.seats.length;
}

function sumSeries(fn: (i: number) => number, n: number): number {
  let r = 0;
  for (let i = 0; i <= n; i++) r += fn(i);
  return r;
}

export function parliament(): ParliamentChart {
  let width: number | undefined;
  let height: number | undefined;
  let innerRadiusCoef = 0.4;

  const enterFlags = { smallToBig: true, fromCenter: true };
  const updateFlags = { animate: true };
  const exitFlags = { bigToSmall: true, toCenter: true };
  const listeners: Record<string, Array<(event: Event, d: SeatPoint) => void>> = {};

  /** One canvas per host element, so repeated calls animate rather than rebuild. */
  const state = new WeakMap<Element, {
    seats: SeatPoint[];
    circles: SVGCircleElement[];
    layer: SVGGElement;
    transform: string;
  }>();

  function makeParliamentFn() {
    return function draw(data: ParliamentParty[]): void {
      if (!host) return;

      const w = width ?? (host.getBoundingClientRect().width || 620);
      const h = height ?? w / 2;
      const outerR = Math.min(w / 2, h);
      const innerR = outerR * innerRadiusCoef;

      /* ---- how many seats, and how many rows to fit them in ---- */
      let nSeats = 0;
      data.forEach(p => { nSeats += seatsOf(p); });

      let nRows = 0;
      let maxSeatNumber = 0;
      let b = 0.5;
      const rowCoef = innerRadiusCoef / (1 - innerRadiusCoef);
      while (maxSeatNumber < nSeats) {
        nRows++;
        b += rowCoef;
        maxSeatNumber = sumSeries((i: number) => Math.floor(Math.PI * (b + i)), nRows - 1);
      }
      if (nRows === 0) nRows = 1;

      /* ---- lay the seats out along the rows ---- */
      const rowWidth = (outerR - innerR) / nRows;
      const seats: SeatPoint[] = [];
      const seatsToRemove = maxSeatNumber - nSeats;
      for (let i = 0; i < nRows; i++) {
        const rowRadius = innerR + rowWidth * (i + 0.5);
        const rowSeats = Math.floor(Math.PI * (b + i))
          - Math.floor(seatsToRemove / nRows)
          - (seatsToRemove % nRows > i ? 1 : 0);
        if (rowSeats <= 0) continue;
        const anglePerSeat = Math.PI / rowSeats;
        for (let j = 0; j < rowSeats; j++) {
          const polar = { r: rowRadius, teta: -Math.PI + anglePerSeat * (j + 0.5) };
          seats.push({
            polar,
            cartesian: { x: polar.r * Math.cos(polar.teta), y: polar.r * Math.sin(polar.teta) }
          });
        }
      }
      seats.sort((a, b2) => a.polar.teta - b2.polar.teta || b2.polar.r - a.polar.r);

      /* ---- hand contiguous blocs to the parties, left to right ---- */
      let partyIndex = 0;
      let seatIndex = 0;
      seats.forEach(s => {
        let party = data[partyIndex];
        if (!party) return;
        let n = seatsOf(party);
        if (seatIndex >= n) {
          partyIndex++;
          seatIndex = 0;
          party = data[partyIndex];
          if (!party) return;
          n = seatsOf(party);
        }
        s.party = party;
        s.data = typeof party.seats === 'number' ? null : party.seats[seatIndex];
        seatIndex++;
      });

      const seatRadius = (d: SeatPoint) => {
        let r = 0.4 * rowWidth;
        const extra = d.data as { size?: number } | null;
        if (extra && typeof extra.size === 'number') r *= extra.size;
        return Math.max(0.6, r);
      };

      /* ---- render ---- */
      const prev = state.get(host);
      const layer = prev?.layer ?? document.createElementNS(SVG_NS, 'g');
      if (!prev) {
        layer.setAttribute('class', 'parliament');
        host.appendChild(layer);
      }
      const transform = `translate(${w / 2},${outerR})`;
      layer.setAttribute('transform', transform);

      const circles = prev?.circles ?? [];
      const reuse = Math.min(circles.length, seats.length);

      for (let i = 0; i < seats.length; i++) {
        const d = seats[i];
        let c = circles[i];
        const fresh = !c;
        if (fresh) {
          c = document.createElementNS(SVG_NS, 'circle');
          c.setAttribute('class', 'seat');
          layer.appendChild(c);
          circles[i] = c;
        }
        c.setAttribute('class', 'seat ' + ((d.party && d.party.id) || ''));
        const colour = d.party && (d.party.color as string | undefined);
        if (colour) c.setAttribute('fill', colour);
        const r = seatRadius(d);
        if (fresh && (enterFlags.fromCenter || enterFlags.smallToBig)) {
          /* Draw at the centre/tiny, then transition out — CSS handles the tween
             (`.seat { transition: ... }`), so no animation library is needed. */
          c.setAttribute('cx', enterFlags.fromCenter ? '0' : String(d.cartesian.x));
          c.setAttribute('cy', enterFlags.fromCenter ? '0' : String(d.cartesian.y));
          c.setAttribute('r', enterFlags.smallToBig ? '0' : String(r));
          void c.getBoundingClientRect();
        }
        c.setAttribute('cx', String(d.cartesian.x));
        c.setAttribute('cy', String(d.cartesian.y));
        c.setAttribute('r', String(r));
        bindEvents(c, d);
      }

      /* Any surplus circles are seats that no longer exist. */
      for (let i = seats.length; i < circles.length; i++) {
        const c = circles[i];
        if (exitFlags.toCenter) { c.setAttribute('cx', '0'); c.setAttribute('cy', '0'); }
        if (exitFlags.bigToSmall) c.setAttribute('r', '0');
        if (c.parentNode) c.parentNode.removeChild(c);
      }
      circles.length = seats.length;
      void reuse;

      state.set(host, { seats, circles, layer, transform });
    };
  }

  /* The d3 version was applied to a selection; here it is applied to one node. */
  let host: Element | null = null;
  let drawFn: ((data: ParliamentParty[]) => void) | null = null;

  function bindEvents(node: SVGCircleElement, d: SeatPoint) {
    Object.keys(listeners).forEach(type => {
      const fns = listeners[type];
      if (!fns || !fns.length) return;
      node.addEventListener(type, (event: Event) => {
        fns.forEach(fn => { try { fn(event, d); } catch (e) { /* a listener must not kill the chart */ } });
      });
    });
  }

  const parliamentFn = function (node: Element | null): (data: ParliamentParty[]) => void {
    host = node;
    if (!drawFn) drawFn = makeParliamentFn();
    return drawFn;
  } as unknown as ParliamentChart;

  parliamentFn.width = function (value?: number): unknown {
    if (!arguments.length) return width;
    width = value;
    return parliamentFn;
  };
  parliamentFn.height = function (value?: number): unknown {
    if (!arguments.length) return height;
    height = value;
    return parliamentFn;
  };
  parliamentFn.innerRadiusCoef = function (value?: number): unknown {
    if (!arguments.length) return innerRadiusCoef;
    innerRadiusCoef = value!;
    return parliamentFn;
  };

  parliamentFn.enter = {
    smallToBig: function (value?: boolean): unknown {
      if (!arguments.length) return enterFlags.smallToBig;
      enterFlags.smallToBig = value!;
      return parliamentFn.enter;
    },
    fromCenter: function (value?: boolean): unknown {
      if (!arguments.length) return enterFlags.fromCenter;
      enterFlags.fromCenter = value!;
      return parliamentFn.enter;
    }
  };

  parliamentFn.update = {
    animate: function (value?: boolean): unknown {
      if (!arguments.length) return updateFlags.animate;
      updateFlags.animate = value!;
      return parliamentFn.update;
    }
  };

  parliamentFn.exit = {
    bigToSmall: function (value?: boolean): unknown {
      if (!arguments.length) return exitFlags.bigToSmall;
      exitFlags.bigToSmall = value!;
      return parliamentFn.exit;
    },
    toCenter: function (value?: boolean): unknown {
      if (!arguments.length) return exitFlags.toCenter;
      exitFlags.toCenter = value!;
      return parliamentFn.exit;
    }
  };

  parliamentFn.on = function (type: string, callback: ((event: Event, d: SeatPoint) => void) | null): void {
    if (!listeners[type]) listeners[type] = [];
    if (callback === null) { listeners[type] = []; return; }
    listeners[type].push(callback);
  };

  return parliamentFn;
}
