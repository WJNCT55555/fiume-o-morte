import type { GameEvent } from '../content/types';

/* The count, opened the turn after the city votes. The figures are not written
   here: the tally was struck by the engine when the ballot was held and sits in
   municipalDetail, and this reads it back. Play the same choice into a
   different situation and the numbers come out different, which is the point —
   the 1921 event's line about "about seventy per cent" is only true of the
   historical run. */
const NAMES: Record<string, { zh: string; it: string }> = {
  LEG: { zh: '军团兵名单', it: 'Lista legionaria' },
  ANI: { zh: '意大利国民委员会', it: 'Consiglio Nazionale' },
  AUT: { zh: '自治党', it: 'Partito Autonomo' },
  PAD: { zh: '自治民主党', it: 'Partito Autonomo Democratico' },
  PCR: { zh: '人民委员会', it: 'Partito Croato' },
  PSI: { zh: '社会党', it: 'Partito Socialista' }
};

export const ev191910ComunaliResult: GameEvent = {
    id: 'ev_1919_10_comunali_result',
    chain: true,
    title: { zh: '计票', it: 'Lo spoglio' },
    body: { zh: '票箱在市政厅里打开，一张一张唱出来。书记员念名字，党派代表盯着自己的那一叠。\n\n' +
        '没有人争论。数字自己会说话。',
      it: 'Le urne si aprono al Municipio, una scheda alla volta. Nessuno discute: i numeri parlano da soli.' },
    result: function (s, api) {
      /* Struck live rather than read back from state: the same three choices
         put to a different situation give different figures, which is the whole
         point of counting instead of writing the number in. */
      const res = api.R.municipalElection(s);
      const d = res.detail;
      if (d.noElection) {
        return {
          title: { zh: '没有选举', it: 'Nessuna elezione' },
          body: { zh: '市政厅是被接管的，不是被赢来的。没有票箱，没有计票，只有一份公告钉在门上。',
                  it: 'Il Municipio è stato occupato, non vinto.' },
          note: { zh: '这座城市不会因此更服从你——它只是暂时没有别的选择。',
                  it: 'La città non obbedisce di più: per ora non ha altra scelta.' }
        };
      }
      const seats: Record<string, number> = res.seats || {};
      const rows = (d.ranked || []).map(function (p: string) {
        const nm = NAMES[p] || { zh: p, it: p };
        const pct = d.share[p] == null ? '—' : d.share[p].toFixed(1) + '%';
        return {
          label: nm,
          value: seats[p] + ' 席 · ' + pct,
          tone: p === 'LEG' ? 'good' as const : undefined
        };
      });
      const winner = d.winner ? (NAMES[d.winner] || { zh: d.winner, it: d.winner }).zh : null;
      return {
        title: { zh: '市政选举结果', it: 'Elezioni municipali' },
        body: {
          zh: '共 ' + d.council + ' 席，投票率 ' + d.turnout + '%。'
            + (d.singleList
                ? '自治党与克罗地亚人没有提名，所以这不是一次较量，只是一次点名。'
                : '两份名单都上了票，这座城市第一次把真实的分裂摊开在纸上。'),
          it: 'Consiglio di ' + d.council + ' seggi, affluenza ' + d.turnout + '%.'
        },
        rows: rows,
        note: d.singleList
          ? { zh: '弃权帮你赢了席位，但没有帮你赢到人。缺席的人不会被记成赞成票。',
              it: 'L\'astensione ti ha dato i seggi, non gli uomini.' }
          : { zh: '第一多数是' + winner + '。', it: 'La prima maggioranza è ' + winner + '.' }
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
