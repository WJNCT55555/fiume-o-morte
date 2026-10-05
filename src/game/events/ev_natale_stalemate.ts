import type { GameEvent } from '../content/types';

/* Neither side could finish it. The Royal Army holds the ring road and the port
   approaches; the Legion holds the old town. The line between them is the one
   nobody crosses for the next two years — the `ending_civil_strife` state,
   reached from the SIEGE rather than from the fascist coup. */
export const evNataleStalemate: GameEvent = {
  id: 'ev_natale_stalemate', chain: true,
  title: { zh: '一条谁也不敢越过的线', it: 'Una linea che nessuno osa superare' },
  body: { zh: '战线在圣诞节之后停了下来。皇家陆军控制了环形大道、火车站与港口入口；' +
      '军团守住了老城、省督府与几座桥。两边都打不动对方了。\n\n' +
      '没有停战协定，也没有投降书。只有一条穿过城市的线，两侧都有人拿着枪，' +
      '而意大利第 26 步兵营站在中间，谁也不帮，谁也不走。\n\n' +
      '这座城市从此被切成两半：你的那一半仍然叫你指挥官。',
    it: 'Dopo Natale il fronte si ferma. Il Regio Esercito tiene la circonvallazione, la stazione e gli accessi al porto; ' +
      'la Legione tiene la città vecchia, il Palazzo e qualche ponte. Nessuno dei due riesce più a finire l\'altro.\n\n' +
      'Non c\'è armistizio, non c\'è resa. Solo una linea che taglia la città, con uomini armati da entrambi i lati, ' +
      'e il 26º battaglione italiano in mezzo: non aiuta nessuno, non se ne va.\n\n' +
      'La città resta divisa in due. La tua metà continua a chiamarti Comandante.' },
  options: [
    {
      id: 'trincea', text: { zh: '承认这条线。把省督府变成一个被围起来的首都。', it: 'Accettare la linea. Fare del Palazzo una capitale assediata.' },
      subtitle: { zh: '正是「血腥的僵局」：政变成功了，但没有结束任何事情。', it: 'È lo stallo sanguinoso: il colpo è riuscito e non ha concluso nulla.' },
      preview: [{ zh: '进入内战僵局', label: 'stallo sanguinoso' }],
      effect: function () { return { flags: { bloody_stalemate: true } }; }
    },
    {
      id: 'riaprire', text: { zh: '用谈判换回整座城市。让出主权，保住政府。', it: 'Riaprire il negoziato. Cedere sovranità, salvare il governo.' },
      subtitle: { zh: '把战线换成一纸条约——那就是历史的结局。', it: 'Barattare il fronte con un trattato: è la fine storica.' },
      preview: [{ zh: '转入历史的结局', label: 'corso della storia' }],
      effect: function () { return { diplo: { italy: 8, league: 4 }, flags: { treaty_rome: true }, next: 'ev_natale_after' }; }
    }
  ]
};
