import { useEffect, type ReactNode } from 'react';
import { useGame } from '../game/GameContext';
import { legacyUI } from '../legacy/ui/runtime';
import { legacyToReact } from '../lib/legacyReact';
import { assetUrl } from '../lib/assetUrl';
import { SandboxMenu } from './SandboxMenu';

/** UI string lookup. The catalogue lives in the legacy i18n module. */
const T = (key: string, vars?: Record<string, string | number>): string => legacyUI.UI.T(key, vars);

function Dialog({ title, children, footer, close, wide = false, variant }: {
  title: string; children: ReactNode; footer?: ReactNode;
  close: () => void; wide?: boolean; variant?: string;
}) {
  return <div className="scrim show" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}
    onKeyDown={event => { if (event.key === 'Escape') close(); }}>
    <div className={'modal' + (wide ? ' modal--wide' : '') + (variant ? ' modal--' + variant : '')} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__hd"><div className="modal__ttl">{title}</div></div>
      <div className="modal__bd">{children}</div>
      <div className="modal__ft">{footer || <button className="btn btn--primary" onClick={close}>{T('ui.close')}</button>}</div>
    </div>
  </div>;
}

export function ModalLayer() {
  const { state, ui, actions, refresh, resume } = useGame();
  const modal = ui.modal;
  useEffect(() => {
    if (!modal && !resume) return;
    const timer = window.setTimeout(() => {
      document.querySelector<HTMLElement>('.scrim.show button.opt:not([disabled]), .scrim.show button.evrow:not([disabled]), .scrim.show button.btn:not([disabled])')?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [modal, resume]);
  if (resume) return <Dialog title={T('ui.resume.title')} close={actions.dismissResume}
    footer={<><button className="btn btn--primary" onClick={actions.resumeSaved}>{T('ui.resume.yes')}</button>
      <button className="btn btn--ghost" onClick={actions.dismissResume}>{T('ui.resume.no')}</button></>}>
    <p className="modal__body">{T('ui.resume.body', { d: legacyUI.Core.dateLabel(resume.date), n: resume.turn })}</p>
  </Dialog>;
  if (!modal) return null;
  if (modal === 'sandbox' && state?.difficulty === 'sandbox' && !state.ending) return <SandboxMenu />;

  // Events are rendered inline in the centre column (see GameScreen), matching
  // the reference project. SuperEventLayer owns the independent major-moment
  // presentation. This layer contains card and advisor menus, decks and settings.
  if (state && ['card', 'deck', 'advdeck', 'advisor'].includes(modal)) {
    let node: Node | null = null;
    if (modal === 'card') node = legacyUI.Views.cardModal(state, actions);
    else if (modal === 'advdeck') node = legacyUI.Views.advisorDeckModal(state, actions);
    else if (modal === 'advisor') node = legacyUI.Views.advisorModal(state, ui.advisor, actions);
    else if (modal === 'deck') node = legacyUI.Views.deckModal(state, ui, actions);
    else node = legacyUI.Views.modal('', '', [legacyUI.UI.EventBoard.render(state, actions)],
      [legacyUI.Core.h('button', { class: 'btn btn--primary', onclick: actions.closeEventBoard }, '关闭')],
      { cls: 'modal--wide evboard', onScrim: actions.closeEventBoard });
    return <>{legacyToReact(node, refresh, modal)}</>;
  }
  if (modal === 'settings') return <Dialog title={T('ui.settings')} close={actions.closeModal} variant="set">
    <div className="setcol">
      {/* Music and language are shown so the shape of the menu is honest, but
          neither is wired to anything yet: there is no audio at all, and the
          it/en locales are registered without translations. Both say so rather
          than pretending to be clickable. */}
      {/* Music is shown so the shape of the menu is honest, but it is not wired
          to anything: there is no audio at all. Language IS wired — the active
          locale is read straight from the i18n module, which the store bumps
          through `refresh()` when `setLanguage` changes it. `en` remains a
          registered placeholder. */}
      <button className="setbtn" disabled>
        {legacyToReact(legacyUI.Orn.icon('note', 16), refresh, 'set-music-ic')}
        <span className="setbtn__n">{T('set.music')}</span>
        <span className="setbtn__s">{T('set.music.soon')}</span>
      </button>
      <div className="setlang">
        <div className="setlang__t">
          {legacyToReact(legacyUI.Orn.icon('globe', 16), refresh, 'set-lang-ic')}
          <span>{T('set.lang')}</span>
        </div>
        <div className="setlang__row">
          {legacyUI.I18N.LANGS.map((L: { id: string; native: string; enabled: boolean }) => {
            const active = legacyUI.I18N.lang === L.id;
            return <button key={L.id}
              className={'langbtn ' + (active ? 'is-on' : L.enabled ? '' : 'is-off')}
              disabled={!L.enabled}
              aria-current={active ? 'true' : undefined}
              title={L.enabled ? T('set.lang.current') : T('set.lang.soon')}
              onClick={() => { if (!active) actions.setLanguage(L.id); }}>
              <span>{L.native}</span>
              {!L.enabled && <span className="langbtn__s">{T('set.lang.soon')}</span>}
            </button>;
          })}
        </div>
      </div>
      <button className="setbtn" onClick={actions.openAchievements}>
        {legacyToReact(legacyUI.Orn.icon('trophy', 16), refresh, 'set-ach-ic')}
        <span className="setbtn__n">{T('set.ach')}</span>
      </button>
      <button className="setbtn" onClick={actions.openSaves}>
        {legacyToReact(legacyUI.Orn.icon('disk', 16), refresh, 'set-save-ic')}
        <span className="setbtn__n">{T('set.save')}</span>
      </button>
      {state?.difficulty === 'sandbox' && !state.ending && <button className="setbtn" onClick={actions.openSandbox}>
        {legacyToReact(legacyUI.Orn.icon('gear', 16), refresh, 'set-sandbox-ic')}
        <span className="setbtn__n">{T('sandbox.title')}</span>
      </button>}
      <button className="setbtn" onClick={actions.about}>
        {legacyToReact(legacyUI.Orn.icon('laurel', 16), refresh, 'set-about-ic')}
        <span className="setbtn__n">{T('set.about')}</span>
      </button>
    </div>
    {/* The library: the model documentation, moved out of the economy and crisis
        panels so those tabs keep only the readings a player acts on. */}
    <details className="setfold" open>
      <summary>{T('lib.open')} · {T('lib.sub')}</summary>
      <div className="setfold__bd">
        {state && legacyToReact(legacyUI.Views.formulaLibrary(state), refresh, 'library')}
      </div>
    </details>
    {/* Reference material, folded away so it does not compete with the menu. */}
    <details className="setfold">
      <summary>{T('set.timeline')}</summary>
      <div className="setfold__bd">{legacyToReact(legacyUI.Views.timelinePanel(), refresh, 'timeline')}</div>
    </details>
    <details className="setfold">
      <summary>{T('set.registro')}</summary>
      <div className="setfold__bd">{legacyToReact(legacyUI.Views.registroPanel(state), refresh, 'registro')}</div>
    </details>
  </Dialog>;
  if (modal === 'save') {
    const slots = legacyUI.Sel.Save.list();
    return <Dialog title={T('ui.saves')} close={actions.closeModal} variant="save">
      <div className="save-list">
        {(['auto', 0, 1, 2, 3, 4] as const).map(slot => {
          const data = slot === 'auto' ? slots.auto : slots.slots[slot];
          return <div className="opt" key={slot} style={{ cursor: 'default' }}>
            <div className="opt__h"><span className="opt__n">{slot === 'auto' ? T('ui.autosave') : T('ui.slot', { n: slot + 1 })}</span>
              <span className="opt__i">{data ? `${data.label} · ${new Date(data.at).toLocaleString()}` : T('ui.empty')}</span></div>
            <div className="row" style={{ gap: 7, marginTop: 6 }}>
              <button className="btn btn--sm" onClick={() => actions.saveTo(slot)}>{T('save.write')}</button>
              <button className="btn btn--sm btn--ghost" disabled={!data} onClick={() => actions.loadFrom(slot)}>{T('save.read')}</button>
            </div>
          </div>;
        })}
      </div>
      <p className="tiny">{T('ui.saves.note')}</p>
    </Dialog>;
  }
  if (modal === 'ach') {
    const all = legacyUI.Meta.ACHIEVEMENTS;
    const unlocked: string[] = (state?.achievements || []).filter((id: string) =>
      all.some((achievement: { id: string }) => achievement.id === id));
    const pct = all.length ? Math.round((unlocked.length / all.length) * 100) : 0;
    /* A list, one achievement to a row, in the manner of the reference
       project: medallion, text, tick. A grid made every entry a different
       width, which made the set hard to scan; a column of rows reads
       down the names in one sweep. */
    return <Dialog title={T('ui.ach')} close={actions.closeModal} variant="ach">
      <div className="achbar">
        <div className="achbar__r">
          <span>{T('ach.progress')}</span>
          <span>{unlocked.length} / {all.length}（{pct}%）</span>
        </div>
        <div className="achbar__t"><i style={{ width: pct + '%' }} /></div>
      </div>
      <div className="achlist">{all.map((achievement: any) => {
        const on = unlocked.includes(achievement.id);
        return <div className={'achrow' + (on ? ' is-on' : '')} key={achievement.id}>
          <div className="achrow__ic">
            {on
              ? legacyToReact(legacyUI.Orn.icon('laurel', 30), refresh, 'ach-' + achievement.id)
              : <span className="achrow__lk" aria-hidden="true" />}
          </div>
          <div className="achrow__tx">
            <div className="achrow__n">{achievement.zh}</div>
            <div className="achrow__it">{achievement.it}</div>
            <div className="achrow__d">{legacyUI.Core.L(achievement.desc)}</div>
          </div>
          <div className="achrow__ck">
            <span className="achrow__box">{on ? '✓' : ''}</span>
          </div>
        </div>;
      })}</div>
    </Dialog>;
  }
  if (modal === 'about') return <Dialog title={T('ui.about')} close={actions.closeModal} wide>
    <div className="modal__body">
      <p>{T('ui.about.body')}</p>
      <p>{T('ui.credits')}{' '}
        <a href={assetUrl('img/manifest.json')} target="_blank" rel="noreferrer">{T('ui.credits.link')}</a>
        {T('ui.credits.tail')}</p>
    </div>
  </Dialog>;
  return null;
}
