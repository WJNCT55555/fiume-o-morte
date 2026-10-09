import { useLayoutEffect, useRef } from 'react';
import { MainArea } from '../components/MainArea';
import { legacyUI } from '../legacy/ui/runtime';

export function MapView({ node, refresh }: { node: Element; refresh: () => void }) {
  const suppressClickUntil = useRef(0);
  const container = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const map = container.current?.querySelector<SVGSVGElement>('.mapcanvas > svg');
    if (!map) return;
    const view = legacyUI.MapView;
    let drag: { id: number; startX: number; startY: number; centerX: number;
      centerY: number; inverse: DOMMatrix; moved: boolean } | null = null;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (drag || !event.deltaY) return;
      const matrix = map.getScreenCTM();
      const box = view.viewBox();
      if (!matrix || !box) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      if (view.zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12,
        (point.x - box[0]) / box[2], (point.y - box[1]) / box[3])) refresh();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      const matrix = map.getScreenCTM();
      const box = view.viewBox();
      if (!matrix || !box) return;
      drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
        centerX: box[0] + box[2] / 2, centerY: box[1] + box[3] / 2,
        inverse: matrix.inverse(), moved: false };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
      if (!drag.moved) {
        drag.moved = true;
        map.setPointerCapture(event.pointerId);
        map.classList.add('is-dragging');
      }
      event.preventDefault();
      const start = new DOMPoint(drag.startX, drag.startY).matrixTransform(drag.inverse);
      const current = new DOMPoint(event.clientX, event.clientY).matrixTransform(drag.inverse);
      view.panTo(drag.centerX + start.x - current.x, drag.centerY + start.y - current.y);
      // Update only the camera while moving; retain pointer capture and avoid
      // rebuilding the whole legacy view on every pointer event.
      map.setAttribute('viewBox', view.viewBox().join(' '));
    };
    const endDrag = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (drag.moved) suppressClickUntil.current = performance.now() + 350;
      drag = null;
      map.classList.remove('is-dragging');
      if (map.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId);
    };
    const onPointerLeave = (event: PointerEvent) => { if (drag && !drag.moved) endDrag(event); };
    const onClick = (event: MouseEvent) => {
      if (performance.now() >= suppressClickUntil.current) return;
      event.preventDefault();
      event.stopPropagation();
    };
    map.addEventListener('wheel', onWheel, { passive: false });
    map.addEventListener('pointerdown', onPointerDown);
    map.addEventListener('pointermove', onPointerMove);
    map.addEventListener('pointerup', endDrag);
    map.addEventListener('pointercancel', endDrag);
    map.addEventListener('lostpointercapture', endDrag);
    map.addEventListener('pointerleave', onPointerLeave);
    map.addEventListener('click', onClick, true);
    return () => {
      if (drag && map.hasPointerCapture(drag.id)) map.releasePointerCapture(drag.id);
      map.classList.remove('is-dragging');
      map.removeEventListener('wheel', onWheel);
      map.removeEventListener('pointerdown', onPointerDown);
      map.removeEventListener('pointermove', onPointerMove);
      map.removeEventListener('pointerup', endDrag);
      map.removeEventListener('pointercancel', endDrag);
      map.removeEventListener('lostpointercapture', endDrag);
      map.removeEventListener('pointerleave', onPointerLeave);
      map.removeEventListener('click', onClick, true);
    };
  }, [node, refresh]);
  return <div ref={container} className="mapview" style={{ display: 'contents' }}>
    <MainArea node={node} refresh={refresh} />
  </div>;
}
