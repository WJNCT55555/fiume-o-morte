import type { GameEvent } from '../content/types';

/* 15 December 1919. The National Council divides on the provisional settlement.
   Nobody in the hall is arguing about whether the terms are good; they are
   arguing about whether waiting for annexation is worth more. The division is
   struck by R.modusVote from the parties' own predicaments weighted by the
   strength they actually hold, and it turns on what the Comandante answered in
   November — this event reports it, it does not decide it. */
const NAMES: Record<string, { zh: string; it: string }> = {
  LEG: { zh: '军团兵', it: 'Legionari' },
  ARD: { zh: '阿迪蒂', it: 'Arditi' },
  ANI: { zh: '意大利国民委员会', it: 'Consiglio Nazionale' },
  AUT: { zh: '自治党', it: 'Partito Autonomo' },
  PAD: { zh: '自治民主党', it: 'Partito Autonomo Democratico' },
  PCR: { zh: '人民委员会', it: 'Partito Croato' },
  PSI: { zh: '社会党', it: 'Partito Socialista' }
};

export const ev191912ModusVote: GameEvent = {
    id: 'ev_1919_12_modus_vote',
    chain: true,
    title: { zh: '12 月 15 日：国民委员会表决', it: '15 dicembre: la votazione del Consiglio' },
    body: { zh: '国民委员会在大厅里坐了一整天。窗外是广场上的人群，' +
        '他们在等一个词——接受，或者不接受。\n\n' +
        '没有人真的在辩论条款。条款早就念完了。他们辩论的是别的东西：' +
        '再等下去，等来的会是罗马的承认，还是罗马的遗忘？',
      it: 'Il Consiglio Nazionale siede tutto il giorno. Fuori, in piazza, la folla aspetta una parola.\n\n' +
        'Nessuno discute davvero le clausole: si discute se aspettare ancora porterà il riconoscimento di Roma o il suo oblio.' },
    result: function (s, api) {
      const v = api.R.modusVote(s);
      const rows = v.rows.map(function (r: any) {
        const nm = NAMES[r.party] || { zh: r.party, it: r.party };
        return {
          label: { zh: nm.zh + '（' + r.zh + '）', it: nm.it + ' — ' + r.it },
          value: r.weight.toFixed(1),
          tone: r.stance === 'yes' ? 'good' as const : r.stance === 'no' ? 'bad' as const : undefined
        };
      });
      return {
        title: { zh: '表决结果', it: 'Il risultato' },
        body: {
          zh: '赞成 ' + v.yesPct + '% · 反对 ' + v.noPct + '% · 弃权 ' + v.absPct + '%。',
          it: 'Favorevoli ' + v.yesPct + '% · contrari ' + v.noPct + '% · astenuti ' + v.absPct + '%.'
        },
        rows: rows,
        note: v.carried
          ? { zh: '《临时协定》通过。阜姆将成为一个由国联保证的自由邦——如果你能让这座城市接受这件事。',
              it: 'Il Modus Vivendi passa. Fiume sarà uno Stato libero garantito da Ginevra.' }
          : { zh: '《临时协定》被否决。罗马得到的是一个明确的「不」，而这座城得到的是继续等下去。',
              it: 'Il Modus Vivendi è respinto. Roma ha un no chiaro; la città, un\'attesa più lunga.' }
      };
    },
    options: [
      {
        id: 'prendere_atto',
        text: { zh: '记下这个结果。', it: 'Prenderne atto.' },
        preview: [],
        effect: function () {
          /* The division has consequences past the hall door: a council that has
             just voted against Rome is one Rome stops waiting on, and the men
             who wanted the settlement are the ones who feel the wait. */
          return {
            order: { authority: 3, violence: 3 },
            factions: { arditi: { dis: 4 }, sindacalisti: { dis: -4 } },
            flags: { modus_voted: true }
          };
        }
      }
    ]
  };
