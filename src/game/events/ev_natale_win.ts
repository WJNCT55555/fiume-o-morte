import type { GameEvent } from '../content/types';

/* The siege held. Caviglia pulls the fleet back rather than shell a city he
   cannot take, and the Regency comes out of December with its authority intact
   and a written guarantee to show for it. This is the arm that the historical
   line never reached — D'Annunzio's legionaries held the streets for five days
   and then signed. */
export const evNataleWin: GameEvent = {
  id: 'ev_natale_win', chain: true,
  title: { zh: '围城被挡住了', it: 'L\'assedio è respinto' },
  body: { zh: '第五天，皇家陆军停止了推进。不是撤退——是把炮口从城里移开，改对着港口。\n\n' +
      '卡维利亚在电报里写：这座城市需要「政治解决」。这句话是你的胜利，也是你的期限。\n\n' +
      '街道还在你手里，军团还在街垒后面，而罗马第一次不得不承认，它不能靠军舰拿走阜姆。',
    it: 'Il quinto giorno il Regio Esercito smette di avanzare. Non si ritira: sposta i pezzi dalla città al porto.\n\n' +
      'Caviglia telegrafa che questa città ha bisogno di «una soluzione politica». È la tua vittoria, ed è anche la tua scadenza.\n\n' +
      'Le strade sono ancora tue, la Legione è ancora dietro i sacchi di sabbia, e per la prima volta Roma deve ammettere che Fiume non si prende con le corazzate.' },
  options: [
    {
      id: 'incassare', text: { zh: '把这场守城变成合法性：要求一份国际保证。', it: 'Convertire la difesa in legittimità: chiedere una garanzia internazionale.' },
      subtitle: { zh: '史实上你签的是投降书；这一次你签的是条款。', it: 'Storicamente firmasti una resa; questa volta firmi delle condizioni.' },
      preview: [{ zh: '开启国际保证日志', label: 'diario della garanzia' }, { zh: '权威 +', label: 'autorità +' }],
      effect: function () { return { order: { authority: 6, fervour: 4 }, diplo: { uk: 6, france: 5, usa: 4, league: 8, italy: -4 }, journals: ['garanzia'], next: 'ev_natale_after' }; }
    },
    {
      id: 'vendicare', text: { zh: '不谈判。把十二月变成一场全国性的控诉。', it: 'Nessun negoziato. Fare di dicembre un\'accusa nazionale.' },
      subtitle: { zh: '热忱与暴力一起上升——罗马会记住，法西斯也会。', it: 'Fervore e violenza salgono insieme: Roma ricorderà, e anche il Fascio.' },
      preview: [{ zh: '民众热忱 ++', label: 'fervore ++' }, { zh: '政治暴力 +', label: 'violenza +' }, { zh: '英法关系 −', label: 'UK/FR −' }],
      effect: function () { return { order: { fervour: 12, violence: 8, authority: 2 }, diplo: { italy: -14, uk: -4, france: -4, league: 2 }, support: [['artigiani', 'LEG', 3]], next: 'ev_natale_after' }; }
    }
  ]
};
