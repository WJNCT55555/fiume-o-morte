import type { Card } from '../content/types';

/* Dredging and the rail link were the only works that could raise the port
     index without a treaty. */
export const gvLavori: Card = {
    id: 'gv_lavori', deck: 'governo', ministry: 'economia',
    name: { zh: '港池疏浚与铁路联络线', it: 'Dragaggio e raccordo ferroviario' },
    cooldown: 4,
        text: { zh: '港池淤了六年。联络线只有一条，而且归别人管。',
            it: 'Il bacino è insabbiato da sei anni. Il raccordo è uno solo, e non è nostro.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.economia === s.playerForce; },
    requireText: { zh: '未掌握公共经济执政官席位', it: 'Ministero dell\'Economia non controllato' },
    options: [
      { id: 'completo', text: { zh: '疏浚加联络线，一次做完', it: 'Dragaggio e raccordo, tutto insieme' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['港口工程 ++', '吞吐 +', '失业 −', '财政法 +1'],
        effect: { laws: { fisco: 1 },
                  economy: { works: 14, traffic: 6, unemployment: -3, hinterland: 3 },
                  support: [['portuali', 'LEG', 3], ['operai', 'LEG', 3]] } },
      { id: 'solo_bacino', text: { zh: '只疏浚，不碰铁路', it: 'Solo il bacino, non la ferrovia' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['金库 +', '港口工程 +', '吞吐 +'],
        effect: { funds: 180, economy: { works: 7, traffic: 3 },
                  support: [['portuali', 'LEG', 2]],
                  districts: { porto: { control: 4 } } } },
      { id: 'appalto', text: { zh: '把工程包给船东的公司', it: 'Appaltare alle ditte degli armatori' },
        subtitle: { zh: '待写', it: 'da scrivere' },
        preview: ['资本信心 ++', '商业派 +', '工人 −', '罢工 +'],
        effect: { economy: { works: 10, capitalConfidence: 9, strike: 6 },
                  support: [['borghesia', 'LEG', 4], ['operai', 'LEG', -3]],
                  factions: { sindacalisti: { dis: 12 } } } }
    ]
  };
