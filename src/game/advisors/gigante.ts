import type { Advisor } from '../content/types';

export const gigante: Advisor = { id: 'gigante',   zh: '里卡多·吉甘特', it: 'Riccardo Gigante', faction: null,
      bio: { zh: '1919 年 10 月当选的市长。街垒上敢拔枪，市政厅里会算账。', it: 'Sindaco eletto nell’ottobre 1919. Sa impugnare una pistola sulle barricate e far quadrare i conti in Municipio.' },
      /* He had been sharing a group photograph with nobody in particular; the
         file on disk is a real likeness of him at 155×209, the same size as the
         other plain portraits in the folder. It arrived as WebP and was
         re-encoded to PNG so the folder keeps one format. */
      portrait: 'img/Portrait/Portrait_riccardo_gigante.png',
      actions: [
        { id: 'notables', text: { zh: '召集城市名流', it: 'Convocare i notabili' },
          subtitle: { zh: '动员本地商人与名流捐助，补充金库并恢复信心。', it: 'Ottenere il sostegno finanziario dei notabili e ristabilire la fiducia.' },
          effect: { funds: 180, support: [['borghesia', 'LEG', 3], ['artigiani', 'LEG', 2]], economy: { capitalConfidence: 6 }, factions: { sindacalisti: { dis: -8 } } } },
        { id: 'municipal_services', text: { zh: '整顿市政服务', it: 'Riordinare i servizi municipali' },
          subtitle: { zh: '协调市政职员与公共服务，让城市日常运转起来。', it: 'Coordinare gli impiegati e i servizi pubblici per far funzionare la città.' },
          effect: { order: { authority: 5, violence: -4 }, support: [['impiegati', 'LEG', 3], ['artigiani', 'LEG', 2]], economy: { strike: -5 } } }
      ] };
