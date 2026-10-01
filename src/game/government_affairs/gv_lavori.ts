import type { Card } from '../content/types';

/* Dredging and the rail link were the only works that could raise the port
   index without a treaty. The basin had silted for years and the raccordo was
   single-track and not Fiume's to control. */
export const gvLavori: Card = {
    id: 'gv_lavori', deck: 'governo', ministry: 'economia',
    name: { zh: '港池疏浚与铁路联络线', it: 'Dragaggio e raccordo ferroviario' },
    text: { zh: '港池已经淤了六年。战前那条能停万吨轮的深水码头，现在只剩一半水深，' +
        '大船得在锚地等涨潮。工程师把图纸摊开：要清的泥沙能堆成一座小山，' +
        '而挖泥船得从的里雅斯特租，租金按天算，船东知道你等不起。\n\n' +
        '更麻烦的是联络线。港区到国铁干线只有一条单轨，产权属于别人，' +
        '调度权也属于别人；你可以把货卸下来，却没有办法把它运出去。' +
        '这两件事一起做，港口才算重新接通腹地——但钱只够做一件。',
        it: 'Il bacino è insabbiato da sei anni. La banchina profonda che prima della guerra ' +
        'accoglieva piroscafi da diecimila tonnellate ne tiene ormai la metà, e le navi grandi ' +
        'aspettano la marea in rada. L\'ingegnere stende i disegni: il fango da estrarre farebbe una collina, ' +
        'e la draga va noleggiata a Trieste, a giornata, da armatori che sanno che non puoi aspettare.\n\n' +
        'Peggio ancora è il raccordo. Dal porto alla linea ferroviaria c\'è un binario solo, ' +
        'di proprietà altrui, con la precedenza altrui: puoi scaricare la merce e non hai modo di portarla via. ' +
        'Facendo entrambe le cose il porto tornerebbe collegato all\'entroterra — ma i soldi bastano per una.' },
    cost: { ap: 1 },
    cooldown: 4,
    require: function (s) { return s.cabinet.economia === s.playerForce; },
    requireText: { zh: '未掌握公共经济执政官席位', it: 'Ministero dell\'Economia non controllato' },
    options: [
      { id: 'completo',
        text: { zh: '疏浚加联络线，一次做完。', it: 'Dragaggio e raccordo, tutto in una volta.' },
        subtitle: { zh: '把泥沙和铁轨一起解决——这是一座港口重新学会呼吸的方式。', it: 'Risolvere insieme fango e binari: è il modo in cui un porto impara di nuovo a respirare.' },
        preview: ['港口工程 ++', '港口吞吐指数 +', '失业率 −', '财政法 +1'],
        effect: { laws: { fisco: 1 },
                  economy: { works: 14, traffic: 6, unemployment: -3, hinterland: 3 },
                  support: [['portuali', 'LEG', 3], ['operai', 'LEG', 3]] } },
      { id: 'solo_bacino',
        text: { zh: '只疏浚港池，不碰铁路。', it: 'Solo il bacino, senza toccare la ferrovia.' },
        subtitle: { zh: '先把家门口挖干净，铁轨的事留给下一个愿意跟人吵架的执政官。', it: 'Pulire prima il proprio cortile: dei binari si occuperà il prossimo rettore con voglia di litigare.' },
        preview: ['金库 +', '港口工程 +', '港口吞吐指数 +'],
        effect: { funds: 180, economy: { works: 7, traffic: 3 },
                  support: [['portuali', 'LEG', 2]],
                  districts: { porto: { control: 4 } } } },
      { id: 'appalto',
        text: { zh: '把工程包给船东自己的公司。', it: 'Appaltare i lavori alle ditte degli armatori.' },
        subtitle: { zh: '最快的挖掘方式，是让出钱的人自己拿铲子。', it: 'Il modo più rapido di scavare è mettere la pala in mano a chi paga.' },
        preview: ['资本信心 ++', '有产精英 +', '工人 −', '罢工 +'],
        effect: { economy: { works: 10, capitalConfidence: 9, strike: 6 },
                  support: [['borghesia', 'LEG', 4], ['operai', 'LEG', -3]],
                  factions: { sindacalisti: { dis: 12 } } } }
    ]
};
