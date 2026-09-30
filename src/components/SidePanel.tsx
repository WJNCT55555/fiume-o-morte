import { legacyToReact } from '../lib/legacyReact';

export function SidePanel({ node, refresh }: { node: Element; refresh: () => void }) {
  return <>{legacyToReact(node, refresh, 'side')}</>;
}
