import { useEffect } from 'react';
import { MainArea } from '../components/MainArea';
import { legacyUI } from '../legacy/ui/runtime';

export function MapView({ node, refresh }: { node: Element; refresh: () => void }) {
  useEffect(() => {
    const map = document.querySelector<SVGSVGElement>('.mapcanvas > svg');
    if (!map) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = map.getBoundingClientRect();
      legacyUI.MapView.zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12,
        (event.clientX - rect.left) / rect.width,
        (event.clientY - rect.top) / rect.height);
      refresh();
    };
    map.addEventListener('wheel', onWheel, { passive: false });
    return () => map.removeEventListener('wheel', onWheel);
  }, [node, refresh]);
  return <MainArea node={node} refresh={refresh} />;
}
