import type { Card } from '../content/types';

/* Rome could be negotiated with, but only through channels that let it avoid
     looking weak. */
export const gvNotaRoma: Card = {
    id: 'gv_nota_roma', deck: 'governo', ministry: 'esteri',
    name: { zh: '致罗马的照会', it: 'Nota a Roma' },
    subtitle: { zh: '写给一个不肯回信的人。', it: 'Scritto a chi non risponde.' },
    cooldown: 3,
        text: { zh: '乔利蒂政府不想制造殉道者。别的事情上可以谈。',
            it: 'Il governo Giolitti non vuole martiri. Su altro si può trattare.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.esteri === s.playerForce; },
    requireText: { zh: '未掌握外交执政官席位', it: 'Ministero degli Esteri non controllato' },
    options: [
      { id: 'tecnica', text: { zh: '只谈港口、铁路与邮政的技术安排', it: 'Solo questioni tecniche: porto, ferrovia, poste' },
        preview: ['意大利 ++', '驻军 +', '事态 −', '民族派异议 +'],
        effect: { flags: { rome_talks: true },
                  diplo: { italy: 8, league: 3 }, order: { garrison: 8, coup: -10 },
                  economy: { hinterland: 3 }, factions: { fascisti: { dis: 8 } } } },
      { id: 'ultimatum', text: { zh: '附上一份最后通牒', it: 'Allegare un ultimatum' },
        preview: ['意大利 −−−', '热度 ++', '事态 ++'],
        effect: { order: { fervour: 8, coup: 12, garrison: -6 },
                  diplo: { italy: -16, league: -4 },
                  factions: { fascisti: { dis: -8 } } } },
      { id: 'silenzio', text: { zh: '不发照会。让军事参赞去传话。', it: 'Nessuna nota: mandare l\'addetto militare' },
        preview: ['驻军 +', '合法性 −', '阿迪蒂异议 +'],
        effect: { order: { garrison: 5, coup: -5 },
                  diplo: { italy: 4 }, factions: { arditi: { dis: 10 } } } }
    ]
  };
