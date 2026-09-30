import { legacyToReact } from '../lib/legacyReact';

export function MainArea({ node, refresh }: { node: Element; refresh: () => void }) {
  return <>{legacyToReact(node, refresh, 'main')}</>;
}
