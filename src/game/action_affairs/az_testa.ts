import type { Card } from '../content/types';

/* Testa di Ferro, edited by Mario Carli, was part syndicalist and part
     Bolshevik; it embarrassed Rome more than it persuaded it. */
export const azTesta: Card = {
    id: 'az_testa', deck: 'azione',
    name: { zh: '《铁头》号外', it: 'Numero unico di Testa di Ferro' },
    subtitle: { zh: '油墨未干的战报。', it: 'Bollettino di guerra, inchiostro ancora fresco.' },
    cooldown: 2,
        text: { zh: '卡利的排版比任何政纲都有说服力。',
            it: 'L\'impaginazione di Carli persuade più di qualsiasi programma.' },
    cost: { ap: 1 },
    options: [
      { id: 'uscita', text: { zh: '照常出号外', it: 'Uscire come sempre' },
        preview: ['职员 +', '热度 +', '暴力 +'],
        effect: { order: { fervour: 5, violence: 2 },
                  support: [['impiegati', 'LEG', 3], ['artigiani', 'LEG', 2], ] } },
      { id: 'bolscevico', text: { zh: '出一期亲布尔什维克的', it: 'Un numero filo-bolscevico' },
        preview: ['工人 ++', '工团派 +', '合法性 −−', '法西斯异议 ++'],
        effect: { support: [['operai', 'LEG', 5], ['portuali', 'LEG', 4]],
                  order: { fervour: 6 }, diplo: { italy: -4 },
                  economy: { capitalConfidence: -4 },
                  factions: { sindacalisti: { inf: 3, dis: -10 }, fascisti: { dis: 14 } } } },
      { id: 'sopprimere', text: { zh: '停刊一期。罗马在看。', it: 'Sospendere il numero. Roma guarda' },
        preview: ['意大利 +', '合法性 +', '阿迪蒂异议 ++'],
        effect: { diplo: { italy: 5 },
                  factions: { arditi: { dis: 14 }, futuristi: { dis: 8 } } } }
    ]
  };
