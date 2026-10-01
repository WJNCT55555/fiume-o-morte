import type { Card } from '../content/types';

/* De Ambris's draft promises a living wage, aid in sickness or involuntary
   unemployment and old-age pensions. Collective representation is the final
   playable extension of those rights. */
export const gvTutele: Card = {
  id: 'gv_tutele', deck: 'governo', ministry: 'lavoro',
  name: { zh: '劳动保障法', it: 'Legge sulle tutele del lavoro' },
  text: {
    zh: '《卡尔纳罗宪章》草案许诺足以生活的工资、患病和失业时的救助以及养老金。把许诺写进预算和裁决程序，比在阳台上宣读难得多。每通过一条，雇主、工团和金库都会重新计算代价。',
    it: 'Il progetto della Carta promette un salario sufficiente, assistenza nella malattia e nella disoccupazione e pensioni. Scrivere le promesse nel bilancio e nelle procedure è più difficile che proclamarle dal balcone.'
  },
  cost: { ap: 1 }, cooldown: 4,
  require: function (s) { return s.cabinet.lavoro === s.playerForce; },
  requireText: { zh: '需要劳动执政官席位', it: 'Serve il rettorato del Lavoro' },
  options: [
    {
      id: 'salario',
      text: { zh: '立最低工资，设劳动争议调解。', it: 'Stabilire il salario minimo e l’arbitrato del lavoro.' },
      subtitle: { zh: '先让争论有一张桌子，工资有一道底线。', it: 'Dare alle controversie un tavolo e ai salari una soglia.' },
      preview: ['劳动保障升至 1 级', '罢工强度 −', '资本信心 −'],
      require: function (s) { return s.laws.lavoro < 1; },
      requireText: { zh: '最低工资与调解已立法', it: 'Salario minimo e arbitrato già stabiliti' },
      effect: { laws: { lavoro: 1 }, economy: { strike: -5, capitalConfidence: -4 },
        support: [['operai', 'LEG', 3], ['portuali', 'LEG', 2]] }
    },
    {
      id: 'soccorso',
      text: { zh: '为疾病、失业与养老建立常设救助。', it: 'Istituire assistenza per malattia, disoccupazione e vecchiaia.' },
      subtitle: { zh: '这是一项每月都要付钱的权利。', it: 'È un diritto che va pagato ogni mese.' },
      preview: ['劳动保障升至 2 级', '失业率 −', '每月救助支出增加'],
      require: function (s) { return s.laws.lavoro === 1; },
      requireText: { zh: '须先落实最低工资和调解', it: 'Servono prima il salario minimo e l’arbitrato' },
      effect: { laws: { lavoro: 1 }, economy: { unemployment: -2, capitalConfidence: -4 },
        support: [['operai', 'LEG', 3], ['artigiani', 'LEG', 2]], factions: { sindacalisti: { dis: -7 } } }
    },
    {
      id: 'contratti',
      text: { zh: '承认工团与集体合同。', it: 'Riconoscere le corporazioni e i contratti collettivi.' },
      subtitle: { zh: '劳工不再逐个求情，而是作为一个有声音的团体签字。', it: 'I lavoratori firmano insieme, invece di chiedere uno alla volta.' },
      preview: ['劳动保障升至 3 级', '工团派异议 −', '资本信心 −'],
      require: function (s) { return s.laws.lavoro === 2 && !!s.flags.deambris_arrived; },
      requireText: { zh: '须先有救助制度且德·安布里斯已加入', it: 'Servono le tutele e De Ambris' },
      effect: { laws: { lavoro: 1 }, economy: { strike: -8, capitalConfidence: -7 },
        support: [['operai', 'LEG', 4], ['portuali', 'LEG', 4]],
        factions: { sindacalisti: { dis: -12 }, fascisti: { dis: 7 } } }
    },
    {
      id: 'sospensione',
      text: { zh: '削减一层劳动保障以维持金库。', it: 'Ridurre una tutela per sostenere la tesoreria.' },
      subtitle: { zh: '权利撤回时，账本会好看一些，街道不会。', it: 'Il bilancio migliora; le strade no.' },
      preview: ['劳动保障 −1', '资本信心 +', '罢工强度 +'],
      require: function (s) { return s.laws.lavoro > 0; },
      requireText: { zh: '尚无可削减的保障', it: 'Non ci sono tutele da ridurre' },
      effect: { laws: { lavoro: -1 }, economy: { capitalConfidence: 8, strike: 9 },
        factions: { sindacalisti: { dis: 12 } } }
    }
  ]
};
