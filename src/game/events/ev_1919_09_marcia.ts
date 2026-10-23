import type { GameEvent } from '../content/types';


export const ev191909Marcia: GameEvent = {
    id: 'ev_1919_09_marcia', date: { y: 1919, m: 9, d: 12 }, opening: true,
    condition: function (s) { return s.playerForce === 'LEG'; },
    title: { zh: '1919 年 9 月 12 日：进军', it: '12 settembre 1919: la Marcia' },
    body: { zh: '9 月 11 日夜里，诗人抵达龙基。驻扎龙基的掷弹兵指挥官卡洛·雷纳少校同意通过在阜姆率领叛军纵队来支持这位诗人。政府军指挥官指派阿尔迪蒂步兵团的几个小队扼杀这次远征，但他们的指挥官拉斐尔·雷佩托上校却加入了起义军，而起义军的队伍也随着每公里的行进不断壮大。' +
        '1919年9月12日黎明，加布里埃尔·邓南遮率领：狂热的民族主义者；叛离的正规军人；退伍的军人；国际志愿军；雇佣兵；冒险家；知识分子；反叛的青年学生；新闻记者；革命家；社会主义者；工团主义者；无政府主义者；诗人；作家；未来主义及其他派别艺术家；；机会主义商人；亡命之徒；社会边缘人的联军向阜姆进军。他们来自各行各业，各个阶层，各个意识形态\n\n' +
        '车队沿着海岸公路往东。当天午后，你进了阜姆。\n\n' +
        '全城在等你：意大利人、克罗地亚人、斯洛文尼亚人，还有协约国的占领军。' +
        '你走上省督府的阳台，对广场上的人说，这座城市并入意大利。\n\n' +
        '罗马没有授权你做这件事。尼蒂首相在几小时后下令封锁这座城。',
      it: 'Nella notte dell\'11 settembre sei arrivato a Ronchi dei Legionari; la colonna è partita all\'alba del giorno dopo, con duecento uomini. A Ronchi si è unito a voi un battaglione dei Granatieri di Sardegna: dovevano fermarvi.\n\n' +
        'La colonna risale la costa verso est. Nel primo pomeriggio entri a Fiume.\n\n' +
        'La città vi aspetta: italiani, croati, sloveni, e le truppe di occupazione interalleate. Dal balcone del Palazzo del Governo annunci l\'annessione della città all\'Italia.\n\n' +
        'Roma non ti ha autorizzato. Poche ore dopo il presidente Nitti ordina il blocco della città.' },
    options: [
      {
        id: 'a', text: { zh: '宣布阜姆并入意大利，等待罗马接受既成事实', it: 'Proclamare l\'annessione e attendere che Roma accetti il fatto compiuto' },
        preview: [{ zh: '民众热忱 ++', label: 'fervore ++' }, { zh: '军团民意 +', label: 'legittimità +' }, { zh: '意大利 −−', label: 'Italia −−' }],
        effect: function () { return { order: { fervour: 8, authority: 5 }, diplo: { italy: -12, uk: -4, france: -4 }, support: [['artigiani', 'LEG', 3]], journals: ['impresa'] }; }
      },
      {
        id: 'b', text: { zh: '先恢复秩序：接管市政、警政与报纸，再谈归属', it: 'Prima l\'ordine: prendere Municipio, polizia e giornali, poi si vedrà' },
        preview: [{ zh: '摄政领袖权威 ++', label: 'autorità ++' }, { zh: '政治暴力 +', label: 'violenza +' }, { zh: '工团派异议 +', label: 'Falange +' }],
        effect: function () { return { order: { authority: 9, violence: 6, milizia: 180 }, factions: { arditi: { dis: -12 }, sindacalisti: { dis: 8 } }, journals: ['impresa'] }; }
      },
      {
        id: 'c', text: { zh: '把协约国军队留在城里。让他们看着。', it: 'Lasciare in città le truppe interalleate. Che guardino.' },
        preview: [{ zh: '英法美 +', label: 'UK/FR/US +' }, { zh: '国际承认 +', label: 'legittimità internazionale +' }, { zh: '法西斯派异议 +', label: 'Fascio +' }],
        effect: function () { return { diplo: { uk: 8, france: 8, usa: 8, italy: -4 }, economy: { recognition: 6 }, order: { violence: -6, fervour: 3 }, support: [['borghesia', 'LEG', 3], ], factions: { fascisti: { dis: 10 }, futuristi: { dis: 6 } }, journals: ['impresa'] }; }
      },
      {
        id: 'd', text: { zh: '当夜对军团兵讲话：这不是占领，这是革命', it: 'Parlare ai legionari: non è un\'occupazione, è una rivoluzione' },
        preview: [{ zh: '民众热忱 +++', label: 'fervore +++' }, { zh: '阿迪蒂/工团派 +', label: 'Arditi/Falange +' }],
        effect: function () { return { order: { fervour: 14, milizia: 260, squadre: 4 }, support: [['operai', 'LEG', 3], ['portuali', 'LEG', 2], ], factions: { sindacalisti: { inf: 2, dis: 6 } } }; }
      }
    ]
  };
