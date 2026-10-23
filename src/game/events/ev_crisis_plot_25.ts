import type { GameEvent } from '../content/types';

/* The plot gauge's 25 milestone. The fascists ask for seats inside the
   movement before they take the street; the answer shapes how fast the
   subversion axis keeps climbing. Non-historical only: in 史实 the movement's
   internal quarrel stays in the background. */
export const evCrisisPlot25: GameEvent = {
  id: 'ev_crisis_plot_25',
  once: true,
  crisis: { axis: 'subversion', at: 25 },
  condition: function (s) {
    return s.difficulty !== 'historical' && s.order.subversion >= 25;
  },
  title: { zh: '法西斯派要席位', it: 'I fascisti chiedono seggi' },
  body: { zh: '危机不总是从街上来。这一次是从会议室里来的。\n\n' +
      '法西斯派在运动内部递上一份名单：他们要三名执政官席位、要《铁头》报的一个版面、要街头小队的正式编制。他们说这不是夺权，是「让运动代表运动」。\n\n' +
      '阿迪蒂在走廊里冷笑；工团派把名单推回来；而广场上的小队已经在等答复。',
    it: 'La crisi non arriva sempre dalla strada. Questa volta arriva dalla sala del consiglio.\n\n' +
      'I fascisti presentano una lista: tre seggi fra i Rettori, una pagina sul «Testa di Ferro», l\'inquadramento ufficiale delle squadre. Non è una presa del potere, dicono: è «far rappresentare il movimento dal movimento».\n\n' +
      'Gli arditi ridono nel corridoio; i sindacalisti respingono il foglio; in piazza le squadre aspettano una risposta.' },
  options: [
    {
      id: 'seggi',
      text: { zh: '给席位。把最危险的人绑进制度里。', it: 'Concedere i seggi. Legare il più pericoloso all\'istituzione.' },
      preview: [{ zh: '法西斯派影响 +', label: 'Fascio inf. +' }, { zh: '法西斯派异议 −−', label: 'Fascio diss. −−' },
        { zh: '法西斯暴力 +', label: 'squadre +' }, { zh: '摄政领袖权威 −', label: 'autorità −' }],
      effect: function () {
        return {
          factions: {
            fascisti: { inf: 3, dis: -12 },
            sindacalisti: { dis: 10 },
            arditi: { dis: 8 }
          },
          order: { squadre: 4, authority: -2 },
          forze: { fascisti: 4 }
        };
      }
    },
    {
      id: 'rifiuto',
      text: { zh: '拒绝。名单退回去，席位不给。', it: 'Rifiutare. La lista torna indietro.' },
      preview: [{ zh: '法西斯派异议 ++', label: 'Fascio diss. ++' }, { zh: '法西斯暴力 +', label: 'squadre +' },
        { zh: '政治暴力 +', label: 'violenza +' }, { zh: '摄政领袖权威 +', label: 'autorità +' }],
      effect: function () {
        return {
          factions: {
            fascisti: { dis: 18 },
            arditi: { dis: -4 },
            sindacalisti: { dis: -6 }
          },
          order: { squadre: 6, violence: 4, authority: 3 }
        };
      }
    },
    {
      id: 'espulsione',
      text: { zh: '把法西斯派赶出运动。现在比以后便宜。', it: 'Espellere i fascisti dal movimento. Costa meno ora che dopo.' },
      preview: [{ zh: '法西斯派影响 −−', label: 'Fascio inf. −−' }, { zh: '法西斯派异议 +++', label: 'Fascio diss. +++' },
        { zh: '法西斯暴力 ++', label: 'squadre ++' }, { zh: '政治暴力 +', label: 'violenza +' },
        { zh: '摄政领袖权威 +', label: 'autorità +' }],
      effect: function () {
        return {
          factions: {
            fascisti: { inf: -4, dis: 24 },
            sindacalisti: { dis: -10 },
            arditi: { dis: 4 }
          },
          order: { squadre: 8, violence: 6, authority: 5 },
          forze: { fascisti: -6 }
        };
      }
    }
  ]
};
