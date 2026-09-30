import type { Card } from '../content/types';

/* The Arengo was the Charter's emergency assembly of both councils. Calling
     it turned the Charter from a text into a procedure. */
export const gvArengo: Card = {
    id: 'gv_arengo', deck: 'governo', ministry: 'istruzione',
    name: { zh: '召开阿伦戈', it: 'Convocare l\'Arengo' },
    subtitle: { zh: '宪章里那个词，现在要变成一间屋子。', it: 'La parola della Carta deve diventare una sala.' },
    cooldown: 6,
    text: { zh: '宪章写着：必要时，两个议会合并为市民大会。',
            it: 'La Carta dice: in caso di necessità i due consigli si riuniscono in Arengo.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.istruzione === s.playerForce; },
    requireText: { zh: '未掌握教育执政官席位', it: 'Ministero dell\'Istruzione non controllato' },
    options: [
      { id: 'convocare', text: { zh: '按宪章原文召开', it: 'Convocarlo secondo il testo della Carta' },
        preview: ['宪章 +1', '合法性 ++', '事态 −−', '宪章日志'],
        effect: { laws: { statuto: 1 }, journals: ['carta'],
                  support: [['artigiani', 'LEG', 3], ['contadini', 'LEG', 3], ['portuali', 'LEG', 3], ['operai', 'LEG', 2]],
                  order: { authority: 5, coup: -8, fervour: 4 } } },
      { id: 'consultiva', text: { zh: '只给它咨询权，决策留给执政官', it: 'Solo consultiva: decide il Consiglio dei Rettori' },
        preview: ['领袖权威 +', '合法性 +', '工团派异议 +'],
        effect: { order: { authority: 8, coup: -5 },
                  support: [['impiegati', 'LEG', 3], ['borghesia', 'LEG', 3]],
                  factions: { sindacalisti: { dis: 14 } } } },
      { id: 'rinviare', text: { zh: '暂不召开。宪章可以等。', it: 'Rinviare. La Carta può attendere' },
        preview: ['热度 −', '合法性 −', '工团派异议 ++'],
        effect: { order: { fervour: -6 },
                  factions: { sindacalisti: { dis: 18 }, arditi: { dis: 6 } } } }
    ]
  };
