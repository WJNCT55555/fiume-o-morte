import type { Card } from '../content/types';

/* Port dues and transit taxes were the only revenue the Regency could actually
   collect. Note: `revenueBoost` is only read for the `porto` key (rules.js
   R.revenue), so the `dogana` entry in option 2 has no effect — kept because it
   is the authored value, but do not rely on it. */
export const gvFisco: Card = {
    id: 'gv_fisco', deck: 'governo', ministry: 'finanze',
    name: { zh: '港口费与转口税', it: 'Tasse portuali e dazio di transito' },
    text: { zh: '码头工人卸货，通关员盖章，钱在中间蒸发。' +
        '财政执政官把三份税率表摊开：每一份都写着同一个尴尬的事实——' +
        '这座共和国唯一真正收得上来的税，是从别人的货上收的。\n\n' +
        '调高一点，码头上的抱怨会持续一个季度，然后大家照旧付钱。' +
        '调高很多，货主会开始绕道，你把税率提上去的同时把税基提没了。' +
        '反过来做——给转口货免税——你放弃的是眼前的现金，' +
        '换来的是让整条航线记住阜姆这个名字。',
        it: 'I portuali scaricano, i doganieri timbrano, e il denaro evapora nel mezzo. ' +
        'Il Rettore alle Finanze stende tre tariffe, e tutte e tre dicono la stessa cosa imbarazzante: ' +
        'l\'unica imposta che questa Repubblica riesca davvero a riscuotere è quella sulla merce altrui.\n\n' +
        'Alzarla di poco: le proteste sul molo dureranno un trimestre, poi tutti pagheranno come prima. ' +
        'Alzarla di molto: gli spedizionieri cominceranno a girare al largo, e alzando l\'aliquota ' +
        'avrai svuotato la base imponibile. Fare il contrario — esentare il transito — ' +
        'significa rinunciare al contante di oggi in cambio di un nome che le rotte ricordino: Fiume.' },
    cost: { ap: 1 },
    cooldown: 3,
    require: function (s) { return s.cabinet.finanze === s.playerForce; },
    requireText: { zh: '未掌握财政执政官席位', it: 'Ministero delle Finanze non controllato' },
    options: [
      { id: 'moderato',
        text: { zh: '小幅上调港口费。', it: 'Aumentare moderatamente le tasse portuali.' },
        subtitle: { zh: '少收一点，收久一点——财政的耐心比财政的胃口更值钱。', it: 'Incassare un po\' meno, ma più a lungo: la pazienza fiscale vale più dell\'appetito fiscale.' },
        preview: ['财政法 +1', '月度收入 +12%', '资本信心 −'],
        effect: { laws: { fisco: 1 }, revenueBoost: { porto: 0.12 },
                  economy: { capitalConfidence: -2, traffic: -1 } } },
      { id: 'pesante',
        text: { zh: '大幅提高，并向货主直接征收。', it: 'Aumento forte, riscosso direttamente sugli spedizionieri.' },
        subtitle: { zh: '把税率提到再也无法回头的高度，然后祈祷船还会来。', it: 'Spingere l\'aliquota al punto di non ritorno, poi pregare che le navi tornino lo stesso.' },
        preview: ['财政法 +2', '月度收入 +26%', '港口吞吐指数 −−', '有产精英异议 ++'],
        effect: { laws: { fisco: 2 }, revenueBoost: { porto: 0.26, dogana: 0.10 },
                  support: [['borghesia', 'LEG', -5], ['impiegati', 'LEG', 2]],
                  economy: { traffic: -6, capitalConfidence: -9 },
                  factions: { sindacalisti: { dis: -6 } } } },
      { id: 'esenzione',
        text: { zh: '给转口货物免税，换吞吐量。', it: 'Esenzione per il transito, in cambio di volume.' },
        subtitle: { zh: '今天不收的钱，会以集装箱的形式在明年回来。', it: 'Il denaro non incassato oggi tornerà l\'anno prossimo, sotto forma di container.' },
        preview: ['港口吞吐指数 ++', '腹地 +', '月度收入 −'],
        effect: { laws: { dogana: 1 }, revenueBoost: { porto: -0.18 },
                  support: [['borghesia', 'LEG', 4], ['portuali', 'LEG', 3]],
                  economy: { traffic: 9, hinterland: 7, capitalConfidence: 8 } } }
    ]
};
