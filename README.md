# Missio — guida al setup

Nessuna riga di codice da scrivere. Solo click. Circa 20 minuti.

---

## Cosa stai per mettere online

Una **web app** che funziona identica su iPhone e Android: si apre dal browser e si
installa sulla schermata home con un tap. Niente App Store, niente Google Play,
niente attese di approvazione, zero costi.

---

## Passo 1 — Supabase (il database)

1. Vai su [supabase.com](https://supabase.com) → **Start your project** → registrati con GitHub.
2. **New project**. Nome: `missio`. Scegli una password per il database e **salvala** da qualche parte.
   Region: `Central EU (Frankfurt)`. Crea. Aspetta ~2 minuti.
3. Menu a sinistra → **SQL Editor** → **New query**.
4. Apri il file `supabase/schema.sql` di questo progetto, copia **tutto** il contenuto,
   incollalo nell'editor, premi **Run**. Deve dire "Success".
5. Menu a sinistra → **Project Settings** (icona ingranaggio) → **API**. Tieni aperta
   questa pagina: ti servono due valori.
   - `Project URL`
   - `anon public` (sotto Project API keys)

### Configura le mail di login

6. **Authentication** → **Providers** → **Email**: assicurati che sia attivo e che
   *Confirm email* sia **on**.
7. **Authentication** → **URL Configuration**: per ora lascia stare, ci torni al Passo 3.

---

## Passo 2 — GitHub (dove vive il codice)

1. Vai su [github.com](https://github.com), registrati se non l'hai già fatto.
2. In alto a destra **+** → **New repository**. Nome: `missio`. Scegli **Private**. Create.
3. Nella pagina che si apre, clicca **uploading an existing file**.
4. Trascina dentro **tutti i file e le cartelle** di questo progetto
   (`app`, `lib`, `public`, `supabase`, `package.json`, `next.config.js`, `.gitignore`, `README.md`).
   **Non** caricare la cartella `node_modules` se la vedi — non serve.
5. In fondo → **Commit changes**.

---

## Passo 3 — Vercel (mettere l'app online)

1. Vai su [vercel.com](https://vercel.com) → **Sign up** → **Continue with GitHub**.
2. **Add New** → **Project** → trova `missio` → **Import**.
3. Prima di premere Deploy, apri **Environment Variables** e aggiungi due variabili
   (i valori li hai dal Passo 1.5):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | il tuo Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la tua chiave anon public |

4. **Deploy**. Dopo ~2 minuti hai un link tipo `missio-xxx.vercel.app`. **Quello è la tua app.**

### Collega il link a Supabase

5. Torna su Supabase → **Authentication** → **URL Configuration**:
   - `Site URL`: il tuo link Vercel (es. `https://missio-xxx.vercel.app`)
   - `Redirect URLs`: aggiungi `https://missio-xxx.vercel.app/auth/callback`
   - Save.

Senza questo passo, i link di login via mail non funzionano.

---

## Passo 4 — Diventa admin

1. Apri la tua app dal link Vercel, iscriviti con la tua mail, completa la registrazione.
2. Torna su Supabase → **Table Editor** → tabella `profiles`.
3. Trova la tua riga, metti `is_admin` su **true**, salva.
4. Ricarica l'app: ora vedi il bottone **Pannello admin**.

---

## Come si usa (il tuo lavoro settimanale)

**Pannello admin** → tre sezioni:

1. **In attesa** — tutti gli iscritti senza gruppo, raggruppati per corso+campus.
   Spunti 3 o 4 persone dello stesso segmento → **Crea gruppo**.
   Se qualcuno ha scritto un nome nel campo "conosci già qualcuno", te lo evidenzia in rosso:
   non metterli insieme.

2. **Gruppi attivi** — per ogni gruppo:
   - incolli il link del gruppo Telegram/WhatsApp che hai creato a mano;
   - assegni una missione dal menu (scadenza automatica a 4 giorni).

3. **Da verificare** — le foto caricate dai gruppi. Vedi la foto, controlli chi hanno
   spuntato come presente, **Approva** (i punti vanno al gruppo) o **Rifiuta**
   (la missione torna attiva).

La regola dei 2 presenti minimi è già dentro: sotto quella soglia l'app non ti fa approvare.

---

## Aggiungere o cambiare missioni

Supabase → **Table Editor** → tabella `missions` → **Insert row**.
Campi: `titolo`, `descrizione`, `citta`, `punti`. Ci sono già 4 missioni di esempio per Roma.

Scrivine altre prima di partire — è la parte che decide se il progetto funziona.

---

## Cambiare la soglia minima

Adesso è **9**. Per cambiarla servono due modifiche:
- `lib/supabase.js` → riga `export const SOGLIA = 9;`
- Supabase SQL Editor → `create or replace function soglia_minima() returns int language sql immutable as $$ select 12 $$;`

---

## Come si installa sul telefono (da dire agli studenti)

- **iPhone**: apri il link in Safari → tasto Condividi → *Aggiungi a Home*.
- **Android**: apri il link in Chrome → menu ⋮ → *Installa app* / *Aggiungi a schermata Home*.

Da lì in poi ha la sua icona e si apre a schermo intero, come un'app normale.

---

## Costi

Tutto gratis ai tuoi numeri. Supabase free: 500MB database + 1GB storage foto
(bastano per centinaia di missioni). Vercel free: più che sufficiente per 50 utenti.

---

## Cosa NON c'è ancora, di proposito

Mappa che si illumina, badge, streak, ricombinazione automatica dei gruppi,
notifiche push, chat in-app, locali partner. Tutta roba da aggiungere **dopo** aver
visto se i gruppi si incontrano davvero.
