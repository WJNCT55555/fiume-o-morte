import type { Card } from '../content/types';

/* Press freedom was cheap legitimacy abroad and expensive order at home. */
export const gvStampa: Card = {
    id: 'gv_stampa', deck: 'governo', ministry: 'interno',
    name: { zh: '新闻自由条例', it: 'Regolamento sulla libertà di stampa' },
    subtitle: { zh: '让报馆自己吵。', it: 'Che i giornali si accusino da soli.' },
    cooldown: 3,
        text: { zh: '军团兵现在可以查封任何一家报馆。这条例要改的就是这件事。',
            it: 'Oggi i legionari possono sequestrare qualsiasi giornale. Questo regolamento cambia proprio quello.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.interno === s.playerForce; },
    requireText: { zh: '未掌握内政与司法执政官席位', it: 'Ministero dell\'Interno non controllato' },
    options: [
      { id: 'liberta', text: { zh: '完全自由，包括反对派的报纸', it: 'Piena libertà, anche per i giornali avversari' },
        preview: ['新闻法 +1', '合法性 ++', '国际承认 +', '暴力 +'],
        effect: { laws: { stampa: 1 }, order: { violence: 3 },
                  diplo: { uk: 4, france: 4, usa: 3, league: 4 },
                  economy: { recognition: 3 }, support: [['impiegati', 'LEG', 2]] } },
      { id: 'condizionata', text: { zh: '自由，但禁止鼓吹意大利吞并', it: 'Libertà, ma vietato propagandare l\'annessione' },
        preview: ['新闻法 +1', '合法性 +', '法西斯异议 +', '阿迪蒂 −'],
        effect: { laws: { stampa: 1 }, order: { authority: 3, violence: -3 },
                  support: [['impiegati', 'LEG', 3], ],
                  factions: { fascisti: { dis: 12 }, arditi: { dis: -6 } } } },
      { id: 'censura', text: { zh: '维持军团兵的检查权', it: 'Mantenere il potere di censura dei legionari' },
        preview: ['领袖权威 ++', '合法性 −−', '英法美 −'],
        effect: { order: { authority: 7, violence: 4 },
                  diplo: { uk: -5, france: -5, usa: -5, league: -4 },
                  factions: { arditi: { dis: -10 }, sindacalisti: { dis: 14 } } } }
    ]
  };
