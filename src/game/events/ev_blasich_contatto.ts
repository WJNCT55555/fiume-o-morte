import type { GameEvent } from '../content/types';


export const evBlasichContatto: GameEvent = {
    id: 'ev_blasich_contatto', once: true, cooldown: 5,
    condition: function (s) { return s.monthIndex >= 3 && s.legitimacy >= 52 && s.factions.sindacalisti.dis < 45; },
    title: { zh: '布拉西奇医生的诊室', it: 'Nello studio del dottor Blasich' },
    body: { zh: '马里奥·布拉西奇在自家诊室见你。1920 年 4 月，他和社会党一起发动总罢工反对你；去年 11 月，法西斯砸了他的诊所，撕掉了他挂在墙上的两面旗。\n\n' +
        '"我不喜欢您的政府，"他说，"但我更不喜欢在自家门口被棍子打。您想谈什么？"',
      it: 'Mario Blasich ti riceve nel suo studio. Nell\'aprile 1920 organizzò con i socialisti lo sciopero generale contro di te; lo scorso novembre i fascisti gli hanno devastato l\'ambulatorio e strappato le due bandiere appese al muro.\n\n' +
        '"Il vostro governo non mi piace," dice. "Ma mi piace ancora meno prendere bastonate davanti a casa. Di che volete parlare?"' },
    options: [
      {
        id: 'a', text: { zh: '谈一份不互相开枪的协议。', it: 'Di un patto di non aggressione.' },
        preview: [{ zh: '解锁布拉西奇顾问', label: 'sblocca Blasich' }, { zh: '自治派支持 +', label: 'AUT → LEG' }, { zh: '阿迪蒂异议 +', label: 'Arditi +' }],
        effect: function () { return { flags: { blasich_contact: true }, support: [['portuali', 'AUT', -4], ['operai', 'AUT', -3], ['borghesia', 'AUT', -3]], order: { violence: -6, coup: -6 }, factions: { arditi: { dis: 8 } } }; }
      },
      {
        id: 'b', text: { zh: '谈他的加入。给他一个职位。', it: 'Della sua adesione. Offrirgli un incarico.' },
        preview: [{ zh: '解锁布拉西奇顾问 + 立即入阁', label: 'Blasich in governo' }, { zh: '工团派/阿迪蒂异议 ++', label: 'Falange/Arditi ++' }, { zh: '合法性 ++', label: 'legittimità ++' }],
        effect: function () { return { flags: { blasich_contact: true, blasich_in: true }, cabinet: { istruzione: 'AUT' }, support: [['portuali', 'AUT', -5], ['operai', 'AUT', -5], ['borghesia', 'AUT', -4], ['contadini', 'AUT', -3]], factions: { arditi: { dis: 14 }, sindacalisti: { dis: 12 }, fascisti: { dis: 16 } }, journals: ['riconciliazione'] }; }
      },
      {
        id: 'c', text: { zh: '只是来看病。', it: 'Solo per una visita.' },
        effect: function () { return {}; }
      }
    ]
  };
