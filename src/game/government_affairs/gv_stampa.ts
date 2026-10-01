import type { Card } from '../content/types';

/* Press freedom was cheap legitimacy abroad and expensive order at home.
   The opposition press in Fiume was largely autonomist, and legionaries could
   seize any newspaper they liked. */
export const gvStampa: Card = {
    id: 'gv_stampa', deck: 'governo', ministry: 'interno',
    name: { zh: '新闻自由条例', it: 'Regolamento sulla libertà di stampa' },
    text: { zh: '今天军团兵可以查封任何一家报馆。他们要的只是一纸命令，' +
        '而自治党的《自治报》已经停了两期，排字工人把铅字盘收进了地窖。\n\n' +
        '这份条例要改的正是这件事。放开，伦敦和巴黎的通讯社会把阜姆' +
        '写成一个懂得分寸的国度，代价是城里的报摊上会出现你不爱看的标题；' +
        '半开，你保住「共和国」这个词的体面，同时把「吞并」这个词关进抽屉；' +
        '不开，你会有一条听话的街，和一个只会用刺刀讲话的名声。',
        it: 'Oggi i legionari possono sequestrare qualsiasi giornale. A loro basta un ordine, ' +
        'e il giornale degli autonomi ha già saltato due numeri: i tipografi hanno calato i caratteri in cantina.\n\n' +
        'Questo regolamento cambia proprio quello. Aprire del tutto: le agenzie di Londra e Parigi ' +
        'racconteranno di una Fiume capace di misura, al prezzo di vedere in edicola titoli che non ti piacciono. ' +
        'Aprire a metà: salvi la dignità della parola «Repubblica» e chiudi la parola «annessione» in un cassetto. ' +
        'Non aprire: avrai una strada obbediente e la fama di chi sa parlare solo con la baionetta.' },
    cost: { ap: 1 },
    cooldown: 4,
    require: function (s) { return s.cabinet.interno === s.playerForce; },
    requireText: { zh: '未掌握内政与司法执政官席位', it: 'Ministero dell\'Interno non controllato' },
    options: [
      { id: 'liberta',
        text: { zh: '完全自由，包括反对派的报纸。', it: 'Piena libertà, compresi i giornali avversari.' },
        subtitle: { zh: '让敌人也在报上说话——这是共和国能给出的最便宜、也最昂贵的证明。', it: 'Lasciare che parlino anche gli avversari: la prova più economica e più cara che una repubblica possa dare.' },
        preview: ['新闻升至 2 级', '军团民意 ++', '国际承认 +', '政治暴力 +'],
        effect: function (s) { return { laws: { stampa: Math.max(0, 2 - s.laws.stampa) }, order: { violence: 3 },
                  diplo: { uk: 4, france: 4, usa: 3, league: 4 },
                  economy: { recognition: 3 }, support: [['impiegati', 'LEG', 2]] }; } },
      { id: 'condizionata',
        text: { zh: '自由，但禁止鼓吹意大利吞并。', it: 'Libertà, ma vietato propagandare l\'annessione.' },
        subtitle: { zh: '只封一个字：那个把你整座城变成别人省份的字。', it: 'Vietare una sola parola: quella che trasformerebbe la tua città in una provincia altrui.' },
        preview: ['新闻改为 1 级', '军团民意 +', '法西斯派异议 +', '阿迪蒂 −'],
        effect: function (s) { return { laws: { stampa: 1 - s.laws.stampa }, order: { authority: 3, violence: -3 },
                  support: [['impiegati', 'LEG', 3], ],
                  factions: { fascisti: { dis: 12 }, arditi: { dis: -6 } } }; } },
      { id: 'censura',
        text: { zh: '维持军团兵的检查权。', it: 'Mantenere il potere di censura dei legionari.' },
        subtitle: { zh: '一条安静的街买得到，一份安静的报纸买不到。', it: 'Una strada silenziosa si compra; un giornale silenzioso no.' },
        preview: ['新闻检查恢复至 0 级', '摄政领袖权威 ++', '政治暴力 +', '英法美 −'],
        effect: function (s) { return { laws: { stampa: -s.laws.stampa }, order: { authority: 7, violence: 4 },
                  diplo: { uk: -5, france: -5, usa: -5, league: -4 },
                  factions: { arditi: { dis: -10 }, sindacalisti: { dis: 14 } } }; } }
    ]
};
