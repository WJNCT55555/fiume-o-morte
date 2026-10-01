import type { GameEvent } from '../content/types';

/* September 1920: the factory occupations. The one month in which the Italian
   state looked like it might not hold, and therefore the only moment at which
   an early march could plausibly have worked.

   Choosing A here is the gamble: it needs only two of the available forces instead
   of three, and it pays for that with a much worse column. It also closes the
   journal by flag rather than by completion, so the two paths stay distinct. */
export const ev192009Romafronte: GameEvent = {
  id: 'ev_1920_09_romafronte',
  condition: function (s) {
    if (!s.journals.marcia_1920 || s.journals.marcia_1920.done || s.journals.marcia_1920.failed) return false;
    var z = s.forze || {};
    /* Read from world.js so the early window agrees with the journal's rule. */
    const world = (globalThis as any).Fiume?.World;
    const front: string[] = world.availableForzaFront(s);
    var n = front.filter(function (k: string) { return (z[k] || 0) >= 80; }).length;
    /* Early window: two forces are enough to try, but only from September 1920,
       and only while the journal is still live. */
    if (n < 2) return false;
    var ym = s.date.y * 12 + s.date.m;
    return ym >= 1920 * 12 + 9 && ym <= 1922 * 12 + 3;
  },
  title: { zh: '1920 年 9 月：占领工厂', it: 'Settembre 1920: l\'occupazione delle fabbriche' },
  body: { zh: '都灵和米兰的工厂被工人占领了。不是罢工——是占领：工人自己开动机器，自己发工资，' +
      '自己在门口挂上红旗。焦利蒂在议会里说要「不流一滴血地」结束这件事，然后他做到了。\n\n' +
      '但在那三个星期里，意大利没有政府。军队在营房里等命令，命令没有下来。\n\n' +
      '你的人从阜姆打来电报：现在。就现在。铁路还通，警察还没有接到动员令，' +
      '而全国的报纸都在算这个国家还能撑几天。\n\n' +
      '你已经联系到几股政治力量。你可以继续巩固阵线，也可以现在就走。',
    it: 'Le fabbriche di Torino e Milano sono occupate. Non scioperi: occupazioni. Gli operai fanno ' +
      'funzionare i macchinari, si pagano da soli, issano bandiere rosse ai cancelli. ' +
      'Giolitti dice in Parlamento che chiuderà la cosa "senza versare una goccia di sangue", e ci riesce.\n\n' +
      'Ma per tre settimane l\'Italia non ha governo. L\'esercito aspetta ordini nelle caserme, ' +
      'e gli ordini non arrivano.\n\n' +
      'I tuoi telegrafano da Fiume: adesso. Proprio adesso. Le ferrovie sono aperte, la polizia non ha ' +
      'ricevuto l\'ordine di mobilitazione, e i giornali di tutto il Paese contano i giorni che lo Stato ' +
      'può ancora reggere.\n\n' +
      'Hai già aperto alcune linee politiche. Puoi consolidare il fronte, o partire subito.' },
  options: [
    {
      id: 'adesso', text: { zh: '现在就走。窗口不会开第二次。', it: 'Partire adesso. La finestra non si aprirà due volte.' },
      subtitle: { zh: '只有两股力量就出发：纵队会散，但历史只记这一次。', it: 'Partire con due forze soltanto: la colonna si sfalderà, ma la storia ricorderà questa volta.' },
      preview: [{ zh: '提前进军：成功率大幅下降', label: 'marcia anticipata' }, { zh: '开启终局链', label: 'epilogo' }, { zh: '未结盟者转为敌对', label: 'le forze escluse ostili' }],
      effect: function () {
        return {
          flags: { marcia_1920_open: true, marcia_1920_early: true },
          order: { fervour: 16, coup: 14, violence: 6 },
          diplo: { italy: -12, league: -6 },
          factions: { arditi: { dis: -10 }, fascisti: { dis: 8 } },
          next: 'ev_romafronte_epilogo'
        };
      }
    },
    {
      id: 'aspettare', text: { zh: '等。再巩固几股力量，到春天再说。', it: 'Aspettare. Consolidare altre forze e riparlarne in primavera.' },
      subtitle: { zh: '焦利蒂会用三个月让工厂复工，也会用三个月加固铁路。', it: 'Giolitti impiegherà tre mesi a riaprire le fabbriche, e tre mesi a blindare le ferrovie.' },
      preview: [{ zh: '继续经营日志', label: 'il diario continua' }, { zh: '军官团 +', label: 'corpo ufficiale +' }, { zh: '焦利蒂有时间准备', label: 'Giolitti si prepara' }],
      effect: function () {
        return {
          forze: { forzearmate: 8 },
          order: { coup: 4, fervour: -4 },
          economy: { strike: -14, capitalConfidence: 6 },
          factions: { sindacalisti: { dis: 8 } },
          flags: { marcia_1920_waited: true }
        };
      }
    }
  ]
};
