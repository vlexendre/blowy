/** Jeton inconnu, expiré ou révoqué : MÊME page (aucun indice sur l'existence du lien). */
import s from './ange.module.css';

export default function AngeNotFound() {
  return (
    <main className={s.page}>
      <h1 className={`${s.display} ${s.h1}`}>Ce lien n’est plus valable.</h1>
      <p className={s.note}>Il a expiré, a été retiré, ou n’a jamais existé. Si tu t’inquiètes pour quelqu’un, appelle-le directement.</p>
      <div className={s.actions}>
        <a className={`${s.btn} ${s.btnDark}`} href="tel:17">
          Appeler le 17
        </a>
        <a className={`${s.btn} ${s.btnLight}`} href="tel:112">
          Urgence : 112
        </a>
      </div>
    </main>
  );
}
