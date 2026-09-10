import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Home as HomeIcon, CreditCard, Wallet, TrendingUp, PiggyBank, FileText,
  Settings as SettingsIcon, Search, Sun, Moon, MonitorSmartphone, Plus, X,
  Trash2, ChevronLeft, ChevronRight, Share2, Printer, Check, Clock,
  ArrowUpRight, ArrowDownRight, Download, Upload, RotateCcw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell
} from "recharts";

/* ---------------------------------------------------------------------- */
/* Helpers                                                                  */
/* ---------------------------------------------------------------------- */

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTH_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const fmtCurrency = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ymAdd = (y, m, delta) => {
  const total = y * 12 + m + delta;
  const ny = Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  return { y: ny, m: nm };
};
const ymDiff = (y1, m1, y2, m2) => (y1 * 12 + m1) - (y2 * 12 + m2);
const ymLabel = (y, m) => `${MONTH_NAMES[m]} de ${y}`;
const ymKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
const todayISO = () => new Date().toISOString();

const CARD_COLOR_OPTIONS = [
  { id: "roxo", label: "Roxo", from: "#7C5CD6", to: "#2E1F54", text: "#fff" },
  { id: "amarelo", label: "Amarelo", from: "#F0CD5E", to: "#8A6D1B", text: "#241C05" },
  { id: "branco", label: "Branco", from: "#FBFBFB", to: "#D9DCE2", text: "#14161B" },
  { id: "verde", label: "Verde", from: "#48B27F", to: "#134430", text: "#fff" },
  { id: "dourado", label: "Dourado", from: "#ECD08F", to: "#8F6D22", text: "#241C05" },
  { id: "preto", label: "Preto", from: "#3A3B40", to: "#050505", text: "#fff" },
  { id: "azul", label: "Azul", from: "#3E6FE0", to: "#0A1C4D", text: "#fff" },
  { id: "prateado", label: "Prateado", from: "#E3E6EB", to: "#93989F", text: "#191B1F" },
];

