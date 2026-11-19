/** Import du texte d'un fichier (Vite / Vitest `?raw`), pour les tests. */
declare module '*?raw' {
  const text: string;
  export default text;
}
