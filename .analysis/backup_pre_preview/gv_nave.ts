import type { Card } from '../content/types';

/* The Regency had no navy. It had a few boats and a lot of nerve.
   When D'Annunzio left in January 1921 he sailed out on the Enea. */
export const gvNave: Card = {
    id: 'gv_nave', deck: 'governo', ministry: 'difesa',
    name: { zh: '征用阜姆舰艇', it: 'Requisire le navi di Fiume' },
    text: { zh: '港里停着几艘船，船身上还刷着匈牙利-克罗地亚航运公司的名字。' +
        '名义上它们属于的里雅斯特的一家股份公司，实际上属于那些把船开进来就再没敢开出去的船长。' +
        '共和国没有海军，只有这几条吃水很浅、锅炉很旧、随时可能被扣下的船。\n\n' +
        '而海是唯一一条没有被罗马封死的路。审计官把船册放在你桌上：' +
        '你可以以国防的名义把它们拿走，可以按市价租，也可以把用不上的那几条凿沉在航道里——' +
        '让任何想开进来的军舰先撞上自己的贪婪。',
        it: 'In porto galleggiano alcune navi, con il nome della compagnia di navigazione ungherese-croata ' +
        'ancora dipinto sulla prua. Sulla carta appartengono a una società per azioni di Trieste; ' +
        'in realtà appartengono ai capitani che le hanno portate dentro e non hanno più osato riportarle fuori. ' +
        'La Repubblica non ha una marina: ha queste poche carene, leggere, con le caldaie vecchie, ' +
        'sempre sul punto di essere sequestrate.\n\n' +
        'E il mare è l\'unica strada che Roma non è riuscita a chiudere. Il revisore posa il registro ' +
        'sulla scrivania: puoi prenderle in nome della difesa, noleggiarle a prezzo di mercato, ' +
        'oppure autoaffondare le inutili nel canale — perché la prima nave da guerra che vuole entrare ' +
        'vada a sbattere contro la sua stessa ingordigia.' },
    cost: { ap: 1 },
    cooldown: 4,
    require: function (s) { return s.cabinet.difesa === s.playerForce; },
    requireText: { zh: '未掌握国防执政官席位', it: 'Ministero della Difesa non controllato' },
    options: [
      { id: 'requisire',
        text: { zh: '以国防的名义直接征用。', it: 'Requisirle senz\'altro in nome della difesa.' },
        subtitle: { zh: '把「国防」两个字写在征用令上，船东的律师就只能去找罗马，而罗马正忙着封锁你。', it: 'Scrivere «difesa» sull\'ordine di requisizione: gli avvocati degli armatori potranno solo rivolgersi a Roma, che è occupata a bloccarti.' },
        preview: ['军团兵 ++', '领袖权威 +', '意大利 −−'],
        effect: { order: { authority: 4, fervour: 5, milizia: 140 }, economy: { traffic: -2 },
                  support: [['portuali', 'LEG', 2]],
                  diplo: { italy: -8, yugoslavia: -4, league: -3 } } },
      { id: 'noleggio',
        text: { zh: '向船东租用，按市场价付钱。', it: 'Noleggiarle dagli armatori, pagando il prezzo di mercato.' },
        subtitle: { zh: '付钱是最慢的手段，也是最不容易被写进外交照会的手段。', it: 'Pagare è il modo più lento e il meno citabile in una nota diplomatica.' },
        preview: ['金库 −−', '商业派 +', '合法性 +', '意大利 −'],
        effect: { funds: -280, order: { milizia: 100, authority: 2 },
                  support: [['borghesia', 'LEG', 4]],
                  economy: { capitalConfidence: 5 }, diplo: { italy: -4 } } },
      { id: 'affondare',
        text: { zh: '把用不上的船凿沉在航道里。', it: 'Autoaffondare nel canale le navi inutilizzabili.' },
        subtitle: { zh: '沉船比水雷诚实——它连自己一起堵住。', it: 'Una nave affondata è più onesta di una mina: ostruisce anche se stessa.' },
        preview: ['航道封锁', '吞吐 −−−', '意大利 −', '事态 +'],
        effect: { economy: { traffic: -9, hinterland: -4 }, order: { authority: 5, coup: 6 },
                  diplo: { italy: -10, yugoslavia: -6 },
                  districts: { porto: { control: 6, agitation: 6 } } } }
    ]
};
