import type { GameEvent } from '../content/types';


export const ev191911Blocco: GameEvent = {
    id: 'ev_1919_11_blocco', date: { y: 1919, m: 11 },
    title: { zh: '封锁', it: 'Il blocco' },
    body: { zh: '罗马的命令下来了：所有驶往阜姆的船只在亚得里亚海被拦截。巴多里奥将军封锁了一切补给——' +
        '煤、面粉、糖、汽油都进不来。\n\n' +
        '城里的粮仓还能撑几个星期。军团兵把军饷花在了城里的咖啡馆，但咖啡馆没有面粉。\n\n' +
        '你的三千人吃什么，这座城市就吃什么。',
      it: 'L\'ordine è arrivato da Roma: le navi dirette a Fiume vengono fermate in Adriatico. Il generale Badoglio ha bloccato tutti i rifornimenti: carbone, farina, zucchero, benzina.\n\n' +
        'I magazzini tengono qualche settimana. I legionari spendono la paga nei caffè della città, ma i caffè non hanno farina.\n\n' +
        'Quello che mangiano i tuoi tremila lo mangia la città.' },
    options: [
      {
        id: 'a', text: { zh: '开征「爱国捐献」，向城里的富户要钱要粮', it: 'Imporre un prestito patriottico ai maggiorenti' },
        preview: [{ zh: '金库 ++', label: 'Tesoro ++' }, { zh: '商业派异议 +', label: 'Fiumani +' }, { zh: '资本信心 −', label: 'fiducia −' }],
        effect: function () { return { funds: 620, economy: { capitalConfidence: -10 }, support: [['borghesia', 'LEG', -4], ], factions: { sindacalisti: { dis: -6 } } }; }
      },
      {
        id: 'b', text: { zh: '让国民委员会去印钱。加盖的克朗也是钱。', it: 'Far stampare buoni al Consiglio Nazionale. Anche una corona sovrastampata è denaro.' },
        preview: [{ zh: '金库 +++', label: 'Tesoro +++' }, { zh: '通胀 ++', label: 'inflazione ++' }, { zh: '开启「阜姆券」日志', label: 'Diario: i buoni' }],
        effect: function () { return { funds: 900, economy: { inflation: 12, capitalConfidence: -14 }, journals: ['cassa'] }; }
      },
      {
        id: 'c', text: { zh: '让码头工人自己去苏沙克买粮，睁一只眼闭一只眼', it: 'Chiudere un occhio: che i portuali comprino a Sussak' },
        preview: [{ zh: '工人支持 +', label: 'operai +' }, { zh: '通胀 −', label: 'inflazione −' }, { zh: '南斯拉夫 +', label: 'Jugoslavia +' }],
        effect: function () { return { funds: 240, economy: { inflation: -5, strike: -6 }, support: [['portuali', 'LEG', 4], ['operai', 'LEG', 2]], diplo: { yugoslavia: 6 }, flags: { smuggle: true } }; }
      },
      {
        id: 'd', text: { zh: '拒绝配给。让军团兵去征用。', it: 'Niente razionamento. Requsiscono i legionari.' },
        preview: [{ zh: '领袖权威 +', label: 'autorità +' }, { zh: '暴力 ++', label: 'violenza ++' }, { zh: '本地人异议 ++', label: 'Fiumani ++' }],
        effect: function () { return { funds: 380, order: { authority: 4, violence: 14, squadre: 6 }, support: [['artigiani', 'LEG', -4], ['borghesia', 'LEG', -5]], factions: { arditi: { dis: -8 } } }; }
      }
    ]
  };
