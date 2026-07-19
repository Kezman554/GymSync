import type { Block } from '../../engine';

/** A block plus a stable client-side id, so duplicate blocks of the same
 * exercise can be reordered/removed independently (Block itself has no id). */
export interface BuilderBlock {
  localId: string;
  block: Block;
}

export function newLocalId(): string {
  return crypto.randomUUID();
}
