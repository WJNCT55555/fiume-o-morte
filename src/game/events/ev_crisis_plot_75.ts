import type { GameEvent } from '../content/types';

/* The plot gauge's 75 milestone: Giunta's squads arrive from Trieste. The
   historical event is the 1922 coup; this is the moment before it, when the
   city can still choose whether the squads enter armed. Non-historical only. */
export const evCrisisPlot75: GameEvent = {
  id: 'ev_crisis_plot_75',
  once: true,
  crisis: { axis: 'subversion', at: 75 },
  condition: function (s) {
    return s.difficulty !== 'historical' && s.order.subversion >= 75;
  },
  title: { zh: '君塔的小队进城', it: 'Le squadre di Giunta entrano in città' },
  body: { zh: '的里雅斯特来的火车在站台上停下。车门打开，先下来的是靴子，然后是黑衫，然后是弗朗切斯科·君塔本人。\n\n' +
      '他们说是来「保护阜姆的意大利性」的。站长不敢拦；宪兵站在站台尽头，看着。\n\n' +
      '你的军团在站前广场列队。两边都带着枪，两边都等着对方先动。',
    it: 'Il treno da Trieste si ferma sul binario. Si aprono le porte: prima gli stivali, poi le camicie nere, poi Francesco Giunta in persona.\n\n' +
      'Dicono di venire a «proteggere l\'italianità di Fiume». Il capostazione non osa fermarli; i carabinieri restano in fondo al binario, a guardare.\n\n' +
      'I tuoi legionari sono schierati davanti alla stazione. Tutti e due i lati hanno i fucili. Tutti e due aspettano che l\'altro si muova.' },
  options: [
    {
      id: 'fermare',
      text: { zh: '在站台拦住他们。阜姆的街不归的里雅斯特管。', it: 'Fermarli sul binario. Le strade di Fiume non sono di Trieste.' },
      preview: [{ zh: '法西斯暴力 −−', label: 'squadre −−' }, { zh: '政治暴力 +', label: 'violenza +' },
        { zh: '意大利 +', label: 'Italia +' }, { zh: '军团兵力 −', label: 'milizia −' },
        { zh: '摄政领袖权威 +', label: 'autorità +' }],
      effect: function () {
        return {
          order: { squadre: -8, violence: 6, authority: 4, milizia: -120 },
          diplo: { italy: 3 },
          factions: { fascisti: { dis: 14 }, arditi: { dis: -6 }, sindacalisti: { dis: -8 } },
          forze: { fascisti: -4 }
        };
      }
    },
    {
      id: 'lasciare',
      text: { zh: '让他们进城。让他们看看谁才是主人。', it: 'Lasciarli entrare. Che vedano chi comanda.' },
      preview: [{ zh: '法西斯暴力 ++', label: 'squadre ++' }, { zh: '政治暴力 +', label: 'violenza +' },
        { zh: '法西斯派影响 +', label: 'Fascio inf. +' }, { zh: '摄政领袖权威 −−', label: 'autorità −−' }],
      effect: function () {
        return {
          order: { squadre: 12, violence: 8, authority: -4 },
          factions: { fascisti: { inf: 3, dis: -10 }, sindacalisti: { dis: 12 }, arditi: { dis: 6 } },
          forze: { fascisti: 6 }
        };
      }
    },
    {
      id: 'prefetto',
      text: { zh: '让省督府出面：他们可以进城，但不许带枪。', it: 'Far uscire il Prefetto: possono entrare, ma senza fucili.' },
      preview: [{ zh: '意大利 +', label: 'Italia +' }, { zh: '驻军 +', label: 'presidio +' },
        { zh: '法西斯暴力 +', label: 'squadre +' }, { zh: '摄政领袖权威 +', label: 'autorità +' }],
      effect: function () {
        return {
          order: { squadre: 4, garrison: 6, authority: 2 },
          diplo: { italy: 6 },
          factions: { fascisti: { dis: 8 }, sindacalisti: { dis: -4 }, arditi: { dis: -4 } }
        };
      }
    }
  ]
};
