import type { GameEvent } from '../content/types';

/* The count, opened after the April 1921 ballot. The chamber is not written into
   this file: `Eng.runElection` struck it when the vote was held and left it in
   `state.assembly`, and this reads it back. Play a different campaign into the
   same election and the hemicycle comes out different — the seat totals in the
   event text are only true of the historical run.

   `seats` is what makes this event worth having as its own screen: the 1921 law
   gives the largest list every majority seat, so the shape of the chamber (one
   bloc that can outvote all the others together) carries the meaning that a
   column of figures cannot. */
export const ev192104ElezioniEsito: GameEvent = {
    id: 'ev_1921_04_elezioni_esito',
    chain: true,
    title: { zh: '制宪议会的席位', it: 'I seggi della Costituente' },
    body: { zh: '书记员从早上数到深夜。多数席位通吃的那条规则，把票数直接翻译成了权力：\n\n' +
        '得票第一的名单拿走全部 51 个城区多数席位，剩下的 25 席才轮到别人分。所以这张半圆图不是意见的分布，是法律的产物。',
      it: 'Gli scrutatori hanno contato dall\'alba a notte fonda. La regola del premio di maggioranza traduce i voti direttamente in potere:\n\n' +
        'la lista prima arrivata prende tutti i 51 seggi di maggioranza della città, e solo i 25 restanti vanno agli altri. Questo emiciclo non è la forma dell\'opinione pubblica: è la forma della legge.' },
    result: function (s, api) {
      const W = api.W;
      const Core = api.Core;
      const seats: Record<string, number> = s.assembly || {};
      const total = Core.sum(seats);
      if (!total) {
        /* Only reachable if an election was cancelled outright: no chamber was
           seated, so there is nothing to draw. A boycott is NOT this case — the
           assembly still sits, it just sits without you. */
        return {
          title: { zh: '没有议会', it: 'Nessuna assemblea' },
          body: { zh: '席位没有分配出来。取消的选举不会留下议会。',
                  it: 'I seggi non sono stati assegnati. Un\'elezione annullata non lascia un\'assemblea.' },
          note: { zh: '空着的议席不投你的票，也不投别人的。',
                  it: 'I banchi vuoti non votano per te, né per gli altri.' }
        };
      }
      /* Seated along the political axis, not by size: the hemicycle is a map of
         where the chamber stands. `largest` is therefore computed, never read off
         blocs[0]. Parties missing from the table fall to the right. */
      const axis = function (p: string): number {
        const o = W.PARTY_BY_ID[p] && W.PARTY_BY_ID[p].order;
        return typeof o === 'number' ? o : 999;
      };
      const ids = Object.keys(seats).filter(function (p) { return seats[p] > 0; })
        .sort(function (a, b) { return axis(a) - axis(b); });
      const blocs = ids.map(function (p) {
        const party = W.PARTY_BY_ID[p];
        const list = W.LIST_BY_ID[W.MEMBER_OF[p]];
        return {
          id: p,
          name: party ? { zh: party.zh, it: party.it } : { zh: p, it: p },
          seats: seats[p],
          color: (party && party.color) || (list && list.color) || '#8A7A5A'
        };
      });
      const majority = Math.floor(total / 2) + 1;
      const mine = seats[s.playerForce] || 0;
      const largest = blocs.slice().sort(function (a, b) { return b.seats - a.seats; })[0];
      const others = total - (largest ? largest.seats : 0);
      const rows = blocs.map(function (b) {
        return {
          label: b.name,
          value: b.seats + ' 席 · ' + Math.round((b.seats / total) * 100) + '%',
          tone: (b.id === s.playerForce ? 'good' : undefined) as 'good' | undefined
        };
      });
      return {
        title: { zh: '计票结果', it: 'Lo spoglio' },
        body: {
          zh: '共 ' + total + ' 席，多数线 ' + majority + ' 席。'
            + (s.flags.boycott
                ? '军团兵的名单没有上票，所以这些席位里没有一个是在你的名下争来的——议会照样开会，只是开的没有你。'
                : ''),
          it: 'Assemblea di ' + total + ' seggi, maggioranza a ' + majority + '.'
            + (s.flags.boycott
                ? ' La lista legionaria non era sulle schede: nessuno di questi seggi è tuo, e l\'assemblea siede senza di te.'
                : '')
        },
        seats: blocs,
        seatsCaption: {
          zh: '第一大名单 ' + (largest ? largest.seats : 0) + ' 席；其余各党合计 ' + others + ' 席。'
            + '你名下 ' + mine + ' 席。',
          it: 'La lista prima arrivata ha ' + (largest ? largest.seats : 0) + ' seggi; tutte le altre insieme ' + others + '.'
            + ' A te ne vanno ' + mine + '.'
        },
        rows: rows,
        note: mine >= majority
          ? { zh: '你不再需要说服任何人：你只需要把他们排好队。',
              it: 'Non devi più convincere nessuno: ti basta metterli in fila.' }
          : { zh: '你没有多数。每一项法案都要向昨天还是对手的人去讨。',
              it: 'Non hai la maggioranza. Ogni legge andrà chiesta a chi ieri era un avversario.' }
      };
    },
    options: [
      {
        id: 'prendere_atto',
        text: { zh: '记下这个数字。', it: 'Prenderne atto.' },
        preview: [],
        effect: {}
      }
    ]
  };
