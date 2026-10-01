import type { Card } from '../content/types';

/* Fiume's municipal police belonged to the city's civil administration. The
   Carta draft explicitly lets communes maintain their own police (art. 19). */
export const gvPolizia: Card = {
  id: 'gv_polizia', deck: 'governo', ministry: 'interno',
  name: { zh: '市政警察改革', it: 'Riforma della polizia municipale' },
  text: {
    zh: '阜姆的市政警察早已存在，问题是由谁指挥、向谁负责。市政厅坚持保留行政监督权，军团兵则担心街头治安落入反对派手中。\n\n' +
      '德·安布里斯的草案允许市镇维持自己的警察。你可以让现有警力接受公开的市政监督，也可以把指挥权移向摄政政府。',
    it: 'La polizia municipale di Fiume esiste già. La questione è chi la dirige e a chi risponde. Il Municipio difende la sua vigilanza amministrativa; i legionari temono che l\'ordine delle strade finisca agli oppositori.\n\n' +
      'Il progetto di De Ambris lascia ai comuni la loro polizia. Puoi sottoporre gli agenti esistenti al controllo pubblico del Municipio oppure accentrare il comando nella Reggenza.'
  },
  cost: { ap: 1 }, cooldown: 6,
  require: function (s) { return s.cabinet.interno === s.playerForce; },
  requireText: { zh: '未掌握内政与司法执政官席位', it: 'Ministero dell\'Interno non controllato' },
  options: [
    {
      id: 'comunale',
      text: { zh: '保留市政监督，扩充现有市警。', it: 'Rafforzare la polizia sotto il controllo municipale.' },
      subtitle: { zh: '按公开程序执法，市政厅负责预算与投诉。', it: 'Procedure pubbliche, bilancio e reclami sotto il Municipio.' },
      preview: ['公共秩序升至至少 2 级', '市警编制 +60', '法西斯暴力 −', '阿迪蒂异议 +'],
      effect: function (s) { return { laws: { ordine: Math.max(0, 2 - s.laws.ordine) }, order: { police: 60, authority: 4, squadre: -8 },
        support: [['borghesia', 'LEG', 3], ['artigiani', 'LEG', 2]],
        factions: { sindacalisti: { dis: -8 }, arditi: { dis: 8 } } }; }
    },
    {
      id: 'reggenza',
      text: { zh: '由摄政内政部门直接统筹市警。', it: 'Coordinare la polizia dal rettorato degli Interni.' },
      subtitle: { zh: '执行更快，但市政厅会质疑这种集中。', it: 'Interventi più rapidi, ma il Municipio contesterà l\'accentramento.' },
      preview: ['公共秩序改为 1 级', '市警编制 +30', '摄政领袖权威 +', '政治暴力 +'],
      effect: function (s) { return { laws: { ordine: 1 - s.laws.ordine }, order: { police: 30, authority: 7, violence: 3 },
        factions: { arditi: { dis: -6 }, sindacalisti: { dis: 9 } } }; }
    },
    {
      id: 'rinunciare',
      text: { zh: '暂不改变现有市警。', it: 'Lasciare la polizia municipale com\'è.' },
      subtitle: { zh: '市政厅仍负责日常治安，改革延后。', it: 'Il Municipio conserva l\'ordine quotidiano; la riforma attende.' },
      preview: ['法西斯暴力 +', '摄政领袖权威 −'],
      effect: { order: { authority: -3, squadre: 5 } }
    }
  ]
};
