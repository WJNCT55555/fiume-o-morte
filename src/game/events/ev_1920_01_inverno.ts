import type { GameEvent } from '../content/types';


export const ev192001Inverno: GameEvent = {
    id: 'ev_1920_01_inverno', date: { y: 1920, m: 1 },
    title: { zh: '军团兵的冬天', it: 'L\'inverno dei legionari' },
    body: { zh: '封锁进入第三个月。煤配给到每天两小时，面粉按人头。城里开始有人抱怨：' +
        '"至少奥地利人给过我们暖气。"\n\n' +
        '更麻烦的是钱。三千人的军饷没有着落——罗马不付，的里雅斯特的募捐箱见了底，' +
        '而军团兵已经开始用步枪跟商人换面包。\n\n' +
        '你有一个选择：让这支军队继续当一支军队，还是让它变成一场运动。',
      it: 'Terzo mese di blocco. Il carbone è razionato a due ore al giorno, la farina a testa. In città qualcuno comincia a dire: "almeno gli austriaci ci davano il riscaldamento".\n\n' +
        'Il problema vero sono i soldi. Tremila uomini senza paga: Roma non paga, le collette di Trieste sono esaurite, e i legionari hanno già cominciato a scambiare fucili con i commercianti in cambio di pane.\n\n' +
        'Hai una scelta: tenere questo esercito come esercito, o trasformarlo in un movimento.' },
    options: [
      {
        id: 'a', text: { zh: '发军饷。卖掉能卖的一切，包括城里的银器。', it: 'Pagare. Vendere tutto il vendibile, compreso l\'argento della città.' },
        preview: [{ zh: '金库 −−', label: 'Tesoro −−' }, { zh: '军心 ++', label: 'Milizia ++' }, { zh: '工团派异议 +', label: 'Falange +' }],
        effect: function () { return { funds: -420, order: { milizia: 400, fervour: 5, authority: 4 }, factions: { sindacalisti: { dis: 10 } } }; }
      },
      {
        id: 'b', text: { zh: '不发军饷，发承诺：把《卡尔纳罗宪章》的草稿念给他们听', it: 'Niente paga: una promessa. Leggere loro la bozza della Carta.' },
        preview: [{ zh: '工团派 +', label: 'Falange +' }, { zh: '军心 −', label: 'Milizia −' }, { zh: '军团民意 +', label: 'legittimità +' }],
        effect: function () { return { order: { milizia: -180, fervour: 6 }, support: [['operai', 'LEG', 3], ['portuali', 'LEG', 2]], factions: { arditi: { dis: 12 } } }; }
      },
      {
        id: 'c', text: { zh: '让军团兵进城做工。码头、修路、清淤。', it: 'Mettere i legionari al lavoro. Molo, strade, dragaggio.' },
        preview: [{ zh: '港口工程 +', label: 'opere +' }, { zh: '失业率 −', label: 'disoccupazione −' }, { zh: '阿迪蒂异议 +', label: 'Arditi +' }],
        effect: function () { return { economy: { works: 8, unemployment: -3, traffic: 2 }, funds: 120, support: [['portuali', 'LEG', 3], ['operai', 'LEG', 3]], factions: { arditi: { dis: -6 } } }; }
      },
      {
        id: 'd', text: { zh: '让阿迪蒂去筹钱。他们有自己的办法。', it: 'Mandare gli arditi a procurarsi il denaro. Hanno i loro metodi.' },
        preview: [{ zh: '金库 ++', label: 'Tesoro ++' }, { zh: '政治暴力 ++', label: 'violenza ++' }, { zh: '军团民意 −−', label: 'legittimità −−' }],
        effect: function () { return { funds: 640, order: { violence: 16, squadre: 8, authority: -4 }, support: [['borghesia', 'LEG', -5]], factions: { sindacalisti: { dis: 14 } }, diplo: { italy: -5, league: -5 } }; }
      }
    ]
  };
