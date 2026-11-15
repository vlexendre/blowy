/** Seul point d'entrée de react-dom utilisé ici (évite d'ajouter @types/react-dom au dépôt). */
declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }
  export function createRoot(container: Element | DocumentFragment): Root;
}
