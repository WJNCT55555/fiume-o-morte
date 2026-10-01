import type { Card } from '../content/types';

/* Pantaleoni, the finance Rector, was an economist of the Italian marginalist
   school and a friend of Pareto. His ledger was the Regency's one piece of
   orthodoxy — and the only thing in Fiume that balanced. */
export const gvBilancio: Card = {
    id: 'gv_bilancio', deck: 'governo', ministry: 'finanze',
    name: { zh: '潘塔莱奥尼的账本', it: 'Il libro di Pantaleoni' },
    text: { zh: '马菲奥·潘塔莱奥尼在罗马的讲台上讲边际效用，在阜姆的办公桌后面记流水账。' +
        '他真心相信账本能救这个国家——不是比喻，是字面意思：' +
        '只要支出不超过收入，只要货币不贬值，只要每一笔军饷都能找到对应的进项，' +
        '那么这座城就有资格被称作一个国家，而不是一场规模过大的行为艺术。\n\n' +
        '账本摊开在桌上，左边是红色。军团兵的军饷占了全部开支的一半以上，' +
        '而收入只有两栏：码头，和贴现银行刚印出来、墨迹还没干的阜姆券。' +
        '他抬眼看你，等你在这两栏之间做一个选择。',
        it: 'Maffeo Pantaleoni insegna utilità marginale dalle cattedre di Roma e tiene la partita doppia ' +
        'dietro una scrivania di Fiume. Crede davvero che un libro contabile possa salvare lo Stato — ' +
        'non per metafora, alla lettera: se le uscite non superano le entrate, se la moneta non si svaluta, ' +
        'se ogni paga trova la sua copertura, allora questa città ha il diritto di chiamarsi uno Stato ' +
        'e non una performance artistica di dimensioni eccessive.\n\n' +
        'Il libro è aperto sulla scrivania, la colonna di sinistra è rossa. Le paghe dei legionari ' +
        'assorbono più di metà della spesa, e le entrate stanno in due righe: il porto, e i buoni ' +
        'appena stampati dalla banca di sconto, con l\'inchiostro ancora fresco. ' +
        'Alza gli occhi e aspetta che tu scelga fra le due.' },
    cost: { ap: 1 },
    cooldown: 3,
    require: function (s) { return s.cabinet.finanze === s.playerForce; },
    requireText: { zh: '未掌握财政执政官席位', it: 'Ministero delle Finanze non controllato' },
    options: [
      { id: 'pareggio',
        text: { zh: '削减开支，先还债。', it: 'Tagliare le spese e cominciare a pagare il debito.' },
        subtitle: { zh: '正统经济学在这座城里是一件奢侈品，而奢侈品是要记账的。', it: 'L\'ortodossia economica è un lusso in questa città, e i lussi si mettono a bilancio.' },
        preview: ['债务 −−', '通胀 −', '资本信心 +', '职员/手工业者 −'],
        effect: { order: { fervour: 5, authority: 2 },
                  support: [['impiegati', 'LEG', -3], ['artigiani', 'LEG', -2], ['borghesia', 'LEG', 4]],
                  economy: { debt: -260, capitalConfidence: 7, inflation: -4 } } },
      { id: 'continua',
        text: { zh: '继续印阜姆券，先保住军饷。', it: 'Continuare a stampare buoni e pagare la Legione.' },
        subtitle: { zh: '印钞机是这座城市唯一还在全速运转的机器，而它转动的声音像军鼓。', it: 'Il torchio è l\'unica macchina che gira ancora a pieno regime, e il suo rumore somiglia a un tamburo.' },
        preview: ['金库 ++', '通胀 ++', '军团兵 +', '资本信心 −'],
        effect: { funds: 460, order: { milizia: 200, fervour: 4 },
                  economy: { inflation: 9, capitalConfidence: -8 },
                  factions: { arditi: { dis: -10 } } } },
      { id: 'prestito',
        text: { zh: '向城里的富户发行爱国公债。', it: 'Emettere un prestito patriottico presso i maggiorenti.' },
        subtitle: { zh: '把「爱国」两个字印在债券抬头——这是唯一一种既能收钱又不算加税的写法。', it: 'Stampare la parola «patriottico» sull\'intestazione: è l\'unico modo di incassare senza chiamarla tassa.' },
        preview: ['金库 +++', '商业派 −', '资本信心 −', '工团派异议 −'],
        effect: { funds: 640,
                  support: [['borghesia', 'LEG', -4], ],
                  economy: { capitalConfidence: -12, debt: 180 },
                  factions: { sindacalisti: { inf: 2, dis: -8 } } } }
    ]
};