const CATEGORY_OPTIONS = ["Casa","Alimentação","Transporte","Moto","Trabalho","CNPJ","Lazer","Compras","Assinaturas","Investimentos","Outros"];
const ACCOUNT_TEMPLATES = ["Conta da casa","Consórcio","Condomínio","Água","Energia","CNPJ","Internet","Gás","Moto","Telefone","Aluguel","Outros"];
const REPEAT_OPTIONS = [
  { label: "Não repetir", months: 0 },
  { label: "Repetir por 1 mês", months: 1 },
  { label: "Repetir por 2 meses", months: 2 },
  { label: "Repetir por 3 meses", months: 3 },
  { label: "Repetir por 6 meses", months: 6 },
  { label: "Repetir por 12 meses", months: 12 },
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
function darken(hex, amt = 0.55) {
  try {
    const [r, g, b] = hexToRgb(hex);
    const d = (c) => Math.round(c * (1 - amt));
    return `rgb(${d(r)},${d(g)},${d(b)})`;
  } catch { return "#111"; }
}
function luminance(hex) {
  try {
    const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch { return 0; }
}

function cardStyle(card) {
  const preset = CARD_COLOR_OPTIONS.find((c) => c.id === card.colorId);
  if (preset) return { background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`, color: preset.text };
  const from = card.customColor || "#3E6FE0";
  const to = darken(from, 0.6);
  const text = luminance(from) > 0.6 ? "#14161B" : "#fff";
  return { background: `linear-gradient(135deg, ${from}, ${to})`, color: text };
}

/* ---------------------------------------------------------------------- */
/* Seed data                                                                */
/* ---------------------------------------------------------------------- */

function seedData() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const cardId = uid();
  return {
    theme: "auto",
    cards: [
      { id: cardId, name: "Cartão Roxo", colorId: "roxo", customColor: "", limit: 5000, closingDay: 20, dueDay: 5 },
      { id: uid(), name: "Cartão Dourado", colorId: "dourado", customColor: "", limit: 8000, closingDay: 10, dueDay: 20 },
    ],
    purchases: [
      { id: uid(), cardId, description: "Notebook", category: "Trabalho", value: 3000, installments: 10, startY: y, startM: m, obs: "" },
      { id: uid(), cardId, description: "Mercado", category: "Casa", value: 480, installments: 1, startY: y, startM: m, obs: "" },
    ],
    accounts: [
      { id: uid(), groupId: uid(), name: "Aluguel", category: "Casa", value: 1800, dueDay: 10, y, m, status: "Pendente", obs: "" },
      { id: uid(), groupId: uid(), name: "Energia", category: "Casa", value: 260, dueDay: 15, y, m, status: "Pago", obs: "" },
      { id: uid(), groupId: uid(), name: "Internet", category: "Casa", value: 120, dueDay: 8, y, m, status: "Pendente", obs: "" },
    ],
    incomes: [
      { id: uid(), payer: "Cliente 1", description: "Pagamento recebido", value: 1500, category: "Trabalho", y, m, d: 10, obs: "", avatar: "#D4AF6A" },
      { id: uid(), payer: "Salário", description: "Salário mensal", value: 6500, category: "Trabalho", y, m, d: 5, obs: "", avatar: "#3E6FE0" },
    ],
    investments: [
      { id: uid(), name: "CDB Liquidez Diária", type: "CDB", institution: "Banco XP", invested: 5000, current: 5180, date: todayISO(),
        history: [{ date: todayISO(), value: 5000 }, { date: todayISO(), value: 5100 }, { date: todayISO(), value: 5180 }] },
      { id: uid(), name: "Tesouro Selic", type: "Tesouro Direto", institution: "Tesouro Nacional", invested: 3000, current: 3070, date: todayISO(),
        history: [{ date: todayISO(), value: 3000 }, { date: todayISO(), value: 3070 }] },
    ],
  };
}

/* ---------------------------------------------------------------------- */
/* Main component                                                          */
/* ---------------------------------------------------------------------- */

export default function MarianoBank() {
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState(seedData);
  const [page, setPage] = useState("home");
  const [cursor, setCursor] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [systemDark, setSystemDark] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const saveTimer = useRef(null);

  // ---- load persisted state once (browser localStorage) ----
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mariano-bank-state");
      if (raw) {
        const parsed = JSON.parse(raw);
        setState((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      // no saved state yet — keep seed data
    } finally {
      setLoaded(true);
    }
  }, []);

  // ---- persist on change (debounced, browser localStorage) ----
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem("mariano-bank-state", JSON.stringify(state));
      } catch (e) { /* best effort */ }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [state, loaded]);

  // ---- theme (light / dark / auto) ----
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const fn = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  const effectiveTheme = state.theme === "auto" ? (systemDark ? "dark" : "light") : state.theme;

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  /* ------------------------------ mutators ------------------------------ */

  const addCard = (card) => setState((s) => ({ ...s, cards: [...s.cards, { id: uid(), ...card }] }));
  const deleteCard = (id) => setState((s) => ({
    ...s, cards: s.cards.filter((c) => c.id !== id), purchases: s.purchases.filter((p) => p.cardId !== id),
  }));

  const addPurchase = (purchase) => setState((s) => ({ ...s, purchases: [...s.purchases, { id: uid(), ...purchase }] }));
  const deletePurchase = (id) => setState((s) => ({ ...s, purchases: s.purchases.filter((p) => p.id !== id) }));

  const addAccountWithRepeat = (acc, repeatMonths) => {
    const groupId = uid();
    const entries = [];
    for (let i = 0; i <= repeatMonths; i++) {
      const { y, m } = ymAdd(acc.y, acc.m, i);
      entries.push({ id: uid(), groupId, name: acc.name, category: acc.category, value: acc.value, dueDay: acc.dueDay, y, m, status: "Pendente", obs: acc.obs || "" });
    }
    setState((s) => ({ ...s, accounts: [...s.accounts, ...entries] }));
  };
  const updateAccount = (id, patch) => setState((s) => ({ ...s, accounts: s.accounts.map((a) => a.id === id ? { ...a, ...patch } : a) }));
  const deleteAccount = (id) => setState((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));

  const addIncome = (inc) => setState((s) => ({ ...s, incomes: [...s.incomes, { id: uid(), ...inc }] }));
  const deleteIncome = (id) => setState((s) => ({ ...s, incomes: s.incomes.filter((i) => i.id !== id) }));

  const addInvestment = (inv) => setState((s) => ({
    ...s, investments: [...s.investments, { id: uid(), ...inv, history: [{ date: todayISO(), value: inv.invested }, { date: todayISO(), value: inv.current }] }],
  }));
  const updateInvestmentValue = (id, newValue) => setState((s) => ({
    ...s,
    investments: s.investments.map((inv) => inv.id === id
      ? { ...inv, current: newValue, history: [...inv.history, { date: todayISO(), value: newValue }] }
      : inv),
  }));
  const deleteInvestment = (id) => setState((s) => ({ ...s, investments: s.investments.filter((i) => i.id !== id) }));

  const resetAll = () => { setState(seedData()); showToast("Dados restaurados para o padrão."); };

  /* ------------------------------ derived data ------------------------------ */

  // installment occupying (y,m) for a purchase, or null
  const installmentAt = useCallback((p, y, m) => {
    const idx = ymDiff(y, m, p.startY, p.startM);
    if (idx < 0 || idx >= p.installments) return null;
    const base = Math.round((p.value / p.installments) * 100) / 100;
    const rounding = Math.round((p.value - base * p.installments) * 100) / 100;
    const value = idx === p.installments - 1 ? base + rounding : base;
    return { index: idx + 1, count: p.installments, value };
  }, []);

  // amount of card p billed in a given month
  const cardBillForMonth = useCallback((cardId, y, m) => {
    return state.purchases.filter((p) => p.cardId === cardId).reduce((sum, p) => {
      const inst = installmentAt(p, y, m);
      return inst ? sum + inst.value : sum;
    }, 0);
  }, [state.purchases, installmentAt]);

  // total still committed on a card from month (y,m) onward (outstanding exposure = "limite utilizado")
  const cardUsedFrom = useCallback((cardId, y, m) => {
    return state.purchases.filter((p) => p.cardId === cardId).reduce((sum, p) => {
      let s = 0;
      for (let i = 0; i < p.installments; i++) {
        const { y: iy, m: im } = ymAdd(p.startY, p.startM, i);
        if (ymDiff(iy, im, y, m) >= 0) {
          const inst = installmentAt(p, iy, im);
          if (inst) s += inst.value;
        }
      }
      return sum + s;
    }, 0);
  }, [state.purchases, installmentAt]);

  const monthAccounts = useCallback((y, m) => state.accounts.filter((a) => a.y === y && a.m === m), [state.accounts]);
  const monthIncomes = useCallback((y, m) => state.incomes.filter((i) => i.y === y && i.m === m), [state.incomes]);

  const monthSummary = useCallback((y, m) => {
    const totalIncome = monthIncomes(y, m).reduce((s, i) => s + Number(i.value), 0);
    const cardExpense = state.cards.reduce((s, c) => s + cardBillForMonth(c.id, y, m), 0);
    const accts = monthAccounts(y, m);
    const accountsTotal = accts.reduce((s, a) => s + Number(a.value), 0);
    const accountsPending = accts.filter((a) => a.status === "Pendente").reduce((s, a) => s + Number(a.value), 0);
    const totalExpenses = cardExpense + accountsTotal;
    const usedLimit = state.cards.reduce((s, c) => s + cardUsedFrom(c.id, y, m), 0);
    const totalLimit = state.cards.reduce((s, c) => s + Number(c.limit), 0);
    return {
      totalIncome, cardExpense, accountsTotal, accountsPending, totalExpenses,
      balance: totalIncome - totalExpenses, usedLimit, totalLimit,
      availableLimit: Math.max(totalLimit - usedLimit, 0),
    };
  }, [state.cards, cardBillForMonth, cardUsedFrom, monthAccounts, monthIncomes]);

  const summary = useMemo(() => monthSummary(cursor.y, cursor.m), [monthSummary, cursor]);

  const totalPatrimony = useMemo(() => state.investments.reduce((s, i) => s + Number(i.current), 0), [state.investments]);

  // ---- financial status signal (green / yellow / red) ----
  const farol = useMemo(() => {
    const investmentGood = totalPatrimony > 5000;
    const incomeGood = summary.totalIncome >= summary.totalExpenses;
    if (investmentGood && incomeGood) return { level: "green", label: "Situação estável" };
    if (!investmentGood && !incomeGood) return { level: "red", label: "Atenção necessária" };
    return { level: "yellow", label: "Situação mista" };
  }, [totalPatrimony, summary]);
  const totalInvested = useMemo(() => state.investments.reduce((s, i) => s + Number(i.invested), 0), [state.investments]);

  // last 6 months history for chart (ending at cursor month)
  const history6 = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const { y, m } = ymAdd(cursor.y, cursor.m, -i);
      const sm = monthSummary(y, m);
      arr.push({ label: MONTH_SHORT[m], entradas: sm.totalIncome, despesas: sm.totalExpenses, saldo: sm.balance });
    }
    return arr;
  }, [cursor, monthSummary]);

  // forecast next 6 months of committed expenses
  const forecast6 = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const { y, m } = ymAdd(cursor.y, cursor.m, i);
      const sm = monthSummary(y, m);
      arr.push({ label: MONTH_SHORT[m], comprometido: Math.round(sm.totalExpenses) });
    }
    return arr;
  }, [cursor, monthSummary]);

  const nextPayments = useMemo(() => {
    const accts = monthAccounts(cursor.y, cursor.m).filter((a) => a.status === "Pendente")
      .map((a) => ({ kind: "conta", name: a.name, day: a.dueDay, value: a.value, id: a.id }));
    const cardBills = state.cards.map((c) => ({ kind: "cartão", name: c.name, day: c.dueDay, value: cardBillForMonth(c.id, cursor.y, cursor.m), id: c.id }))
      .filter((c) => c.value > 0);
    return [...accts, ...cardBills].sort((a, b) => a.day - b.day);
  }, [monthAccounts, cursor, state.cards, cardBillForMonth]);

  /* ------------------------------ search ------------------------------ */
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    const out = [];
    state.accounts.forEach((a) => a.name.toLowerCase().includes(term) && out.push({ type: "Conta", label: a.name, sub: `${ymLabel(a.y, a.m)} · ${fmtCurrency(a.value)}` }));
    state.purchases.forEach((p) => p.description.toLowerCase().includes(term) && out.push({ type: "Compra", label: p.description, sub: fmtCurrency(p.value) }));
    state.incomes.forEach((i) => (i.payer.toLowerCase().includes(term) || i.description.toLowerCase().includes(term)) && out.push({ type: "Entrada", label: i.payer, sub: fmtCurrency(i.value) }));
    state.investments.forEach((i) => i.name.toLowerCase().includes(term) && out.push({ type: "Investimento", label: i.name, sub: fmtCurrency(i.current) }));
    return out.slice(0, 20);
  }, [searchTerm, state]);

  /* ------------------------------ nav config ------------------------------ */

  const NAV = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "cards", label: "Cartões", icon: CreditCard },
    { id: "accounts", label: "Contas", icon: Wallet },
    { id: "incomes", label: "Entradas", icon: ArrowDownRight },
    { id: "investments", label: "Investimentos", icon: TrendingUp },
    { id: "total", label: "Total do Mês", icon: PiggyBank },
    { id: "reports", label: "Relatórios", icon: FileText },
    { id: "settings", label: "Configurações", icon: SettingsIcon },
  ];

  /* ------------------------------ render ------------------------------ */

  return (
    <div className={`mb-root theme-${effectiveTheme}`}>
      <style>{CSS}</style>

      <aside className="mb-sidebar">
        <div className="mb-wordmark">
          <span className="mb-wordmark-main">Mariano</span>
          <span className="mb-wordmark-sub">BANK</span>
        </div>
        <nav className="mb-nav-desktop">
          {NAV.map((n) => (
            <button key={n.id} className={`mb-navitem ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
              <n.icon size={18} strokeWidth={1.7} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="mb-sidebar-foot">Uso pessoal · dados salvos neste dispositivo</div>
      </aside>

      <div className="mb-main">
        <header className="mb-topbar">
          <div className="mb-month-switch">
            <button onClick={() => setCursor(ymAdd(cursor.y, cursor.m, -1))}><ChevronLeft size={16} /></button>
            <span>{ymLabel(cursor.y, cursor.m)}</span>
            <button onClick={() => setCursor(ymAdd(cursor.y, cursor.m, 1))}><ChevronRight size={16} /></button>
          </div>
          <div className="mb-topbar-actions">
            <span className={`mb-farol mb-farol-${farol.level}`} title={`Investido: ${fmtCurrency(totalPatrimony)} (meta > R$ 5.000) · Entradas ${summary.totalIncome >= summary.totalExpenses ? "cobrem" : "não cobrem"} os gastos`}>
              <span className="mb-farol-dot" />
              <span className="mb-farol-label">{farol.label}</span>
            </span>
            <button className="mb-icon-btn" onClick={() => setSearchOpen(true)} aria-label="Buscar"><Search size={17} /></button>
            <div className="mb-theme-toggle">
              <button className={state.theme === "light" ? "on" : ""} onClick={() => setState((s) => ({ ...s, theme: "light" }))} aria-label="Modo claro"><Sun size={15} /></button>
              <button className={state.theme === "dark" ? "on" : ""} onClick={() => setState((s) => ({ ...s, theme: "dark" }))} aria-label="Modo escuro"><Moon size={15} /></button>
              <button className={state.theme === "auto" ? "on" : ""} onClick={() => setState((s) => ({ ...s, theme: "auto" }))} aria-label="Automático"><MonitorSmartphone size={15} /></button>
            </div>
          </div>
        </header>

        <main className="mb-content">
          {page === "home" && (
            <HomePage summary={summary} cursor={cursor} history6={history6} forecast6={forecast6}
              nextPayments={nextPayments} cards={state.cards} cardBillForMonth={cardBillForMonth}
              cardUsedFrom={cardUsedFrom} totalPatrimony={totalPatrimony} />
          )}
          {page === "cards" && (
            <CardsPage cards={state.cards} purchases={state.purchases} cursor={cursor}
              cardBillForMonth={cardBillForMonth} cardUsedFrom={cardUsedFrom} installmentAt={installmentAt}
              addCard={addCard} deleteCard={deleteCard} addPurchase={addPurchase} deletePurchase={deletePurchase}
              showToast={showToast} />
          )}
          {page === "accounts" && (
            <AccountsPage accounts={monthAccounts(cursor.y, cursor.m)} cursor={cursor}
              addAccountWithRepeat={addAccountWithRepeat} updateAccount={updateAccount} deleteAccount={deleteAccount}
              showToast={showToast} />
          )}
          {page === "incomes" && (
            <IncomesPage incomes={monthIncomes(cursor.y, cursor.m)} cursor={cursor}
              addIncome={addIncome} deleteIncome={deleteIncome} showToast={showToast} />
          )}
          {page === "investments" && (
            <InvestmentsPage investments={state.investments} totalPatrimony={totalPatrimony} totalInvested={totalInvested}
              addInvestment={addInvestment} updateInvestmentValue={updateInvestmentValue} deleteInvestment={deleteInvestment}
              showToast={showToast} />
          )}
          {page === "total" && (
            <TotalMonthPage summary={summary} cursor={cursor} forecast6={forecast6} totalPatrimony={totalPatrimony} />
          )}
          {page === "reports" && (
            <ReportsPage state={state} cursor={cursor} summary={summary} monthSummary={monthSummary} showToast={showToast} />
          )}
          {page === "settings" && (
            <SettingsPage state={state} setState={setState} resetAll={resetAll} showToast={showToast} />
          )}
        </main>
      </div>

      <nav className="mb-nav-mobile">
        {NAV.slice(0, 5).map((n) => (
          <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => setPage(n.id)}>
            <n.icon size={19} strokeWidth={1.7} />
            <span>{n.label}</span>
          </button>
        ))}
        <button className={["total","reports","settings"].includes(page) ? "active" : ""} onClick={() => setPage("total")}>
          <SettingsIcon size={19} strokeWidth={1.7} />
          <span>Mais</span>
        </button>
      </nav>

      {searchOpen && (
        <div className="mb-overlay" onClick={() => setSearchOpen(false)}>
          <div className="mb-search-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mb-search-input">
              <Search size={16} />
              <input autoFocus placeholder="Buscar contas, compras, entradas, investimentos…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <button onClick={() => setSearchOpen(false)}><X size={16} /></button>
            </div>
            <div className="mb-search-results">
              {searchTerm && searchResults.length === 0 && <div className="mb-empty">Nada encontrado para "{searchTerm}".</div>}
              {searchResults.map((r, idx) => (
                <div key={idx} className="mb-search-row">
                  <span className="mb-tag">{r.type}</span>
                  <div><div className="mb-search-title">{r.label}</div><div className="mb-search-sub">{r.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="mb-toast">{toast}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Shared bits                                                             */
/* ---------------------------------------------------------------------- */

function StatCard({ label, value, tone, icon: Icon, hint }) {
  return (
    <div className={`mb-stat mb-stat-${tone || "neutral"}`}>
      <div className="mb-stat-top">
        <span className="mb-stat-label">{label}</span>
        {Icon && <Icon size={16} strokeWidth={1.6} />}
      </div>
      <div className="mb-stat-value">{value}</div>
      {hint && <div className="mb-stat-hint">{hint}</div>}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div className="mb-section-title">
      <h2>{children}</h2>
      {action}
    </div>
  );
}

function Empty({ children }) { return <div className="mb-empty">{children}</div>; }

function ProgressBar({ pct, color }) {
  return (
    <div className="mb-progress">
      <div className="mb-progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color || "var(--gold)" }} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Home                                                                    */
/* ---------------------------------------------------------------------- */

function HomePage({ summary, cursor, history6, forecast6, nextPayments, cards, cardBillForMonth, cardUsedFrom, totalPatrimony }) {
  const limitPct = summary.totalLimit ? (summary.usedLimit / summary.totalLimit) * 100 : 0;
  const donutData = [{ name: "usado", value: summary.usedLimit }, { name: "livre", value: summary.availableLimit || 0.0001 }];

  return (
    <div className="mb-page">
      <SectionTitle>Resumo de {ymLabel(cursor.y, cursor.m)}</SectionTitle>
      <div className="mb-stat-grid">
        <StatCard label="Entradas" value={fmtCurrency(summary.totalIncome)} tone="gold" icon={ArrowDownRight} />
        <StatCard label="Despesas" value={fmtCurrency(summary.totalExpenses)} tone="silver" icon={ArrowUpRight} />
        <StatCard label="Investido (patrimônio)" value={fmtCurrency(totalPatrimony)} icon={TrendingUp} />
        <StatCard label="Saldo do mês" value={fmtCurrency(summary.balance)} tone={summary.balance >= 0 ? "positive" : "negative"} icon={PiggyBank} />
        <StatCard label="Limite utilizado" value={fmtCurrency(summary.usedLimit)} hint={`${limitPct.toFixed(0)}% do limite total`} />
        <StatCard label="Limite disponível" value={fmtCurrency(summary.availableLimit)} />
      </div>

      <div className="mb-grid-2">
        <div className="mb-panel">
          <SectionTitle>Entradas × Despesas</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={history6} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="silverFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--silver)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--silver)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={0} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="entradas" stroke="var(--gold)" strokeWidth={2} fill="url(#goldFill)" name="Entradas" />
              <Area type="monotone" dataKey="despesas" stroke="var(--silver)" strokeWidth={2} fill="url(#silverFill)" name="Despesas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mb-panel">
          <SectionTitle>Uso do limite total</SectionTitle>
          <div className="mb-donut-wrap">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={52} outerRadius={68} startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill="var(--gold)" />
                  <Cell fill="var(--surface-2)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mb-donut-label">
              <strong>{limitPct.toFixed(0)}%</strong>
              <span>utilizado</span>
            </div>
          </div>
          <div className="mb-card-mini-list">
            {cards.map((c) => {
              const used = cardUsedFrom(c.id, cursor.y, cursor.m);
              const pct = c.limit ? (used / c.limit) * 100 : 0;
              return (
                <div key={c.id} className="mb-card-mini">
                  <div className="mb-card-mini-top"><span>{c.name}</span><span>{pct.toFixed(0)}%</span></div>
                  <ProgressBar pct={pct} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-grid-2">
        <div className="mb-panel">
          <SectionTitle>Próximos pagamentos</SectionTitle>
          {nextPayments.length === 0 && <Empty>Nenhum pagamento pendente neste mês.</Empty>}
          <div className="mb-list">
            {nextPayments.map((p, idx) => (
              <div key={idx} className="mb-list-row">
                <div className="mb-list-icon"><Clock size={15} /></div>
                <div className="mb-list-main">
                  <div className="mb-list-title">{p.name}</div>
                  <div className="mb-list-sub">{p.kind === "cartão" ? "Fatura do cartão" : "Conta"} · vence dia {p.day}</div>
                </div>
                <div className="mb-list-value">{fmtCurrency(p.value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-panel">
          <SectionTitle>Comprometido nos próximos meses</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={forecast6} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={0} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="comprometido" radius={[6, 6, 0, 0]} fill="var(--gold)" name="Comprometido" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="mb-tooltip">
      <div className="mb-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="mb-tooltip-row"><span style={{ color: p.color }}>●</span> {p.name}: {fmtCurrency(p.value)}</div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Cards page                                                              */
/* ---------------------------------------------------------------------- */

function CardsPage({ cards, purchases, cursor, cardBillForMonth, cardUsedFrom, installmentAt, addCard, deleteCard, addPurchase, deletePurchase, showToast }) {
  const [selected, setSelected] = useState(cards[0]?.id || null);
  const [showNewCard, setShowNewCard] = useState(false);
  const [showNewPurchase, setShowNewPurchase] = useState(false);

  useEffect(() => { if (!selected && cards[0]) setSelected(cards[0].id); }, [cards, selected]);
  const activeCard = cards.find((c) => c.id === selected);
  const cardPurchases = purchases.filter((p) => p.cardId === selected);

  return (
    <div className="mb-page">
      <SectionTitle action={<button className="mb-btn-gold" onClick={() => setShowNewCard(true)}><Plus size={15} /> Novo cartão</button>}>Cartões</SectionTitle>

      <div className="mb-cards-row">
        {cards.map((c) => {
          const used = cardUsedFrom(c.id, cursor.y, cursor.m);
          const pct = c.limit ? (used / c.limit) * 100 : 0;
          return (
            <div key={c.id} className={`mb-bankcard ${selected === c.id ? "selected" : ""}`} style={cardStyle(c)} onClick={() => setSelected(c.id)}>
              <div className="mb-bankcard-top">
                <span className="mb-bankcard-brand">MARIANO BANK</span>
                <span className="mb-bankcard-name">{c.name}</span>
              </div>
              <div className="mb-bankcard-mid">
                <div><span>Limite</span><strong>{fmtCurrency(c.limit)}</strong></div>
                <div><span>Disponível</span><strong>{fmtCurrency(Math.max(c.limit - used, 0))}</strong></div>
              </div>
              <ProgressBar pct={pct} color={cardStyle(c).color === "#fff" ? "rgba(255,255,255,.85)" : "rgba(20,20,20,.65)"} />
              <div className="mb-bankcard-foot"><span>Fecha dia {c.closingDay}</span><span>Vence dia {c.dueDay}</span></div>
            </div>
          );
        })}
        {cards.length === 0 && <Empty>Nenhum cartão cadastrado ainda.</Empty>}
      </div>

      {activeCard && (
        <div className="mb-panel">
          <SectionTitle action={<button className="mb-btn-gold" onClick={() => setShowNewPurchase(true)}><Plus size={15} /> Nova compra</button>}>
            Compras · {activeCard.name} · {ymLabel(cursor.y, cursor.m)}
          </SectionTitle>
          <div className="mb-stat-grid mb-stat-grid-3">
            <StatCard label="Fatura do mês" value={fmtCurrency(cardBillForMonth(activeCard.id, cursor.y, cursor.m))} tone="gold" />
            <StatCard label="Comprometido total" value={fmtCurrency(cardUsedFrom(activeCard.id, cursor.y, cursor.m))} />
            <StatCard label="Disponível" value={fmtCurrency(Math.max(activeCard.limit - cardUsedFrom(activeCard.id, cursor.y, cursor.m), 0))} />
          </div>
          <div className="mb-list">
            {cardPurchases.length === 0 && <Empty>Nenhuma compra neste cartão ainda.</Empty>}
            {cardPurchases.map((p) => {
              const inst = installmentAt(p, cursor.y, cursor.m);
              return (
                <div key={p.id} className="mb-list-row">
                  <div className="mb-list-main">
                    <div className="mb-list-title">{p.description} <span className="mb-tag">{p.category}</span></div>
                    <div className="mb-list-sub">
                      {p.installments > 1
                        ? (inst ? `Parcela ${inst.index}/${inst.count} · ${fmtCurrency(inst.value)}` : `${p.installments}x · fora deste mês`)
                        : `À vista · ${fmtCurrency(p.value)}`}
                    </div>
                  </div>
                  <div className="mb-list-value">{fmtCurrency(p.value)}</div>
                  <button className="mb-icon-btn danger" onClick={() => deletePurchase(p.id)}><Trash2 size={15} /></button>
                </div>
              );
            })}
          </div>
          {cards.length > 0 && (
            <button className="mb-btn-ghost danger" style={{ marginTop: 14 }} onClick={() => { deleteCard(activeCard.id); showToast("Cartão removido."); }}>
              <Trash2 size={14} /> Remover este cartão
            </button>
          )}
        </div>
      )}

      {showNewCard && (
        <Modal title="Novo cartão" onClose={() => setShowNewCard(false)}>
          <NewCardForm onSubmit={(c) => { addCard(c); setShowNewCard(false); showToast("Cartão adicionado."); }} />
        </Modal>
      )}
      {showNewPurchase && activeCard && (
        <Modal title="Nova compra" onClose={() => setShowNewPurchase(false)}>
          <NewPurchaseForm cardId={activeCard.id} cursor={cursor} onSubmit={(p) => { addPurchase(p); setShowNewPurchase(false); showToast("Compra registrada."); }} />
        </Modal>
      )}
    </div>
  );
}

function NewCardForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [colorId, setColorId] = useState("azul");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState(10);
  const [dueDay, setDueDay] = useState(20);

  return (
    <form className="mb-form" onSubmit={(e) => {
      e.preventDefault();
      if (!name || !limit) return;
      onSubmit({ name, colorId, customColor: "", limit: Number(limit), closingDay: Number(closingDay), dueDay: Number(dueDay) });
    }}>
      <label>Nome / apelido<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cartão Roxo" required /></label>
      <label>Cor
        <div className="mb-color-row">
          {CARD_COLOR_OPTIONS.map((c) => (
            <button type="button" key={c.id} className={`mb-swatch ${colorId === c.id ? "on" : ""}`}
              style={{ background: `linear-gradient(135deg,${c.from},${c.to})` }} onClick={() => setColorId(c.id)} title={c.label} />
          ))}
        </div>
      </label>
      <label>Limite total (R$)<input type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} required /></label>
      <div className="mb-form-row">
        <label>Dia de fechamento<input type="number" min="1" max="31" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} /></label>
        <label>Dia de vencimento<input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} /></label>
      </div>
      <button className="mb-btn-gold mb-btn-block" type="submit">Salvar cartão</button>
    </form>
  );
}

function NewPurchaseForm({ cardId, cursor, onSubmit }) {
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [mode, setMode] = useState("avista");
  const [installments, setInstallments] = useState(2);
  const [obs, setObs] = useState("");

  return (
    <form className="mb-form" onSubmit={(e) => {
      e.preventDefault();
      if (!description || !value) return;
      onSubmit({
        cardId, description, category, value: Number(value),
        installments: mode === "avista" ? 1 : Number(installments),
        startY: cursor.y, startM: cursor.m, obs,
      });
    }}>
      <label>Descrição<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Notebook" required /></label>
      <label>Valor total (R$)<input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required /></label>
      <label>Categoria
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <div className="mb-toggle-row">
        <button type="button" className={mode === "avista" ? "on" : ""} onClick={() => setMode("avista")}>À vista</button>
        <button type="button" className={mode === "parcelado" ? "on" : ""} onClick={() => setMode("parcelado")}>Parcelado</button>
      </div>
      {mode === "parcelado" && (
        <label>Número de parcelas
          <input type="number" min="2" max="48" value={installments} onChange={(e) => setInstallments(e.target.value)} />
          {value && installments > 0 && <span className="mb-hint">{installments}x de {fmtCurrency(Number(value) / Number(installments))}</span>}
        </label>
      )}
      <label>Observação (opcional)<input value={obs} onChange={(e) => setObs(e.target.value)} /></label>
      <button className="mb-btn-gold mb-btn-block" type="submit">Salvar compra</button>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* Accounts page                                                           */
/* ---------------------------------------------------------------------- */

function AccountsPage({ accounts, cursor, addAccountWithRepeat, updateAccount, deleteAccount, showToast }) {
  const [showNew, setShowNew] = useState(false);
  const total = accounts.reduce((s, a) => s + Number(a.value), 0);
  const pending = accounts.filter((a) => a.status === "Pendente").reduce((s, a) => s + Number(a.value), 0);

  return (
    <div className="mb-page">
      <SectionTitle action={<button className="mb-btn-gold" onClick={() => setShowNew(true)}><Plus size={15} /> Nova conta</button>}>
        Contas · {ymLabel(cursor.y, cursor.m)}
      </SectionTitle>
      <div className="mb-stat-grid mb-stat-grid-2">
        <StatCard label="Total do mês" value={fmtCurrency(total)} tone="gold" />
        <StatCard label="Pendente" value={fmtCurrency(pending)} tone="silver" />
      </div>
      <div className="mb-list">
        {accounts.length === 0 && <Empty>Nenhuma conta cadastrada para este mês.</Empty>}
        {accounts.sort((a, b) => a.dueDay - b.dueDay).map((a) => (
          <div key={a.id} className="mb-list-row">
            <button className={`mb-status-dot ${a.status === "Pago" ? "paid" : ""}`}
              onClick={() => updateAccount(a.id, { status: a.status === "Pago" ? "Pendente" : "Pago" })}
              title="Alternar status">
              {a.status === "Pago" && <Check size={12} />}
            </button>
            <div className="mb-list-main">
              <div className="mb-list-title">{a.name} <span className="mb-tag">{a.category}</span></div>
              <div className="mb-list-sub">Vence dia {a.dueDay} · {a.status}</div>
            </div>
            <div className="mb-list-value">{fmtCurrency(a.value)}</div>
            <button className="mb-icon-btn danger" onClick={() => deleteAccount(a.id)}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      {showNew && (
        <Modal title="Nova conta" onClose={() => setShowNew(false)}>
          <NewAccountForm cursor={cursor} onSubmit={(acc, repeat) => { addAccountWithRepeat(acc, repeat); setShowNew(false); showToast("Conta adicionada."); }} />
        </Modal>
      )}
    </div>
  );
}

function NewAccountForm({ cursor, onSubmit }) {
  const [name, setName] = useState("");
  const [customName, setCustomName] = useState(false);
  const [value, setValue] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [dueDay, setDueDay] = useState(10);
  const [repeat, setRepeat] = useState(0);
  const [obs, setObs] = useState("");

  return (
    <form className="mb-form" onSubmit={(e) => {
      e.preventDefault();
      if (!name || !value) return;
      onSubmit({ name, value: Number(value), category, dueDay: Number(dueDay), y: cursor.y, m: cursor.m, obs }, Number(repeat));
    }}>
      <label>Nome da conta
        {!customName ? (
          <select value={name} onChange={(e) => e.target.value === "__custom" ? setCustomName(true) : setName(e.target.value)}>
            <option value="">Selecione…</option>
            {ACCOUNT_TEMPLATES.map((t) => <option key={t}>{t}</option>)}
            <option value="__custom">Personalizado…</option>
          </select>
        ) : (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da conta" autoFocus />
        )}
      </label>
      <label>Valor (R$)<input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required /></label>
      <div className="mb-form-row">
        <label>Categoria
          <select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label>Vencimento (dia)<input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} /></label>
      </div>
      <label>Repetir nos próximos meses?
        <select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
          {REPEAT_OPTIONS.map((r) => <option key={r.months} value={r.months}>{r.label}</option>)}
        </select>
      </label>
      <label>Observação (opcional)<input value={obs} onChange={(e) => setObs(e.target.value)} /></label>
      <button className="mb-btn-gold mb-btn-block" type="submit">Salvar conta</button>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* Incomes page                                                            */
/* ---------------------------------------------------------------------- */

function IncomesPage({ incomes, cursor, addIncome, deleteIncome, showToast }) {
  const [showNew, setShowNew] = useState(false);
  const total = incomes.reduce((s, i) => s + Number(i.value), 0);

  return (
    <div className="mb-page">
      <SectionTitle action={<button className="mb-btn-gold" onClick={() => setShowNew(true)}><Plus size={15} /> Nova entrada</button>}>
        Entradas · {ymLabel(cursor.y, cursor.m)}
      </SectionTitle>
      <div className="mb-stat-grid mb-stat-grid-1">
        <StatCard label="Total recebido no mês" value={fmtCurrency(total)} tone="gold" />
      </div>
      <div className="mb-income-grid">
        {incomes.length === 0 && <Empty>Nenhuma entrada registrada neste mês.</Empty>}
        {incomes.sort((a, b) => a.d - b.d).map((i) => (
          <div key={i.id} className="mb-income-card">
            <div className="mb-avatar" style={{ background: i.avatar || "var(--gold)" }}>{i.payer?.[0]?.toUpperCase() || "?"}</div>
            <div className="mb-income-body">
              <div className="mb-list-title">{i.payer}</div>
              <div className="mb-list-sub">{i.description}</div>
              <div className="mb-list-sub">{String(i.d).padStart(2, "0")}/{String(cursor.m + 1).padStart(2, "0")}/{cursor.y} · <span className="mb-tag">{i.category}</span></div>
            </div>
            <div className="mb-income-value">{fmtCurrency(i.value)}</div>
            <button className="mb-icon-btn danger" onClick={() => deleteIncome(i.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {showNew && (
        <Modal title="Nova entrada" onClose={() => setShowNew(false)}>
          <NewIncomeForm cursor={cursor} onSubmit={(inc) => { addIncome(inc); setShowNew(false); showToast("Entrada registrada."); }} />
        </Modal>
      )}
    </div>
  );
}

const AVATAR_COLORS = ["#D4AF6A", "#3E6FE0", "#48B27F", "#C7CDD9", "#7C5CD6"];

function NewIncomeForm({ cursor, onSubmit }) {
  const [payer, setPayer] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [day, setDay] = useState(new Date().getDate());
  const [avatar, setAvatar] = useState(AVATAR_COLORS[0]);
  const [obs, setObs] = useState("");

  return (
    <form className="mb-form" onSubmit={(e) => {
      e.preventDefault();
      if (!payer || !value) return;
      onSubmit({ payer, description, value: Number(value), category, y: cursor.y, m: cursor.m, d: Number(day), obs, avatar });
    }}>
      <label>Cliente / pagador<input value={payer} onChange={(e) => setPayer(e.target.value)} required /></label>
      <label>Descrição<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Pagamento recebido" /></label>
      <label>Valor (R$)<input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required /></label>
      <div className="mb-form-row">
        <label>Categoria<select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Dia<input type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} /></label>
      </div>
      <label>Cor do avatar
        <div className="mb-color-row">
          {AVATAR_COLORS.map((c) => <button type="button" key={c} className={`mb-swatch ${avatar === c ? "on" : ""}`} style={{ background: c }} onClick={() => setAvatar(c)} />)}
        </div>
      </label>
      <label>Observação (opcional)<input value={obs} onChange={(e) => setObs(e.target.value)} /></label>
      <button className="mb-btn-gold mb-btn-block" type="submit">Salvar entrada</button>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* Investments page                                                        */
/* ---------------------------------------------------------------------- */

function InvestmentsPage({ investments, totalPatrimony, totalInvested, addInvestment, updateInvestmentValue, deleteInvestment, showToast }) {
  const [showNew, setShowNew] = useState(false);
  const rendimento = totalPatrimony - totalInvested;

  const evolutionData = useMemo(() => {
    const allDates = Array.from(new Set(investments.flatMap((i) => i.history.map((h) => h.date)))).sort();
    return allDates.map((date, idx) => {
      const total = investments.reduce((sum, inv) => {
        const upTo = inv.history.filter((h) => h.date <= date);
        const val = upTo.length ? upTo[upTo.length - 1].value : inv.invested;
        return sum + val;
      }, 0);
      return { label: `#${idx + 1}`, patrimonio: Math.round(total) };
    });
  }, [investments]);

  return (
    <div className="mb-page">
      <SectionTitle action={<button className="mb-btn-gold" onClick={() => setShowNew(true)}><Plus size={15} /> Adicionar investimento</button>}>
        Investimentos
      </SectionTitle>
      <div className="mb-stat-grid mb-stat-grid-3">
        <StatCard label="Valor investido" value={fmtCurrency(totalInvested)} />
        <StatCard label="Patrimônio atual" value={fmtCurrency(totalPatrimony)} tone="gold" />
        <StatCard label="Rendimento" value={fmtCurrency(rendimento)} tone={rendimento >= 0 ? "positive" : "negative"} />
      </div>

      <div className="mb-panel">
        <SectionTitle>Evolução do patrimônio</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={evolutionData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={0} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="patrimonio" stroke="var(--gold)" strokeWidth={2.4} dot={false} name="Patrimônio" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-invest-grid">
        {investments.map((inv) => (
          <InvestmentCard key={inv.id} inv={inv} onUpdate={(v) => { updateInvestmentValue(inv.id, v); showToast("Valor atualizado."); }} onDelete={() => deleteInvestment(inv.id)} />
        ))}
        {investments.length === 0 && <Empty>Nenhum investimento cadastrado.</Empty>}
      </div>

      {showNew && (
        <Modal title="Novo investimento" onClose={() => setShowNew(false)}>
          <NewInvestmentForm onSubmit={(inv) => { addInvestment(inv); setShowNew(false); showToast("Investimento adicionado."); }} />
        </Modal>
      )}
    </div>
  );
}

function InvestmentCard({ inv, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(inv.current);
  const rendimento = inv.current - inv.invested;
  const pct = inv.invested ? (rendimento / inv.invested) * 100 : 0;
  const miniHistory = inv.history.map((h, idx) => ({ label: idx, value: h.value }));

  return (
    <div className="mb-panel mb-invest-card">
      <div className="mb-invest-head">
        <div><div className="mb-list-title">{inv.name}</div><div className="mb-list-sub">{inv.type} · {inv.institution || "—"}</div></div>
        <button className="mb-icon-btn danger" onClick={onDelete}><Trash2 size={14} /></button>
      </div>
      <div className="mb-stat-grid mb-stat-grid-3">
        <StatCard label="Investido" value={fmtCurrency(inv.invested)} />
        <StatCard label="Atual" value={fmtCurrency(inv.current)} tone="gold" />
        <StatCard label="Rendimento" value={`${fmtCurrency(rendimento)} (${pct.toFixed(1)}%)`} tone={rendimento >= 0 ? "positive" : "negative"} />
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={miniHistory}>
          <Line type="monotone" dataKey="value" stroke="var(--gold)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      {editing ? (
        <form className="mb-inline-form" onSubmit={(e) => { e.preventDefault(); onUpdate(Number(val)); setEditing(false); }}>
          <input type="number" step="0.01" value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
          <button className="mb-btn-gold" type="submit">Salvar</button>
          <button type="button" className="mb-btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
        </form>
      ) : (
        <button className="mb-btn-ghost mb-btn-block" onClick={() => setEditing(true)}>Atualizar valor atual</button>
      )}
    </div>
  );
}

function NewInvestmentForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("CDB");
  const [institution, setInstitution] = useState("");
  const [invested, setInvested] = useState("");
  const [current, setCurrent] = useState("");
  const [obs, setObs] = useState("");
  const TYPES = ["CDB","Tesouro Direto","Dólar digital","Criptomoedas","Ações","Fundos","Poupança","Outros"];

  return (
    <form className="mb-form" onSubmit={(e) => {
      e.preventDefault();
      if (!name || !invested) return;
      onSubmit({ name, type, institution, invested: Number(invested), current: Number(current || invested), date: todayISO(), obs });
    }}>
      <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label>Tipo<select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label>Instituição (opcional)<input value={institution} onChange={(e) => setInstitution(e.target.value)} /></label>
      <div className="mb-form-row">
        <label>Valor investido (R$)<input type="number" step="0.01" value={invested} onChange={(e) => setInvested(e.target.value)} required /></label>
        <label>Valor atual (R$)<input type="number" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="= investido" /></label>
      </div>
      <label>Observação (opcional)<input value={obs} onChange={(e) => setObs(e.target.value)} /></label>
      <button className="mb-btn-gold mb-btn-block" type="submit">Salvar investimento</button>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* Total do mês                                                            */
/* ---------------------------------------------------------------------- */

function TotalMonthPage({ summary, cursor, forecast6, totalPatrimony }) {
  const rows = [
    { label: "Entradas", value: summary.totalIncome, tone: "positive" },
    { label: "Contas", value: -summary.accountsTotal, tone: "negative" },
    { label: "Cartões (fatura do mês)", value: -summary.cardExpense, tone: "negative" },
    { label: "Investido (patrimônio atual)", value: totalPatrimony, tone: "neutral" },
  ];

  return (
    <div className="mb-page">
      <SectionTitle>Total do mês · {ymLabel(cursor.y, cursor.m)}</SectionTitle>
      <div className="mb-panel mb-total-hero">
        <span className="mb-total-hero-label">Saldo do mês</span>
        <span className={`mb-total-hero-value ${summary.balance >= 0 ? "positive" : "negative"}`}>{fmtCurrency(summary.balance)}</span>
        <span className="mb-total-hero-hint">Entradas menos despesas de contas e cartões</span>
      </div>

      <div className="mb-panel">
        <div className="mb-breakdown">
          {rows.map((r) => (
            <div key={r.label} className="mb-breakdown-row">
              <span>{r.label}</span>
              <span className={`mb-breakdown-value ${r.tone}`}>{r.value < 0 ? "− " : ""}{fmtCurrency(Math.abs(r.value))}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-panel">
        <SectionTitle>Valores já comprometidos</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={forecast6} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={0} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="comprometido" radius={[6, 6, 0, 0]} fill="var(--gold)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Reports page                                                            */
/* ---------------------------------------------------------------------- */

function ReportsPage({ state, cursor, summary, monthSummary, showToast }) {
  const [reportText, setReportText] = useState("");
  const [reportTitle, setReportTitle] = useState("");

  const buildReport = (kind) => {
    const header = `MARIANO BANK — Relatório de ${kind}\n${ymLabel(cursor.y, cursor.m)}\n${"—".repeat(36)}\n`;
    let body = "";
    if (kind === "Investimentos") {
      body = state.investments.map((i) => `• ${i.name} (${i.type})\n  Investido: ${fmtCurrency(i.invested)} | Atual: ${fmtCurrency(i.current)} | Rendimento: ${fmtCurrency(i.current - i.invested)}`).join("\n");
      body += `\n\nTotal investido: ${fmtCurrency(state.investments.reduce((s, i) => s + i.invested, 0))}`;
      body += `\nPatrimônio atual: ${fmtCurrency(state.investments.reduce((s, i) => s + i.current, 0))}`;
    } else if (kind === "Gastos") {
      const accs = state.accounts.filter((a) => a.y === cursor.y && a.m === cursor.m);
      body = "Contas:\n" + accs.map((a) => `• ${a.name} (${a.category}) — ${fmtCurrency(a.value)} — ${a.status}`).join("\n");
      body += `\n\nFatura de cartões no mês: ${fmtCurrency(summary.cardExpense)}`;
      body += `\nTotal de contas: ${fmtCurrency(summary.accountsTotal)}`;
      body += `\nTotal de gastos: ${fmtCurrency(summary.totalExpenses)}`;
    } else if (kind === "Entradas") {
      const incs = state.incomes.filter((i) => i.y === cursor.y && i.m === cursor.m);
      body = incs.map((i) => `• ${i.payer} — ${i.description} — ${fmtCurrency(i.value)} — dia ${i.d}`).join("\n");
      body += `\n\nTotal recebido: ${fmtCurrency(summary.totalIncome)}`;
    } else {
      body = `Entradas: ${fmtCurrency(summary.totalIncome)}\nContas: ${fmtCurrency(summary.accountsTotal)}\nCartões: ${fmtCurrency(summary.cardExpense)}\nInvestido (patrimônio): ${fmtCurrency(state.investments.reduce((s, i) => s + i.current, 0))}\nSaldo do mês: ${fmtCurrency(summary.balance)}\nLimite utilizado: ${fmtCurrency(summary.usedLimit)}\nLimite disponível: ${fmtCurrency(summary.availableLimit)}`;
    }
    setReportTitle(`Relatório de ${kind} — ${ymLabel(cursor.y, cursor.m)}`);
    setReportText(header + body);
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: reportTitle, text: reportText });
      } else {
        await navigator.clipboard.writeText(reportText);
        showToast("Relatório copiado — cole no WhatsApp.");
      }
    } catch (e) { /* user cancelled share sheet */ }
  };

  const print = () => window.print();

  return (
    <div className="mb-page">
      <SectionTitle>Relatórios · {ymLabel(cursor.y, cursor.m)}</SectionTitle>
      <div className="mb-report-buttons">
        <button className="mb-btn-ghost" onClick={() => buildReport("Investimentos")}>PDF de investimentos</button>
        <button className="mb-btn-ghost" onClick={() => buildReport("Gastos")}>PDF de gastos</button>
        <button className="mb-btn-ghost" onClick={() => buildReport("Entradas")}>PDF de entradas</button>
        <button className="mb-btn-gold" onClick={() => buildReport("Completo")}>Relatório completo</button>
      </div>

      {reportText && (
        <div className="mb-panel mb-report-preview">
          <pre>{reportText}</pre>
          <div className="mb-report-actions">
            <button className="mb-btn-gold" onClick={share}><Share2 size={14} /> Compartilhar (WhatsApp)</button>
            <button className="mb-btn-ghost" onClick={print}><Printer size={14} /> Imprimir / salvar PDF</button>
          </div>
        </div>
      )}
      {!reportText && <Empty>Escolha um relatório acima para gerar a prévia.</Empty>}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Settings page                                                           */
/* ---------------------------------------------------------------------- */

function SettingsPage({ state, setState, resetAll, showToast }) {
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mariano-bank-backup.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setState((s) => ({ ...s, ...parsed }));
        showToast("Dados importados com sucesso.");
      } catch { showToast("Arquivo inválido."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mb-page">
      <SectionTitle>Configurações</SectionTitle>

      <div className="mb-panel">
        <div className="mb-settings-row">
          <div><div className="mb-list-title">Aparência</div><div className="mb-list-sub">Claro, escuro ou automático (segue o dispositivo)</div></div>
          <div className="mb-theme-toggle mb-theme-toggle-lg">
            <button className={state.theme === "light" ? "on" : ""} onClick={() => setState((s) => ({ ...s, theme: "light" }))}><Sun size={15} /> Claro</button>
            <button className={state.theme === "dark" ? "on" : ""} onClick={() => setState((s) => ({ ...s, theme: "dark" }))}><Moon size={15} /> Escuro</button>
            <button className={state.theme === "auto" ? "on" : ""} onClick={() => setState((s) => ({ ...s, theme: "auto" }))}><MonitorSmartphone size={15} /> Automático</button>
          </div>
        </div>
        <div className="mb-settings-row">
          <div><div className="mb-list-title">Moeda</div><div className="mb-list-sub">Padrão da primeira versão</div></div>
          <span className="mb-tag">R$ Real (BRL)</span>
        </div>
      </div>

      <div className="mb-panel">
        <SectionTitle>Dados</SectionTitle>
        <div className="mb-settings-row">
          <div><div className="mb-list-title">Backup</div><div className="mb-list-sub">Exportar todos os dados em um arquivo .json</div></div>
          <button className="mb-btn-ghost" onClick={exportData}><Download size={14} /> Exportar</button>
        </div>
        <div className="mb-settings-row">
          <div><div className="mb-list-title">Importação</div><div className="mb-list-sub">Restaurar dados a partir de um backup</div></div>
          <label className="mb-btn-ghost mb-file-btn"><Upload size={14} /> Importar<input type="file" accept="application/json" hidden onChange={importData} /></label>
        </div>
        <div className="mb-settings-row">
          <div><div className="mb-list-title">Restaurar padrão</div><div className="mb-list-sub">Apaga os dados atuais e recarrega os dados de exemplo</div></div>
          <button className="mb-btn-ghost danger" onClick={() => window.confirm("Isso vai apagar os dados atuais. Continuar?") && resetAll()}><RotateCcw size={14} /> Restaurar</button>
        </div>
      </div>
      <p className="mb-fineprint">Os dados são salvos automaticamente neste dispositivo/navegador. Use o backup para levar seus dados para outro aparelho.</p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Modal                                                                   */
/* ---------------------------------------------------------------------- */

function Modal({ title, children, onClose }) {
  return (
    <div className="mb-overlay" onClick={onClose}>
      <div className="mb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mb-modal-head"><h3>{title}</h3><button onClick={onClose}><X size={18} /></button></div>
        <div className="mb-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* CSS                                                                     */
/* ---------------------------------------------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

.mb-root {
  --font-ui: 'Inter', system-ui, sans-serif;
  --font-display: 'Fraunces', Georgia, serif;
  font-family: var(--font-ui);
  min-height: 100vh;
  display: flex;
  color: var(--text-primary);
  background: var(--bg);
}
.mb-root.theme-dark {
  --bg: #060810; --bg-elevated: #0D1220; --surface: #10182B; --surface-2: #161F35;
  --border: rgba(212,175,106,0.14); --text-primary: #F5F6F8; --text-secondary: #9AA3B8;
  --gold: #D4AF6A; --silver: #C7CDD9; --positive: #6FCF97; --negative: #E5697A;
}
.mb-root.theme-light {
  --bg: #F5F6F9; --bg-elevated: #FFFFFF; --surface: #FFFFFF; --surface-2: #EEF0F5;
  --border: rgba(10,15,30,0.09); --text-primary: #12141C; --text-secondary: #5B6478;
  --gold: #A67C2E; --silver: #6E7688; --positive: #1E8E5A; --negative: #C0394B;
}
.mb-root * { box-sizing: border-box; }

.mb-sidebar {
  width: 232px; flex-shrink: 0; background: var(--bg-elevated); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; padding: 28px 18px; position: sticky; top: 0; height: 100vh;
}
.mb-wordmark { display: flex; flex-direction: column; padding: 0 8px 28px; }
.mb-wordmark-main { font-family: var(--font-display); font-size: 22px; font-weight: 500; letter-spacing: 0.2px; }
.mb-wordmark-sub { font-size: 11px; letter-spacing: 4px; color: var(--gold); margin-top: 2px; }
.mb-nav-desktop { display: flex; flex-direction: column; gap: 3px; flex: 1; }
.mb-navitem {
  display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 10px; border: none;
  background: transparent; color: var(--text-secondary); font-size: 14px; font-family: var(--font-ui); cursor: pointer; text-align: left;
  transition: background .15s, color .15s;
}
.mb-navitem:hover { background: var(--surface-2); color: var(--text-primary); }
.mb-navitem.active { background: var(--surface-2); color: var(--gold); font-weight: 600; }
.mb-sidebar-foot { font-size: 11px; color: var(--text-secondary); padding: 0 8px; opacity: .7; }

.mb-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.mb-topbar {
  display: flex; align-items: center; justify-content: space-between; padding: 18px 28px;
  border-bottom: 1px solid var(--border); background: var(--bg); position: sticky; top: 0; z-index: 5;
}
.mb-month-switch { display: flex; align-items: center; gap: 12px; font-family: var(--font-display); font-size: 17px; }
.mb-month-switch button { background: var(--surface-2); border: none; border-radius: 8px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--text-primary); cursor: pointer; }
.mb-topbar-actions { display: flex; align-items: center; gap: 10px; }
.mb-farol { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 12px; border-radius: 9px; background: var(--surface-2); cursor: default; }
.mb-farol-label { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
.mb-farol-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.mb-farol-green .mb-farol-dot { background: var(--positive); }
.mb-farol-yellow .mb-farol-dot { background: #E0B84B; }
.mb-farol-red .mb-farol-dot { background: var(--negative); }
.mb-icon-btn { background: var(--surface-2); border: none; border-radius: 9px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; color: var(--text-primary); cursor: pointer; }
.mb-icon-btn.danger { color: var(--negative); background: transparent; }
.mb-theme-toggle { display: flex; background: var(--surface-2); border-radius: 9px; padding: 3px; gap: 2px; }
.mb-theme-toggle button { border: none; background: transparent; width: 30px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; }
.mb-theme-toggle button.on { background: var(--gold); color: #14161B; }
.mb-theme-toggle-lg button { width: auto; padding: 0 12px; gap: 6px; font-size: 13px; }

.mb-content { padding: 26px 28px 100px; overflow-y: auto; }
.mb-page { display: flex; flex-direction: column; gap: 20px; max-width: 1080px; }

.mb-section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
.mb-section-title h2 { font-family: var(--font-display); font-weight: 500; font-size: 19px; margin: 0; }

.mb-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
.mb-stat-grid-3 { grid-template-columns: repeat(3, 1fr); }
.mb-stat-grid-2 { grid-template-columns: repeat(2, 1fr); }
.mb-stat-grid-1 { grid-template-columns: 1fr; max-width: 280px; }
.mb-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.mb-stat-top { display: flex; align-items: center; justify-content: space-between; color: var(--text-secondary); }
.mb-stat-label { font-size: 12.5px; }
.mb-stat-value { font-family: var(--font-display); font-size: 21px; font-weight: 500; }
.mb-stat-hint { font-size: 11.5px; color: var(--text-secondary); }
.mb-stat-gold .mb-stat-value { color: var(--gold); }
.mb-stat-silver .mb-stat-value { color: var(--silver); }
.mb-stat-positive .mb-stat-value { color: var(--positive); }
.mb-stat-negative .mb-stat-value { color: var(--negative); }

.mb-grid-2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
.mb-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }

.mb-donut-wrap { position: relative; display: flex; justify-content: center; margin: 4px 0 10px; }
.mb-donut-label { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; }
.mb-donut-label strong { font-family: var(--font-display); font-size: 20px; }
.mb-donut-label span { font-size: 10.5px; color: var(--text-secondary); }

.mb-card-mini-list { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
.mb-card-mini-top { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px; color: var(--text-secondary); }
.mb-progress { height: 6px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
.mb-progress-fill { height: 100%; border-radius: 4px; transition: width .3s; }

.mb-list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.mb-list-row { display: flex; align-items: center; gap: 12px; padding: 10px 4px; border-bottom: 1px solid var(--border); }
.mb-list-row:last-child { border-bottom: none; }
.mb-list-icon { width: 30px; height: 30px; border-radius: 9px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; color: var(--gold); flex-shrink: 0; }
.mb-list-main { flex: 1; min-width: 0; }
.mb-list-title { font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.mb-list-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.mb-list-value { font-family: var(--font-display); font-size: 15px; white-space: nowrap; }
.mb-tag { font-size: 10.5px; padding: 2px 8px; border-radius: 20px; background: var(--surface-2); color: var(--text-secondary); }

.mb-status-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border); background: transparent; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; }
.mb-status-dot.paid { background: var(--positive); border-color: var(--positive); }

.mb-cards-row { display: flex; gap: 16px; flex-wrap: wrap; }
.mb-bankcard { width: 270px; border-radius: 18px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.18); border: 2px solid transparent; transition: transform .15s; }
.mb-bankcard:hover { transform: translateY(-2px); }
.mb-bankcard.selected { border-color: var(--gold); }
.mb-bankcard-top { display: flex; flex-direction: column; gap: 8px; }
.mb-bankcard-brand { font-size: 10px; letter-spacing: 2.5px; opacity: .75; }
.mb-bankcard-name { font-family: var(--font-display); font-size: 17px; }
.mb-bankcard-mid { display: flex; justify-content: space-between; font-size: 12px; }
.mb-bankcard-mid strong { display: block; font-family: var(--font-display); font-size: 15px; margin-top: 2px; }
.mb-bankcard-foot { display: flex; justify-content: space-between; font-size: 11px; opacity: .8; }

.mb-income-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.mb-income-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 12px; }
.mb-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #14161B; font-weight: 700; flex-shrink: 0; }
.mb-income-body { flex: 1; min-width: 0; }
.mb-income-value { font-family: var(--font-display); font-size: 14px; white-space: nowrap; }

.mb-invest-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; }
.mb-invest-card { display: flex; flex-direction: column; gap: 10px; }
.mb-invest-head { display: flex; justify-content: space-between; align-items: flex-start; }

.mb-total-hero { display: flex; flex-direction: column; align-items: center; padding: 30px 20px; gap: 6px; text-align: center; }
.mb-total-hero-label { font-size: 13px; color: var(--text-secondary); }
.mb-total-hero-value { font-family: var(--font-display); font-size: 40px; }
.mb-total-hero-value.positive { color: var(--positive); }
.mb-total-hero-value.negative { color: var(--negative); }
.mb-total-hero-hint { font-size: 12px; color: var(--text-secondary); }
.mb-breakdown-row { display: flex; justify-content: space-between; padding: 11px 2px; border-bottom: 1px solid var(--border); font-size: 14px; }
.mb-breakdown-row:last-child { border-bottom: none; }
.mb-breakdown-value.positive { color: var(--positive); }
.mb-breakdown-value.negative { color: var(--negative); }

.mb-report-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
.mb-report-preview pre { white-space: pre-wrap; font-family: var(--font-ui); font-size: 13px; line-height: 1.6; color: var(--text-primary); }
.mb-report-actions { display: flex; gap: 10px; margin-top: 14px; }

.mb-settings-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 2px; border-bottom: 1px solid var(--border); gap: 12px; }
.mb-settings-row:last-child { border-bottom: none; }
.mb-file-btn { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.mb-fineprint { font-size: 12px; color: var(--text-secondary); }

.mb-btn-gold, .mb-btn-ghost {
  font-family: var(--font-ui); font-size: 13.5px; font-weight: 600; border-radius: 10px; padding: 9px 16px;
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer; border: 1px solid transparent; white-space: nowrap;
}
.mb-btn-gold { background: var(--gold); color: #14161B; }
.mb-btn-ghost { background: transparent; border-color: var(--border); color: var(--text-primary); }
.mb-btn-ghost.danger { color: var(--negative); }
.mb-btn-block { width: 100%; justify-content: center; }

.mb-empty { color: var(--text-secondary); font-size: 13.5px; padding: 18px 4px; }

.mb-overlay { position: fixed; inset: 0; background: rgba(4,6,12,.55); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
.mb-modal { background: var(--bg-elevated); border-radius: 18px; width: 100%; max-width: 440px; max-height: 86vh; overflow-y: auto; border: 1px solid var(--border); }
.mb-modal-head { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid var(--border); }
.mb-modal-head h3 { font-family: var(--font-display); font-weight: 500; font-size: 17px; margin: 0; }
.mb-modal-head button { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
.mb-modal-body { padding: 20px; }

.mb-form { display: flex; flex-direction: column; gap: 14px; }
.mb-form label { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; color: var(--text-secondary); }
.mb-form input, .mb-form select { background: var(--surface-2); border: 1px solid var(--border); border-radius: 9px; padding: 9px 11px; font-size: 14px; color: var(--text-primary); font-family: var(--font-ui); }
.mb-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mb-hint { color: var(--gold); font-size: 12px; margin-top: 4px; }
.mb-color-row { display: flex; gap: 8px; flex-wrap: wrap; }
.mb-swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.mb-swatch.on { border-color: var(--gold); }
.mb-toggle-row { display: flex; gap: 8px; }
.mb-toggle-row button { flex: 1; padding: 9px; border-radius: 9px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-secondary); cursor: pointer; font-family: var(--font-ui); font-weight: 600; font-size: 13px; }
.mb-toggle-row button.on { background: var(--gold); color: #14161B; border-color: var(--gold); }
.mb-inline-form { display: flex; gap: 8px; }
.mb-inline-form input { flex: 1; background: var(--surface-2); border: 1px solid var(--border); border-radius: 9px; padding: 8px 10px; color: var(--text-primary); }

.mb-search-panel { background: var(--bg-elevated); width: 100%; max-width: 520px; border-radius: 16px; border: 1px solid var(--border); overflow: hidden; }
.mb-search-input { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
.mb-search-input input { flex: 1; background: none; border: none; outline: none; color: var(--text-primary); font-size: 14px; }
.mb-search-input button { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
.mb-search-results { max-height: 320px; overflow-y: auto; padding: 8px 10px; }
.mb-search-row { display: flex; align-items: center; gap: 10px; padding: 10px 8px; border-radius: 10px; }
.mb-search-row:hover { background: var(--surface-2); }
.mb-search-title { font-size: 13.5px; }
.mb-search-sub { font-size: 11.5px; color: var(--text-secondary); }

.mb-tooltip { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
.mb-tooltip-label { font-weight: 600; margin-bottom: 4px; }

.mb-toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: var(--gold); color: #14161B; padding: 10px 18px; border-radius: 30px; font-size: 13px; font-weight: 600; z-index: 100; box-shadow: 0 8px 24px rgba(0,0,0,.3); }

.mb-nav-mobile { display: none; }

@media (max-width: 900px) {
  .mb-grid-2 { grid-template-columns: 1fr; }
  .mb-stat-grid-3 { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 860px) {
  .mb-sidebar { display: none; }
  .mb-content { padding: 18px 16px 90px; }
  .mb-topbar { padding: 14px 16px; }
  .mb-nav-mobile {
    display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg-elevated);
    border-top: 1px solid var(--border); z-index: 40; padding: 6px 4px 10px;
  }
  .mb-nav-mobile button {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none;
    color: var(--text-secondary); font-size: 10px; padding: 6px 2px; cursor: pointer; font-family: var(--font-ui);
  }
  .mb-nav-mobile button.active { color: var(--gold); }
  .mb-stat-grid-3 { grid-template-columns: 1fr; }
  .mb-farol { padding: 0 9px; }
  .mb-farol-label { display: none; }
}

@media print {
  .mb-sidebar, .mb-topbar, .mb-nav-mobile, .mb-report-actions { display: none !important; }
  .mb-root { background: #fff; color: #000; }
}
`;
