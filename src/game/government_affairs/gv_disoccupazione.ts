import type { Card } from '../content/types';

/* Unemployment relief was the Regency's largest single discretionary line. */
export const gvDisoccupazione: Card = {
    id: 'gv_disoccupazione', deck: 'governo', ministry: 'lavoro',
    name: { zh: '失业救济工程', it: 'Lavori pubblici contro la disoccupazione' },
    subtitle: { zh: '铲子比口号更能压住饥饿。', it: 'Una zappa ferma la fame meglio di uno slogan.' },
    cooldown: 2,
        text: { zh: '失业率已经两成。给钱不如给活干。',
            it: 'La disoccupazione è al venti per cento. Meglio un lavoro che un sussidio.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.lavoro === s.playerForce; },
    requireText: { zh: '未掌握劳动执政官席位', it: 'Ministero del Lavoro non controllato' },
    options: [
      { id: 'cantieri', text: { zh: '开一批公共工地', it: 'Aprire cantieri pubblici' },
        preview: ['失业 −−', '港口工程 +', '热度 −', '港口日志'],
        effect: { journals: ['porto'], order: { fervour: -4, squadre: -3 },
                  support: [['portuali', 'LEG', 3], ['operai', 'LEG', 4], ['artigiani', 'LEG', 2]],
                  economy: { unemployment: -6, traffic: 2, works: 5 } } },
      { id: 'sussidio', text: { zh: '直接发救济金', it: 'Sussidi diretti in denaro' },
        preview: ['金库 −−−', '失业 −', '资本信心 −', '通胀 +'],
        effect: { funds: -420,
                  support: [['portuali', 'LEG', 5], ['operai', 'LEG', 5], ['contadini', 'LEG', 2]],
                  economy: { unemployment: -4, capitalConfidence: -6, inflation: 4 } } },
      { id: 'emigrazione', text: { zh: '资助失业者离城', it: 'Pagare il viaggio a chi parte' },
        preview: ['失业 −−', '人口 −−', '金库 −'],
        effect: { funds: -220, diplo: { usa: 4 },
                  support: [['borghesia', 'LEG', 3], ['operai', 'LEG', -4]],
                  economy: { unemployment: -7, population: -300, capitalConfidence: 4 } } }
    ]
  };
