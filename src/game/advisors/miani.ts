import type { Advisor } from '../content/types';

export const miani: Advisor = { id: 'miani',     zh: '埃尔科莱·米亚尼', it: 'Ercole Miani', faction: 'arditi',
      bio: '军团的组织者。他知道城里每一支步枪在哪，也知道它们的枪栓锈到什么程度。',
      action: { zh: '清点军械与粮秣', it: 'Rassegna di armi e viveri' },
      effect: { arms: 14, funds: 60, order: { milizia: 180, authority: 3 }, economy: { strike: -4 } } };
