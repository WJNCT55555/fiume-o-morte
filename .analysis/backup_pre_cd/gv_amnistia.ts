import type { Card } from '../content/types';

/* Amnesty was how a revolutionary government admitted it needed the people
   it had locked up. The cells held autonomists, socialists, and three men who
   had stolen a rifle from the legionaries. */
export const gvAmnistia: Card = {
    id: 'gv_amnistia', deck: 'governo', ministry: 'interno',
    name: { zh: '大赦令', it: 'Decreto di amnistia' },
    text: { zh: '监狱里关着自治派、社会党人，以及三个偷了军团兵步枪的人。' +
        '牢房不够用，于是他们挤在一起——一个扎内拉的选民，一个码头工会的会计，' +
        '和一个十七岁的、以为偷枪是某种爱国行为的少年。\n\n' +
        '国际红十字会来过两次，英国领事写过一封措辞客气的信。' +
        '一份大赦令能让阜姆在欧洲的报纸上体面几天；' +
        '但它同时意味着明天早上，那些被你关过的人会重新出现在广场上，' +
        '而有些人会在那里等你给一个解释。',
        it: 'In carcere ci sono autonomi, socialisti e tre che hanno rubato un fucile ai legionari. ' +
        'Le celle non bastano, così stanno ammassati: un elettore di Zanella, un contabile ' +
        'del sindacato portuale e un ragazzo di diciassette anni convinto che rubare un fucile ' +
        'fosse una specie di atto patriottico.\n\n' +
        'La Croce Rossa internazionale è venuta due volte, il console britannico ha scritto ' +
        'una lettera cortese. Un decreto di amnistia regalerebbe a Fiume qualche giorno ' +
        'di buona stampa in Europa; ma significherebbe anche che domani mattina ' +
        'quelli che hai rinchiuso tornerebbero in piazza — e alcuni ti aspetterebbero lì per una spiegazione.' },
    cost: { ap: 1 },
    cooldown: 6,
    require: function (s) { return s.cabinet.interno === s.playerForce; },
    requireText: { zh: '未掌握内政与司法执政官席位', it: 'Ministero dell\'Interno non controllato' },
    options: [
      { id: 'generale',
        text: { zh: '全部释放，包括政治犯。', it: 'Amnistia piena, compresi i politici.' },
        subtitle: { zh: '打开所有的门，包括那扇你本来打算留到谈判时再开的。', it: 'Aprire tutte le porte, compresa quella che pensavi di tenere chiusa fino al negoziato.' },
        preview: ['政治暴力 −−', '事态累积 −', '军团民意 +', '阿迪蒂异议 ++'],
        effect: { order: { violence: -12, coup: -10, squadre: -6, fervour: -4 },
                  support: [['portuali', 'LEG', 3]],
                  factions: { arditi: { dis: 10 }, fascisti: { dis: 8 } } } },
      { id: 'politici',
        text: { zh: '只放政治犯，刑事犯照旧。', it: 'Solo i politici; i reati comuni restano dentro.' },
        subtitle: { zh: '把「因为想法」和「因为偷窃」分开——法律是一把尺子，不是一张网。', it: 'Distinguere chi è dentro per un\'idea da chi è dentro per un furto: la legge è un righello, non una rete.' },
        preview: ['军团民意 ++', '英法美 +', '政治暴力 −'],
        effect: { order: { violence: -6, coup: -6 },
                  diplo: { uk: 4, france: 3, league: 4 },
                  support: [['impiegati', 'LEG', 3], ],
                  factions: { arditi: { dis: 4 } } } },
      { id: 'nessuna',
        text: { zh: '不赦。乱世用重典。', it: 'Nessuna amnistia. Tempi duri, leggi dure.' },
        subtitle: { zh: '把门关上，然后指望没有人记得门是从哪一边锁上的。', it: 'Chiudere la porta e sperare che nessuno ricordi da che lato è stata sprangata.' },
        preview: ['摄政领袖权威 ++', '政治暴力 +', '军团民意 −', '工团派异议 ++'],
        effect: { order: { authority: 6, violence: 5, coup: 4 },
                  factions: { arditi: { dis: -8 }, sindacalisti: { dis: 12 } } } }
    ]
};
