import type { Card } from '../content/types';

/* Free-port status was Fiume's only structural economic asset: Charles VI's
   patent of 1719 had made the city a free port, and everything the Regency
   still earned came through that door. */
export const gvPortofranco: Card = {
    id: 'gv_portofranco', deck: 'governo', ministry: 'economia',
    name: { zh: '自由港法令', it: 'Decreto del porto franco' },
    text: { zh: '一七一九年的那份特许状还躺在档案馆里，羊皮纸的边缘被虫蛀掉了一块。' +
        '哈布斯堡把它给这座城市的时候，阜姆还只是亚得里亚海北端一个没人听说过的小港；' +
        '两百年后，正是这份文件让这里的仓库、栈桥和保险公司比整个克罗地亚加起来还忙。\n\n' +
        '现在它是你的了——如果你敢把一份皇帝的特许状重新拿出来，在一个由诗人建立的共和国里宣读。' +
        '罗马会读作挑衅，贝尔格莱德会读作傲慢，而码头上的搬运工会读作：又有货要卸了。',
        it: 'La patente del 1719 è ancora in archivio, con un angolo di pergamena mangiato dai tarli. ' +
        'Quando gli Asburgo la concessero, Fiume era un porto che nessuno aveva mai sentito nominare; ' +
        'due secoli dopo è quel documento ad aver reso i suoi magazzini, i suoi moli e le sue assicurazioni ' +
        'più indaffarati di tutta la Croazia messa insieme.\n\n' +
        'Adesso è tuo — se hai il coraggio di riesumare la patente di un imperatore e di leggerla ' +
        'in una repubblica fondata da un poeta. Roma ci leggerà una provocazione, Belgrado una supponenza, ' +
        'e gli scaricatori del porto ci leggeranno che c\'è di nuovo merce da scaricare.' },
    cost: { ap: 1 },
    cooldown: 6,
    require: function (s) { return s.cabinet.economia === s.playerForce; },
    requireText: { zh: '未掌握公共经济执政官席位', it: 'Ministero dell\'Economia non controllato' },
    options: [
      { id: 'decreto',
        text: { zh: '按一七一九年的原文全文恢复。', it: 'Restaurare integralmente il testo del 1719.' },
        subtitle: { zh: '让一份死掉两百年的文件重新生效——这是这座城最古老、也最大胆的挑衅。', it: 'Rimettere in vigore un documento morto da due secoli: la provocazione più antica e più audace che questa città possieda.' },
        preview: ['自由港 +1', '港口吞吐指数 ++', '腹地 +', '意大利 −', '港口日志'],
        effect: { laws: { portofranco: 1 }, journals: ['porto'],
                  economy: { traffic: 6, hinterland: 6, works: 4, capitalConfidence: 8 },
                  support: [['borghesia', 'LEG', 4], ['portuali', 'LEG', 2]],
                  diplo: { italy: -4, yugoslavia: -3 } } },
      { id: 'limitato',
        text: { zh: '只给关税暂缓区，不给完整特权。', it: 'Concedere solo un deposito franco, non la patente piena.' },
        subtitle: { zh: '把皇帝的羊皮纸裁成一张商业合同——少了神话，多了生意。', it: 'Ritagliare la pergamena dell\'imperatore in un contratto commerciale: meno mito, più affari.' },
        preview: ['自由港 +1', '意大利 +', '国联 +', '工团派异议 +'],
        effect: { laws: { portofranco: 1 }, diplo: { italy: 6, league: 4 },
                  economy: { traffic: 3, capitalConfidence: 4 },
                  support: [['borghesia', 'LEG', 2]],
                  factions: { sindacalisti: { dis: 8 } } } },
      { id: 'rinvio',
        text: { zh: '先把港口收归公营，再谈特许状。', it: 'Prima il porto pubblico, poi la patente.' },
        subtitle: { zh: '码头工人不需要一七一九年，他们需要的是一份工时表。', it: 'Gli scaricatori non hanno bisogno del 1719: hanno bisogno di un orario di lavoro.' },
        preview: ['工人 ++', '劳动法 +', '资本信心 −−', '港口吞吐指数 −'],
        effect: { laws: { lavoro: 1 },
                  support: [['portuali', 'LEG', 5], ['operai', 'LEG', 4]],
                  economy: { capitalConfidence: -10, traffic: -4, works: 6 },
                  factions: { sindacalisti: { inf: 3, dis: -12 } } } }
    ]
};
