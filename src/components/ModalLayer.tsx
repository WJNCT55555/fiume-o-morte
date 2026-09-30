import { useEffect, type ReactNode } from 'react';
import { useGame } from '../game/GameContext';
import { legacyUI } from '../legacy/ui/runtime';
import { legacyToReact } from '../lib/legacyReact';
import { assetUrl } from '../lib/assetUrl';

/** UI string lookup. The catalogue lives in the legacy i18n module. */
const T = (key: string): string => legacyUI.UI.T(key);

function Dialog({ title, subtitle, children, footer, close, wide = false }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode;
  close: () => void; wide?: boolean;
}) {
  return <div className="scrim show" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}
    onKeyDown={event => { if (event.key === 'Escape') close(); }}>
    <div className={'modal' + (wide ? ' modal--wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__hd"><div className="modal__ttl">{title}</div>{subtitle && <div className="modal__it">{subtitle}</div>}</div>
      <div className="modal__bd">{children}</div>
      <div className="modal__ft">{footer || <button className="btn btn--primary" onClick={close}>关闭</button>}</div>
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
  if (resume) return <Dialog title="继续上次对局？" subtitle="Salvataggio" close={actions.dismissResume}
    footer={<><button className="btn btn--primary" onClick={actions.resumeSaved}>继续</button>
      <button className="btn btn--ghost" onClick={actions.dismissResume}>开始新游戏</button></>}>
    <p className="modal__body">上次存档：{legacyUI.Core.dateLabel(resume.date)}，第 {resume.turn} 回合。</p>
  </Dialog>;
  if (!modal) return null;

  // Events are rendered inline in the centre column (see GameScreen), matching
  // the reference project: only a super event takes over the screen. What is
  // left here are genuinely modal pickers — the card option menu and the deck.
  if (state && ['card', 'deck', 'advdeck'].includes(modal)) {
    let node: Node | null = null;
    if (modal === 'card') node = legacyUI.Views.cardModal(state, actions);
    else if (modal === 'advdeck') node = legacyUI.Views.advisorDeckModal(state, actions);
    else if (modal === 'deck') node = legacyUI.Views.deckModal(state, ui, actions);
    else node = legacyUI.Views.modal('', '', [legacyUI.UI.EventBoard.render(state, actions)],
      [legacyUI.Core.h('button', { class: 'btn btn--primary', onclick: actions.closeEventBoard }, '关闭')],
      { cls: 'modal--wide evboard', onScrim: actions.closeEventBoard });
    return <>{legacyToReact(node, refresh, modal)}</>;
  }
  if (modal === 'settings') return <Dialog title="游戏设置" subtitle="Impostazioni" close={actions.closeModal} wide>
    <div className="setcol">
      {/* Music and language are shown so the shape of the menu is honest, but
          neither is wired to anything yet: there is no audio at all, and the
          it/en locales are registered without translations. Both say so rather
          than pretending to be clickable. */}
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
          {legacyUI.I18N.LANGS.map((L: { id: string; native: string; enabled: boolean }) =>
            <button key={L.id} className={'langbtn ' + (L.enabled ? 'is-on' : 'is-off')}
              disabled={!L.enabled} title={L.enabled ? '' : T('set.lang.soon')}>
              <span>{L.native}</span>
              {!L.enabled && <span className="langbtn__s">{T('set.lang.soon')}</span>}
            </button>)}
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
      <button className="setbtn" onClick={actions.about}>
        {legacyToReact(legacyUI.Orn.icon('laurel', 16), refresh, 'set-about-ic')}
        <span className="setbtn__n">关于与史料</span>
      </button>
    </div>
    {/* Reference material, folded away so it does not compete with the menu. */}
    <details className="setfold">
      <summary>史实时间轴</summary>
      <div className="setfold__bd">{legacyToReact(legacyUI.Views.timelinePanel(), refresh, 'timeline')}</div>
    </details>
    <details className="setfold">
      <summary>行政记录</summary>
      <div className="setfold__bd">{legacyToReact(legacyUI.Views.registroPanel(state), refresh, 'registro')}</div>
    </details>
  </Dialog>;
  if (modal === 'save') {
    const slots = legacyUI.Sel.Save.list();
    return <Dialog title="存档管理" subtitle="Salvataggi" close={actions.closeModal} wide>
      <div className="save-list">
        {(['auto', 0, 1, 2, 3, 4] as const).map(slot => {
          const data = slot === 'auto' ? slots.auto : slots.slots[slot];
          return <div className="opt" key={slot} style={{ cursor: 'default' }}>
            <div className="opt__h"><span className="opt__n">{slot === 'auto' ? '自动存档' : `存档 ${slot + 1}`}</span>
              <span className="opt__i">{data ? `${data.label} · ${new Date(data.at).toLocaleString()}` : '空'}</span></div>
            <div className="row" style={{ gap: 7, marginTop: 6 }}>
              <button className="btn btn--sm" onClick={() => actions.saveTo(slot)}>写入</button>
              <button className="btn btn--sm btn--ghost" disabled={!data} onClick={() => actions.loadFrom(slot)}>读取</button>
            </div>
          </div>;
        })}
      </div>
      <p className="tiny">存档保存在浏览器 localStorage。</p>
    </Dialog>;
  }
  if (modal === 'ach') {
    const unlocked: string[] = state?.achievements || [];
    return <Dialog title="成就" subtitle="Obiettivi" close={actions.closeModal} wide>
      <p className="tiny">已解锁 {unlocked.length} / {legacyUI.Meta.ACHIEVEMENTS.length}</p>
      <div className="achgrid">{legacyUI.Meta.ACHIEVEMENTS.map((achievement: any) =>
        <div className={'achievement' + (unlocked.includes(achievement.id) ? ' is-on' : '')} key={achievement.id}>
          <div className="ach__n">{unlocked.includes(achievement.id) ? '★ ' : '☆ '}{achievement.zh}</div>
          <div className="ach__it">{achievement.it}</div>
          <div className="ach__d">{legacyUI.Core.L(achievement.desc)}</div>
        </div>)}</div>
    </Dialog>;
  }
  if (modal === 'about') return <Dialog title="关于游戏" subtitle="FIUME O MORTE!" close={actions.closeModal} wide>
    <div className="modal__body">
      <p>《FIUME O MORTE!》以 1919–1924 年的阜姆为背景。你将以邓南遮的身份处理事件、使用卡牌、调整财政与外交政策，并面对制宪议会及城市的危机。</p>
      <p>人物肖像与历史照片来自 Wikimedia Commons；逐张许可见 <a href={assetUrl('img/manifest.json')} target="_blank" rel="noreferrer">素材清单</a>。地图几何来自 OpenStreetMap 与 Natural Earth。</p>
    </div>
  </Dialog>;
  return null;
}
