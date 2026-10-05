import { ev191909Marcia } from './ev_1919_09_marcia';
import { ev191909Autonomi } from './ev_1919_09_autonomi';
import { ev191909Socialisti } from './ev_1919_09_socialisti';
import { ev191910Persia } from './ev_1919_10_persia';
import { ev191910Comunali } from './ev_1919_10_comunali';
import { ev191910ComunaliResult } from './ev_1919_10_comunali_result';
import { ev191911Blocco } from './ev_1919_11_blocco';
import { ev191911Modus } from './ev_1919_11_modus';
import { ev191912ModusVote } from './ev_1919_12_modus_vote';
import { ev192001Inverno } from './ev_1920_01_inverno';
import { ev192001Deambris } from './ev_1920_01_deambris';
import { evCartaProgramma } from './ev_carta_programma';
import { ev192004Sciopero } from './ev_1920_04_sciopero';
import { ev192006Alleati } from './ev_1920_06_alleati';
import { ev192006Romafronte } from './ev_1920_06_romafronte';
import { evRomafronteMussolini } from './ev_romafronte_mussolini';
import { evRomafronteMalatesta } from './ev_romafronte_malatesta';
import { evRomafronteBombacci } from './ev_romafronte_bombacci';
import { evRomafronteGramsci } from './ev_romafronte_gramsci';
import { ev192009Romafronte } from './ev_1920_09_romafronte';
import { evRomafronteEpilogo } from './ev_romafronte_epilogo';
import { ev192009Carta } from './ev_1920_09_carta';
import { ev192010Adunata } from './ev_1920_10_adunata';
import { ev192011Rapallo } from './ev_1920_11_rapallo';
import { evUrssRiconoscimento } from './ev_1920_urss';
import { evNatale } from './ev_natale';
import { evNataleFight } from './ev_natale_fight';
import { evNataleDeal } from './ev_natale_deal';
import { evNataleAfter } from './ev_natale_after';
import { evNataleWin } from './ev_natale_win';
import { evNataleStalemate } from './ev_natale_stalemate';
import { evNataleLose } from './ev_natale_lose';
import { ev192104Elezioni } from './ev_1921_04_elezioni';
import { evCartaDibattito } from './ev_carta_dibattito';
import { evBlasichContatto } from './ev_blasich_contatto';
import { evBarossTalks } from './ev_baross_talks';
import { evWhitehead } from './ev_whitehead';
import { evStrike } from './ev_strike';
import { evBlockade } from './ev_blockade';
import { evFactory } from './ev_factory';
import { evViolence } from './ev_violence';
import { ev192111Pcdf } from './ev_1921_11_pcdf';
import { ev192101Pcdi } from './ev_1921_01_pcdi';
import { evCoup } from './ev_coup';
import { evCoupFight } from './ev_coup_fight';
import { evCoupAfter } from './ev_coup_after';
/* ev_1922_10_roma and its chain node ev_marcia were removed: the October 1922
   march was unreachable behind the March 1922 coup. See
   docs/内容梳理与路线重构方案.md §2.2. */
import { ev192401Rome } from './ev_1924_01_rome';
import { ev1924FascistCoup } from './ev_1924_fascist_coup';
import { ev1924Win } from './ev_1924_win';
import { ev1924Stalemate } from './ev_1924_stalemate';
import { ev1924Lose } from './ev_1924_lose';
import { evLegionParty } from './ev_legion_party';

export const ALL_EVENTS = [
  ev191909Autonomi,
  ev191909Socialisti,
  ev191909Marcia,
  ev191910Persia,
  ev191910Comunali,
  ev191910ComunaliResult,
  ev191911Blocco,
  ev191911Modus,
  ev191912ModusVote,
  ev192001Inverno,
  ev192001Deambris,
  evCartaProgramma,
  ev192004Sciopero,
  ev192006Alleati,
  ev192006Romafronte,
  evRomafronteMussolini,
  evRomafronteMalatesta,
  evRomafronteBombacci,
  evRomafronteGramsci,
  ev192009Romafronte,
  evRomafronteEpilogo,
  ev192009Carta,
  ev192010Adunata,
  ev192011Rapallo,
  evUrssRiconoscimento,
  evNatale,
  evNataleFight,
  evNataleDeal,
  evNataleAfter,
  evNataleWin,
  evNataleStalemate,
  evNataleLose,
  ev192104Elezioni,
  evCartaDibattito,
  evBlasichContatto,
  evBarossTalks,
  evWhitehead,
  evStrike,
  evBlockade,
  evFactory,
  evViolence,
  ev192111Pcdf,
  ev192101Pcdi,
  evCoup,
  evCoupFight,
  evCoupAfter,
  ev192401Rome,
  ev1924FascistCoup,
  ev1924Win,
  ev1924Stalemate,
  ev1924Lose,
  evLegionParty
];
