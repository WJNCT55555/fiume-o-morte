import type { Card } from '../content/types';

/* Unemployment relief was the Regency's largest single discretionary line.
   Unemployment ran near twenty per cent, and emigration to the United States
   was a real and officially encouraged answer. */
export const gvDisoccupazione: Card = {
    id: 'gv_disoccupazione', deck: 'governo', ministry: 'lavoro',
    name: { zh: '失业救济工程', it: 'Lavori pubblici contro la disoccupazione' },
    text: { zh: '失业率已经两成，而且这个数字还会继续涨。造船厂停了一半，' +
        '烟草厂按周开工，码头上等着扛包的人比包还多。' +
        '劳动执政官的桌上摆着三份方案，每一份都在回答同一个问题：' +
        '一座没有工作的城市，是靠发钱活下去，还是靠干活活下去。\n\n' +
        '给钱最快，也最贵，而且钱花完就没有了。给活干慢一些，' +
        '但挖出来的沟渠、修好的路、清出来的港池都留在那里。' +
        '还有第三份方案，没有人愿意先开口念出来：' +
        '替他们买一张去美国的船票，让问题变成别人的问题。',
        it: 'La disoccupazione è al venti per cento, e continuerà a salire. ' +
        'Il cantiere navale lavora a metà, la manifattura dei tabacchi a settimane alterne, ' +
        'e sul molo c\'è più gente in attesa di un carico che carico da scaricare. ' +
        'Sulla scrivania del Rettore al Lavoro ci sono tre proposte, e tutte rispondono ' +
        'alla stessa domanda: una città senza lavoro sopravvive di elemosina o di fatica?\n\n' +
        'Il denaro è la via più rapida e la più cara, e quando finisce non resta nulla. ' +
        'Il lavoro è più lento, ma i canali scavati, le strade sistemate e il bacino dragato ' +
        'restano lì. C\'è poi una terza proposta, che nessuno vuole leggere ad alta voce per primo: ' +
        'comprare loro un biglietto per l\'America e trasformare il problema in un problema altrui.' },
    cost: { ap: 1 },
    cooldown: 2,
    require: function (s) { return s.cabinet.lavoro === s.playerForce; },
    requireText: { zh: '未掌握劳动执政官席位', it: 'Ministero del Lavoro non controllato' },
    options: [
      { id: 'cantieri',
        text: { zh: '开一批公共工地，用工作换救济。', it: 'Aprire cantieri pubblici: lavoro in cambio di soccorso.' },
        subtitle: { zh: '让失业的人去挖一条将来会有用的沟——这是唯一一种救济能留下来的形式。', it: 'Mandare i disoccupati a scavare un canale che servirà: è l\'unica forma di soccorso che lascia qualcosa dietro di sé.' },
        preview: ['失业 −−', '港口工程 +', '热度 −', '港口日志'],
        effect: { journals: ['porto'], order: { fervour: -4, squadre: -3 },
                  support: [['portuali', 'LEG', 3], ['operai', 'LEG', 4], ['artigiani', 'LEG', 2]],
                  economy: { unemployment: -6, traffic: 2, works: 5 } } },
      { id: 'sussidio',
        text: { zh: '直接发救济金。', it: 'Sussidi diretti in denaro.' },
        subtitle: { zh: '把钱放进手里，比把钱放进工程里快得多，也忘得快得多。', it: 'Mettere il denaro in mano è molto più rapido che metterlo in un cantiere, e si dimentica altrettanto in fretta.' },
        preview: ['金库 −−−', '失业 −', '资本信心 −', '通胀 +'],
        effect: { funds: -420,
                  support: [['portuali', 'LEG', 5], ['operai', 'LEG', 5], ['contadini', 'LEG', 2]],
                  economy: { unemployment: -4, capitalConfidence: -6, inflation: 4 } } },
      { id: 'emigrazione',
        text: { zh: '资助失业者离城。', it: 'Pagare il viaggio a chi parte.' },
        subtitle: { zh: '一张去纽约的三等舱船票，比一整个冬天的救济金便宜。', it: 'Un biglietto di terza classe per New York costa meno di un inverno intero di sussidi.' },
        preview: ['失业 −−', '人口 −−', '金库 −'],
        effect: { funds: -220, diplo: { usa: 4 },
                  support: [['borghesia', 'LEG', 3], ['operai', 'LEG', -4]],
                  economy: { unemployment: -7, population: -300, capitalConfidence: 4 } } }
    ]
};
