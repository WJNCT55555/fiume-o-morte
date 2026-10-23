import type { Advisor } from '../content/types';

export const miani: Advisor = { id: 'miani',     zh: '埃尔科莱·米亚尼', it: 'Ercole Miani', faction: 'arditi',
      bio: { zh: '军团的组织者。他知道城里每一支步枪在哪，也知道它们的枪栓锈到什么程度。', it: 'Organizzatore della Legione. Sa dove si trova ogni fucile della città e quanto è arrugginito il suo otturatore.' },
      /* No portrait: the roster used to show him a legionaries group photograph,
         which is not a likeness of Miani. The letter plate is the honest state
         until a photograph of him is on file — see PORTRAIT_ART_DIRECTION.md. */
      actions: [
        { id: 'inventory', text: { zh: '清点军械与粮秣', it: 'Rassegna di armi e viveri' },
          subtitle: { zh: '整理库存与账簿，把散落的物资重新交给军团。', it: 'Riordinare scorte e registri e recuperare il materiale disperso.' },
          effect: { arms: 14, funds: 60, order: { milizia: 180, authority: 3 }, economy: { strike: -4 } } },
        { id: 'watch', text: { zh: '编组街区守望队', it: 'Organizzare le guardie di quartiere' },
          subtitle: { zh: '协调守夜、巡逻与警戒，减少街头暴力和政变风险。', it: 'Coordinare ronde e vigilanza per ridurre violenza e rischio di golpe.' },
          effect: { order: { violence: -7, coup: -5, authority: 3 }, factions: { arditi: { dis: -5 } } } },
        { id: 'training', text: { zh: '组织预备队合练', it: 'Addestrare le riserve' },
          subtitle: { zh: '调拨 6 点军备训练预备队，增加有组织的守军。', it: 'Impiegare 6 armi per addestrare le riserve e rafforzare la difesa.' },
          require: s => s.arms >= 6, requireText: { zh: '需要至少 6 点军备。', it: 'Servono almeno 6 armi.' },
          effect: { arms: -6, order: { milizia: 280, authority: 2 }, factions: { arditi: { dis: -6 } } } }
      ] };
