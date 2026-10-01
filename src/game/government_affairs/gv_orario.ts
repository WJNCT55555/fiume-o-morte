import type { Card } from '../content/types';

/* Hours are a separate law from wages, relief and collective bargaining. The
   eight-hour day is a plausible Fiume policy, not a clause quoted from the Carta. */
export const gvOrario: Card = {
  id: 'gv_orario', deck: 'governo', ministry: 'lavoro',
  name: { zh: '劳动时间法', it: 'Legge sull’orario di lavoro' },
  text: {
    zh: '港口的钟由货轮决定，工厂的钟由厂主决定。德·安布里斯要让第三只钟出现：写在法令里、人人都看得见的工作日。八小时制是开端；加班、休息与带薪休假仍要逐条争取。',
    it: 'Nel porto l’orologio segue le navi, in fabbrica i proprietari. De Ambris ne vuole un terzo: la giornata scritta nella legge. Le otto ore sono l’inizio; straordinari, riposo e ferie richiedono altre norme.'
  },
  cost: { ap: 1 }, cooldown: 4,
  require: function (s) { return s.cabinet.lavoro === s.playerForce; },
  requireText: { zh: '需要劳动执政官席位', it: 'Serve il rettorato del Lavoro' },
  options: [
    {
      id: 'otto_ore',
      text: { zh: '规定八小时工作日。', it: 'Stabilire la giornata di otto ore.' },
      subtitle: { zh: '把码头的钟从船长手里交还给工人。', it: 'Restituire l’orologio del porto ai lavoratori.' },
      preview: ['劳动时间升至 1 级', '罢工强度 −', '资本信心 −'],
      require: function (s) { return s.laws.orario < 1; },
      requireText: { zh: '八小时工作制已立法', it: 'Le otto ore sono già legge' },
      effect: { laws: { orario: 1 }, economy: { strike: -5, capitalConfidence: -4 },
        support: [['operai', 'LEG', 3], ['portuali', 'LEG', 3]], factions: { sindacalisti: { dis: -5 } } }
    },
    {
      id: 'riposo',
      text: { zh: '限制加班，保证每周休息。', it: 'Limitare gli straordinari e garantire il riposo settimanale.' },
      subtitle: { zh: '法令不只规定几点开工，也规定何时可以回家。', it: 'La legge stabilisce anche quando si può tornare a casa.' },
      preview: ['劳动时间升至 2 级', '失业率 −', '有产精英支持 −'],
      require: function (s) { return s.laws.orario === 1; },
      requireText: { zh: '须先实行八小时工作制', it: 'Servono prima le otto ore' },
      effect: { laws: { orario: 1 }, economy: { unemployment: -1, capitalConfidence: -5 },
        support: [['operai', 'LEG', 2], ['borghesia', 'LEG', -3]] }
    },
    {
      id: 'ferie',
      text: { zh: '设工时监察和带薪休假。', it: 'Istituire ispettori e ferie retribuite.' },
      subtitle: { zh: '没有监察员的权利，只是贴在墙上的纸。', it: 'Un diritto senza ispettori è soltanto carta sul muro.' },
      preview: ['劳动时间升至 3 级', '罢工强度 −', '资本信心 −'],
      require: function (s) { return s.laws.orario === 2; },
      requireText: { zh: '须先限制加班并保证休息', it: 'Servono i limiti agli straordinari' },
      effect: { laws: { orario: 1 }, economy: { strike: -5, capitalConfidence: -6 },
        support: [['operai', 'LEG', 3], ['portuali', 'LEG', 2]], factions: { fascisti: { dis: 5 } } }
    },
    {
      id: 'deroga',
      text: { zh: '以港口紧急需要暂停一层限制。', it: 'Sospendere una tutela per l’emergenza portuale.' },
      subtitle: { zh: '船会准时离港；工人会记住是谁拨回了钟。', it: 'Le navi partiranno in orario; gli operai ricorderanno chi ha girato indietro l’orologio.' },
      preview: ['劳动时间 −1', '资本信心 +', '罢工强度 +'],
      require: function (s) { return s.laws.orario > 0; },
      requireText: { zh: '尚无可暂停的工时限制', it: 'Non esistono norme da sospendere' },
      effect: { laws: { orario: -1 }, economy: { capitalConfidence: 7, strike: 8 },
        support: [['operai', 'LEG', -3], ['portuali', 'LEG', -3]] }
    }
  ]
};
