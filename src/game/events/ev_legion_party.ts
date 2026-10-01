import type { GameEvent } from '../content/types';


export const evLegionParty: GameEvent = {
    id: 'ev_legion_party', once: true, cooldown: 4,
    condition: function (s) { return s.monthIndex >= 4 && s.factions.arditi.inf >= 16 && s.legitimacy > 40; },
    title: { zh: '军团兵要不要变成一个党', it: 'I legionari devono diventare un partito?' },
    body: { zh: '米亚尼把花名册放在你面前：三千个名字，散布在意大利各地。他们每年 9 月 12 日聚一次，唱同一首歌，然后各自回去。\n\n' +
        '"如果我们不把他们组织起来，法西斯会。"他说。"他们已经在这么做了。"',
      it: 'Miani mette un registro sulla tua scrivania: tremila nomi sparsi per l\'Italia. Si ritrovano ogni 12 settembre, cantano la stessa canzone, poi tornano a casa.\n\n' +
        '"Se non li organizziamo noi, li organizza il Fascio," dice. "E lo stanno già facendo."' },
    options: [
      {
        id: 'a', text: { zh: '组织。让军团兵成为一个全国性的运动。', it: 'Organizzare. Fare dei legionari un movimento nazionale.' },
        preview: [{ zh: '法西斯派影响力 −', label: 'Fascio −' }, { zh: '军团兵力 +260', label: 'milizia +260' }, { zh: '手工业者支持军团 +', label: 'artigiani + LEG' }],
        effect: function () { return { order: { milizia: 260, squadre: -6 }, support: [['artigiani', 'LEG', 3], ], factions: { fascisti: { inf: -3, dis: 14 } }, flags: { legion_party: true }, journals: ['movimento'] }; }
      },
      {
        id: 'b', text: { zh: '不。让他们只是记得。', it: 'No. Che ricordino e basta.' },
        preview: [{ zh: '法西斯派影响力 +', label: 'Fascio +' }, { zh: '法西斯派异议 −', label: 'dissenso Fascio −' }],
        effect: function () { return { factions: { fascisti: { inf: 3, dis: -8 } } }; }
      },
      {
        id: 'c', text: { zh: '把他们并入法西斯。反正他们已经在往那边走。', it: 'Fonderli nel Fascio. Tanto ci stanno già andando.' },
        preview: [{ zh: '法西斯 +++', label: 'Fascio +++' }, { zh: '工团派/阿迪蒂 −−', label: 'Falange/Arditi −−' }],
        effect: function () { return { factions: { arditi: { inf: -4, dis: 18 }, sindacalisti: { dis: 16 } }, order: { squadre: 12, violence: 6, fervour: -6 } }; }
      }
    ]
  };
