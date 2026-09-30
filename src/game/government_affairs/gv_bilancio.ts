import type { Card } from '../content/types';

/* Pantaleoni, the finance Rector, was an economist of the Italian
     marginalist school. His ledger was the Regency's one piece of orthodoxy. */
export const gvBilancio: Card = {
    id: 'gv_bilancio', deck: 'governo', ministry: 'finanze',
    name: { zh: '潘塔莱奥尼的账本', it: 'Il libro di Pantaleoni' },
    subtitle: { zh: '诗人不会算账，会计会。', it: 'Il poeta non sa fare i conti; il ragioniere si.' },
    cooldown: 3,
        text: { zh: '潘塔莱奥尼把每一笔支出都写下来。他相信账本可以救这个国家。',
            it: 'Pantaleoni annota ogni uscita. Crede che un libro contabile possa salvare lo Stato.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.finanze === s.playerForce; },
    requireText: { zh: '未掌握财政执政官席位', it: 'Ministero delle Finanze non controllato' },
    options: [
      { id: 'pareggio', text: { zh: '削减开支，先还债', it: 'Tagliare le spese e pagare il debito' },
        preview: ['债务 −−', '通胀 −', '资本信心 +', '职员/手工业者 −'],
        effect: { order: { fervour: 5, authority: 2 },
                  support: [['impiegati', 'LEG', -3], ['artigiani', 'LEG', -2], ['borghesia', 'LEG', 4]],
                  economy: { debt: -260, capitalConfidence: 7, inflation: -4 } } },
      { id: 'continua', text: { zh: '继续印阜姆券，保持军饷', it: 'Continuare a stampare buoni e pagare la Legione' },
        preview: ['金库 ++', '通胀 ++', '军团兵 +', '资本信心 −'],
        effect: { funds: 460, order: { milizia: 200, fervour: 4 },
                  economy: { inflation: 9, capitalConfidence: -8 },
                  factions: { arditi: { dis: -10 } } } },
      { id: 'prestito', text: { zh: '向城里的富户发行爱国公债', it: 'Prestito patriottico ai maggiorenti' },
        preview: ['金库 +++', '商业派 −', '资本信心 −', '工团派异议 −'],
        effect: { funds: 640,
                  support: [['borghesia', 'LEG', -4], ],
                  economy: { capitalConfidence: -12, debt: 180 },
                  factions: { sindacalisti: { inf: 2, dis: -8 } } } }
    ]
  };
