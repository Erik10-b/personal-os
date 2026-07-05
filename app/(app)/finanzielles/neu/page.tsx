import { createTransaction } from "@/lib/actions/transactions";
import { localDateKey } from "@/lib/dateUtils";

export default function NeueTransaktionPage() {
  const today = localDateKey();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Neue Buchung</h1>
          <p>Einnahme oder Ausgabe erfassen.</p>
        </div>
      </div>

      <form action={createTransaction} className="form-grid">
        <div className="form-row">
          <label htmlFor="type">Typ</label>
          <select className="select" id="type" name="type" defaultValue="expense">
            <option value="expense">Ausgabe</option>
            <option value="income">Einnahme</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="amount">
            Betrag (€) <span className="req">*</span>
          </label>
          <input className="input mono" id="amount" name="amount" type="number" step="0.01" min="0" required />
        </div>

        <div className="form-row">
          <label htmlFor="category">
            Kategorie <span className="req">*</span>
          </label>
          <input className="input" id="category" name="category" required placeholder="z.B. Lebensmittel" />
        </div>

        <div className="form-row">
          <label htmlFor="occurred_on">Datum</label>
          <input className="input mono" id="occurred_on" name="occurred_on" type="date" defaultValue={today} required />
        </div>

        <div className="form-row">
          <label htmlFor="note">Notiz</label>
          <textarea className="textarea" id="note" name="note" />
        </div>

        <button type="submit" className="btn primary block">
          Buchen
        </button>
      </form>
    </>
  );
}
