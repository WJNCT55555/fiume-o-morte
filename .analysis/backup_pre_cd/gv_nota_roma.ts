import type { Card } from '../content/types';

/* Rome could be negotiated with, but only through channels that let it avoid
   looking weak. Giolitti's fifth cabinet had no appetite for a second
   Fiume-sized scandal. */
export const gvNotaRoma: Card = {
    id: 'gv_nota_roma', deck: 'governo', ministry: 'esteri',
    name: { zh: '致罗马的照会', it: 'Nota a Roma' },
    text: { zh: '乔利蒂的第五届内阁刚刚组起来，他这辈子最不想要的东西，就是第二个阜姆。' +
        '一个诗人在阳台上宣布一个共和国，这已经够让他睡不着了；' +
        '要是卡维利亚的炮真的开了火，议会里那帮人会把他的脑袋连同外交部的公文柜一起端出去。\n\n' +
        '所以照会是可能的。措辞、抬头、递交的时辰、由谁递——每一个字都可以谈，' +
        '只要谈的是港口、铁路、邮政，而不是旗帜。罗马愿意装作看不见旗帜，' +
        '条件是这份文件里一个「国」字也不许出现。',
        it: 'Il quinto gabinetto Giolitti si è appena insediato, e la cosa che vuole di meno al mondo ' +
        'è una seconda Fiume. Un poeta che proclama una repubblica da un balcone gli basta a togliere il sonno; ' +
        'se poi i cannoni di Caviglia sparassero davvero, il Parlamento gli porterebbe via la testa ' +
        'insieme agli schedari del ministero.\n\n' +
        'Quindi la nota è possibile. La formula, l\'intestazione, l\'ora della consegna, la mano che la porge: ' +
        'tutto si può trattare, purché si parli di porto, ferrovia e poste, e non di bandiere. ' +
        'Roma è disposta a non vedere le bandiere, a patto che in questo documento non compaia mai la parola «Stato».' },
    cost: { ap: 1 },
    cooldown: 3,
    require: function (s) { return s.cabinet.esteri === s.playerForce; },
    requireText: { zh: '未掌握外交执政官席位', it: 'Ministero degli Esteri non controllato' },
    options: [
      { id: 'tecnica',
        text: { zh: '只谈港口、铁路与邮政的技术安排。', it: 'Trattare solo questioni tecniche: porto, ferrovia, poste.' },
        subtitle: { zh: '把一场主权争议压缩成一份时刻表——官僚的语言是最锋利的缓兵之计。', it: 'Ridurre una questione di sovranità a un orario ferroviario: la lingua dei burocrati è il più affilato dei temporeggiamenti.' },
        preview: ['意大利 ++', '驻军 +', '事态累积 −', '法西斯派异议 +'],
        effect: { flags: { rome_talks: true },
                  diplo: { italy: 8, league: 3 }, order: { garrison: 8, coup: -10 },
                  economy: { hinterland: 3 }, factions: { fascisti: { dis: 8 } } } },
      { id: 'ultimatum',
        text: { zh: '在技术条款后面附上一份最后通牒。', it: 'Allegare un ultimatum alle clausole tecniche.' },
        subtitle: { zh: '外交官写的是请求，而读的人会听见炮闩拉开的声响。', it: 'Il diplomatico scrive una richiesta; chi legge sente il rumore dell\'otturatore.' },
        preview: ['意大利 −−−', '民众热忱 ++', '事态累积 ++'],
        effect: { order: { fervour: 8, coup: 12, garrison: -6 },
                  diplo: { italy: -16, league: -4 },
                  factions: { fascisti: { dis: -8 } } } },
      { id: 'silenzio',
        text: { zh: '不发照会。让军事参赞去传话。', it: 'Nessuna nota: mandare l\'addetto militare a riferire a voce.' },
        subtitle: { zh: '不留下任何可以引用的文字——军人的口头承诺，字面上什么都不是。', it: 'Non lasciare nulla di citabile: la parola di un militare, sulla carta, non è nulla.' },
        preview: ['驻军 +', '军团民意 −', '阿迪蒂异议 +'],
        effect: { order: { garrison: 5, coup: -5 },
                  diplo: { italy: 4 }, factions: { arditi: { dis: 10 } } } }
    ]
};
