import { azIntrighi } from './az_intrighi';
import { azFiumeLeague } from './az_fiume_league';
import { azForzeItalia } from './az_forze_italia';
import { azCervoDoro } from './az_cervo_doro';
import { azReclutamento } from './az_reclutamento';
import { azPropaganda } from './az_propaganda';
import { azLegioneFinanziaria } from './az_legione_finanziaria';
import { azUscocchi } from './az_uscocchi';
import { azFazioni } from './az_fazioni';

/* az_molo (到码头上去), az_cucine (军团的伙房) and az_volantini (飞越亚得里亚海) were
   removed. Their ground is covered elsewhere — the dock belongs to
   az_fiume_league's patriot appeal and az_reclutamento's socialist option,
   feeding the Legion belongs to az_reclutamento (the card that actually adds the
   mouths), and the aerial leaflet drop is now az_propaganda's second option,
   which does the same thing with a real decision around it. See
   docs/内容梳理与路线重构方案.md §3.18–3.19.

   az_arditi (阿迪蒂集会) and az_testa (《铁头》号外) were removed as well. Both
   were broadsheets rather than decisions: az_testa's whole ground — funding Carli's
   paper, +5 futuristi / +3 arditi — is exactly az_propaganda's `testa_di_ferro`
   option, so the two cards competed for the same act; az_arditi's parade and
   congress now sit inside az_fazioni and az_cervo_doro, which put a real choice
   (whose wing gains) where the old card only had a size. Neither id may be
   reused: a save naming them is simply missing a card, which the registry
   tolerates, so the removal needs no migration shim. */
export const ACTION_AFFAIRS = [
  azIntrighi,
  azFiumeLeague,
  azForzeItalia,
  azCervoDoro,
  azReclutamento,
  azPropaganda,
  azLegioneFinanziaria,
  azUscocchi,
  azFazioni,
];
