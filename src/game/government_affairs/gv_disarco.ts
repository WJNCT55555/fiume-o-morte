import type { Card } from '../content/types';

/* Disarming the fascists was the single most consequential decision the
   Regency could take, and the one it never took. Host-Venturi, the Rector of
   Defence, was himself a fascist and his men were setting up checkpoints. */
export const gvDisarco: Card = {
    id: 'gv_disarco', deck: 'governo', ministry: 'difesa',
    name: { zh: '解除法西斯小队武装', it: 'Disarmo delle squadre fasciste' },
    text: { zh: '霍斯特-文图里是你的国防执政官，而他的人正在街上设卡。' +
        '小队名义上隶属军团，实际上是墨索里尼在阜姆的分支；' +
        '他们的步枪是意大利送来的，他们的名单上有城里的每一个社会主义者。\n\n' +
        '这是一个必须在某个时点做出的决定，而每一个版本都有代价。' +
        '全城搜缴，你会得到一条安静的街道和一个愤怒的国防部；' +
        '只登记不没收，你会得到一份漂亮的档案——和那些枪一直在原处；' +
        '跟他们做交易，你会得到一支解散的小队，代价是内阁里多一个他们的人。' +
        '什么都不做，也是一种决定，只是它由别人替你做。',
        it: 'Host-Venturi è il tuo Rettore alla Difesa, e i suoi uomini stanno mettendo posti di blocco. ' +
        'Le squadre appartengono sulla carta alla Legione, in realtà sono il ramo fiumano di Mussolini: ' +
        'i loro fucili arrivano dall\'Italia, e sulle loro liste c\'è il nome di ogni socialista della città.\n\n' +
        'È una decisione che a un certo punto va presa, e ogni versione ha un prezzo. ' +
        'Perquisire tutta la città ti darà una strada tranquilla e un ministero furioso; ' +
        'registrare senza confiscare ti darà un archivio impeccabile — e i fucili dove sono sempre stati; ' +
        'patteggiare ti darà una squadra sciolta al costo di un loro uomo in gabinetto. ' +
        'Non fare nulla è anch\'esso una decisione: solo, la prendono altri per te.' },
    cost: { ap: 1 },
    cooldown: 6,
    require: function (s) { return s.cabinet.difesa === s.playerForce; },
    requireText: { zh: '未掌握国防执政官席位', it: 'Ministero della Difesa non controllato' },
    options: [
      { id: 'disarmo',
        text: { zh: '全城搜缴，不留例外。', it: 'Perquisire tutta la città, senza eccezioni.' },
        subtitle: { zh: '没收每一支枪，包括那些说自己是来保护你的人手里的。', it: 'Confiscare ogni fucile, compresi quelli in mano a chi dice di essere venuto a proteggerti.' },
        preview: ['法西斯暴力 −−−', '事态累积 −−', '法西斯派异议 +++'],
        effect: { flags: { fascio_disarmed: true },
                  order: { squadre: -18, violence: -6, coup: -12, authority: 4 },
                  support: [['operai', 'LEG', 3], ['portuali', 'LEG', 3], ['borghesia', 'LEG', 2]],
                  factions: { fascisti: { inf: -5, dis: 22 }, sindacalisti: { dis: -10 }, arditi: { dis: -8 } } } },
      { id: 'registro',
        text: { zh: '只登记枪支，不搜缴。', it: 'Registrare le armi, senza confiscarle.' },
        subtitle: { zh: '一份写得整整齐齐的名册，在枪响之前和之后都同样没用。', it: 'Un registro ordinato è ugualmente inutile prima e dopo lo sparo.' },
        preview: ['公共秩序 +1', '政治暴力 −', '法西斯暴力 −', '意大利 +'],
        effect: { laws: { ordine: 1 },
                  order: { squadre: -6, violence: -3, authority: 2 },
                  diplo: { italy: 4, league: 3 },
                  factions: { fascisti: { dis: 8 }, sindacalisti: { dis: -6 } } } },
      { id: 'accordi',
        text: { zh: '做个交易：交出小队，换内阁席位。', it: 'Un patto: consegnano le squadre, entrano in gabinetto.' },
        subtitle: { zh: '把街上的人请进屋里，枪就看不见了——只是从此屋里也有枪。', it: 'Far entrare in casa gli uomini della strada: i fucili non si vedono più, ma da allora i fucili sono anche in casa.' },
        preview: ['法西斯暴力 −−', '法西斯派 +', '内政席位易手'],
        effect: { cabinet: { interno: 'ANI' }, laws: { ordine: 1 },
                  order: { squadre: -12, coup: -8, violence: -4 },
                  factions: { fascisti: { inf: 4, dis: -16 }, sindacalisti: { dis: 16 }, arditi: { dis: 10 } } } }
    ]
};
