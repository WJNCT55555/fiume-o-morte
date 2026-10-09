import type { GameEvent } from '../content/types';


export const ev192104Elezioni: GameEvent = {
    id: 'ev_1921_04_elezioni', date: { y: 1921, m: 4, d: 24 },
    title: { zh: '要不要参加这场选举', it: 'Se partecipare' },
    body: { zh: '自由邦的选举法在 3 月 23 日公布：76 席，城区 68 席（51 多数 + 17 少数），子市镇 8 席（6 多数 + 2 少数）。得票第一的名单通吃多数席位。\n\n' +
        '这部法律是兼并列写的，用来确保他们赢。\n\n' +
        '问题是你：军团兵要不要作为一份名单参加投票？1919 年 10 月，唯一一份名单在市政选举里拿了大约七成的票。那是两年前的事了。',
      it: 'La legge elettorale dello Stato libero è pubblicata il 23 marzo: 76 seggi, 68 in città (51 di maggioranza, 17 di minoranza), 8 nei sottocomuni (6 e 2). Chi arriva primo prende tutti i seggi di maggioranza.\n\n' +
        'La legge l\'hanno scritta gli annessionisti per vincere.\n\n' +
        'La questione sei tu: i legionari presenteranno una lista? Nell\'ottobre 1919 una lista unica prese circa il settanta per cento alle municipali. Sono passati due anni.' },
    options: [
      {
        id: 'listone', text: { zh: '与法西斯和民族派共组「国民集团」名单', it: 'Presentare il Blocco Nazionale con fascisti e nazionalisti' },
        preview: [{ zh: '按阶层支持计票', label: 'spoglio' }, { zh: '法西斯派影响力 +', label: 'Fascio +' }],
        effect: function () { return { runElection: true, factions: { fascisti: { inf: 3 }, sindacalisti: { dis: 8 }, futuristi: { dis: 6 } }, journals: ['elezioni'], next: 'ev_1921_04_elezioni_esito' }; }
      },
      {
        id: 'sola', text: { zh: '单独参选：只有军团兵的名单', it: 'Correre da soli: lista legionaria' },
        preview: [{ zh: '按阶层支持计票（−法西斯票源）', label: 'spoglio' }, { zh: '法西斯分裂', label: 'scissione' }],
        effect: function () {
          return {
            runElection: true, splitList: { drop: 'ANI', share: 0.8 },
            factions: { arditi: { inf: 2, dis: -6 } },
            journals: ['elezioni'],
            next: 'ev_1921_04_elezioni_esito'
          };
        }
      },
      {
        id: 'boicottare', text: { zh: '抵制选举。街垒比选票更诚实。', it: 'Boicottare. Le barricate sono più oneste delle schede.' },
        preview: [{ zh: '军团抵制投票', label: 'boicottaggio legionario' }, { zh: '议会被自治派占据', label: 'Assemblea agli autonomi' }, { zh: '民众热忱 +', label: 'fervore +' }],
        effect: function () {
          return {
            runElection: true, boycott: true,
            order: { fervour: 8, squadre: 6, violence: 6 },
            factions: { sindacalisti: { dis: 24 } },
            next: 'ev_1921_04_elezioni_esito'
          };
        }
      }
    ]
  };
