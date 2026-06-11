import { useState, useEffect } from "react";

// ── Frequency multiplier map ──────────────────────────────────────────────────
const FREQUENCY_MAP = {
  "one time": 1,
  "monthly for 1 year": 12,
  "quarterly for 1 year": 4,
  "half yearly for 1 year": 2,
  "annually for 2 years": 2,
};

function parseAmount(raw) {
  if (!raw) return 0;
  const digits = String(raw).replace(/[^\d]/g, "");
  return parseInt(digits, 10) || 0;
}

function calcTotal(amount, frequency) {
  const key = String(frequency).toLowerCase().trim();
  const multiplier = FREQUENCY_MAP[key] ?? 1;
  return amount * multiplier;
}

function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

// ── Milestone definitions (open-ended, every ₹1L) ────────────────────────────
const MILESTONES = [
  { amount: 1,       emoji: "🌱", label: "First Gift",  sub: "The Trust is Born!" },
  { amount: 100000,  emoji: "⚡", label: "Spark",        sub: "The Fire is Lit!" },
  { amount: 200000,  emoji: "🔥", label: "Flame",        sub: "Growing Strong!" },
  { amount: 500000,  emoji: "🚀", label: "Momentum",     sub: "Unstoppable!" },
  { amount: 1000000, emoji: "💎", label: "Legacy",       sub: "Making History!" },
  { amount: 2500000, emoji: "🏆", label: "Legend",       sub: "SREC AA Legend!" },
];

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split("\t").map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cols = line.split("\t");
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || "").trim(); });
    return row;
  });
}

// ── Demo data (used when CSV fetch fails) ─────────────────────────────────────
const DEMO_ROWS = [
  { department: "EEE", amount: "10000", frequency: "One time" },
  { department: "EEE", amount: "25000", frequency: "Annually for 2 years" },
  { department: "CSE", amount: "15000", frequency: "Monthly for 1 year" },
  { department: "CSE", amount: "8000",  frequency: "Quarterly for 1 year" },
  { department: "MECH", amount: "20000", frequency: "Half yearly for 1 year" },
  { department: "ECE", amount: "5000",  frequency: "One time" },
  { department: "IT",  amount: "12000", frequency: "Annually for 2 years" },
  { department: "CIVIL", amount: "9000", frequency: "Monthly for 1 year" },
];

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [donors, setDonors]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    // Replace this URL with your published Google Sheet CSV link
    const CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwBTyjWfaOU-_HSA3HUczH1ymCaLcwalrNLJl9u_flYRFnzhEG6dHpjAhUGwXS54awYiu-MnB1_Tx1/pub?gid=1597682582&single=true&output=tsv";

    fetch(CSV_URL)
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.text(); })
      .then(text => {
        const rows = parseCSV(text);
        const processed = rows
          .map(r => ({
            department: (r["department"] || "Unknown").trim().toUpperCase(),
            amount:     parseAmount(r["amount"]),
            frequency:  r["frequency"] || "One time",
            totalPledge: calcTotal(parseAmount(r["amount"]), r["frequency"]),
          }))
          .filter(r => r.amount > 0);
        setDonors(processed);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to demo data
        const processed = DEMO_ROWS.map(r => ({
          department: r.department.toUpperCase(),
          amount: parseAmount(r.amount),
          frequency: r.frequency,
          totalPledge: calcTotal(parseAmount(r.amount), r.frequency),
        }));
        setDonors(processed);
        setUsingDemo(true);
        setLoading(false);
      });
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalPledged  = donors.reduce((s, d) => s + d.totalPledge, 0);
  const totalDonors   = donors.length;
  const totalDepts    = new Set(donors.map(d => d.department)).size;

  // Donor leaderboard
  const donorRanks = [...donors]
    .sort((a, b) => b.totalPledge - a.totalPledge)
    .map((d, i) => ({ ...d, rank: i + 1 }));

  // Department leaderboard
  const deptMap = {};
  donors.forEach(d => {
    if (!deptMap[d.department]) deptMap[d.department] = { total: 0, count: 0 };
    deptMap[d.department].total += d.totalPledge;
    deptMap[d.department].count += 1;
  });
  const deptRanks = Object.entries(deptMap)
    .map(([dept, v]) => ({ dept, ...v }))
    .sort((a, b) => b.total - a.total)
    .map((d, i) => ({ ...d, rank: i + 1 }));

  // Milestones
  const unlockedMilestones = MILESTONES.filter(m => totalPledged >= m.amount);
  const lockedMilestones   = MILESTONES.filter(m => totalPledged < m.amount);

  const rankMedal = (r) => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`;

  if (loading) return (
    <div style={styles.loader}>
      <div style={styles.loaderDot} />
      <p style={{ color: "#94a3b8", marginTop: 16, fontFamily: "Inter, sans-serif" }}>Loading donor data…</p>
    </div>
  );

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>SREC Alumni Association</h1>
          <h1 style={styles.title}>Charitable Trust</h1>
          <p style={styles.subtitle}>Every rupee plants a future. Every donor shapes a legacy.</p>
          {usingDemo && (
            <div style={styles.demoBanner}>
              ⚠️ Live sheet not yet connected — showing demo data.
              <br/>Publish your Google Sheet as TSV and update the CSV_URL in the code.
            </div>
          )}
        </div>
      </header>

      {/* ── Stats Ticker ── */}
      <section style={styles.ticker}>
        <Stat icon="💰" label="Total Pledged"   value={formatINR(totalPledged)} />
        <div style={styles.tickerDivider} />
        <Stat icon="👥" label="Total Donors"    value={totalDonors} />
        <div style={styles.tickerDivider} />
        <Stat icon="🏛️" label="Departments"     value={totalDepts} />
      </section>

      <main style={styles.main}>

        {/* ── Milestones ── */}
        <section style={styles.section}>
          <SectionLabel>Milestones</SectionLabel>
          <div style={styles.milestoneGrid}>
            {unlockedMilestones.map(m => (
              <div key={m.label} style={{ ...styles.badge, ...styles.badgeUnlocked }}>
                <span style={styles.badgeEmoji}>{m.emoji}</span>
                <span style={styles.badgeName}>{m.label}</span>
                <span style={styles.badgeSub}>{m.sub}</span>
              </div>
            ))}
            {lockedMilestones.map(m => (
              <div key={m.label} style={{ ...styles.badge, ...styles.badgeLocked }}>
                <span style={{ ...styles.badgeEmoji, filter: "grayscale(1)", opacity: 0.4 }}>{m.emoji}</span>
                <span style={{ ...styles.badgeName, opacity: 0.4 }}>{m.label}</span>
                <span style={{ ...styles.badgeSub, opacity: 0.35 }}>{formatINR(m.amount)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Donor Leaderboard ── */}
        <section style={styles.section}>
          <SectionLabel>Donor Leaderboard</SectionLabel>
          <p style={styles.sectionNote}>All donors are anonymous — ranked by total pledge value.</p>
          <div style={styles.table}>
            <div style={{ ...styles.tableRow, ...styles.tableHeader }}>
              <span>Rank</span>
              <span>Total Pledge</span>
              <span>Frequency</span>
            </div>
            {donorRanks.map((d, i) => (
              <div key={i} style={{
                ...styles.tableRow,
                ...(i % 2 === 0 ? styles.tableRowEven : {}),
                ...(d.rank <= 3 ? styles.tableRowTop : {}),
              }}>
                <span style={styles.rankCell}>{rankMedal(d.rank)}</span>
                <span style={styles.amountCell}>{formatINR(d.totalPledge)}</span>
                <span style={styles.freqCell}>{d.frequency}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Department Leaderboard ── */}
        <section style={styles.section}>
          <SectionLabel>Department Leaderboard</SectionLabel>
          <p style={styles.sectionNote}>Which department leads the mission?</p>
          <div style={styles.table}>
            <div style={{ ...styles.tableRow, ...styles.tableHeader }}>
              <span>Rank</span>
              <span>Department</span>
              <span>Total Pledged</span>
              <span>Donors</span>
            </div>
            {deptRanks.map((d, i) => (
              <div key={d.dept} style={{
                ...styles.tableRow,
                ...(i % 2 === 0 ? styles.tableRowEven : {}),
                ...(d.rank <= 3 ? styles.tableRowTop : {}),
              }}>
                <span style={styles.rankCell}>{rankMedal(d.rank)}</span>
                <span style={styles.deptCell}>{d.dept}</span>
                <span style={styles.amountCell}>{formatINR(d.total)}</span>
                <span style={styles.countCell}>{d.count} donor{d.count > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={styles.cta}>
          <p style={styles.ctaText}>Ready to make your mark?</p>
          <a
            href="https://forms.gle/EzPV9QR5soqMAAMJ8"
            target="_blank"
            rel="noreferrer"
            style={styles.ctaBtn}
          >
            Join the Mission →
          </a>
        </section>
      </main>

      <footer style={styles.footer}>
        <p>© 2026 SREC Alumni Association Charitable Trust · Built with ❤️ for our students</p>
      </footer>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={styles.statBox}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={styles.sectionLabelWrap}>
      <span style={styles.sectionLabel}>{children}</span>
      <div style={styles.sectionLine} />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const GOLD   = "#C9962B";
const DEEP   = "#0B1426";
const CARD   = "#111827";
const BORDER = "#1E2D45";
const TEXT   = "#E2E8F0";
const MUTED  = "#64748B";
const GREEN  = "#10B981";

const styles = {
  root: {
    minHeight: "100vh",
    background: DEEP,
    color: TEXT,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  loader: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    minHeight: "100vh", background: DEEP,
  },
  loaderDot: {
    width: 48, height: 48, borderRadius: "50%",
    border: `4px solid ${BORDER}`,
    borderTopColor: GOLD,
    animation: "spin 1s linear infinite",
  },
  header: {
    background: `linear-gradient(135deg, #0B1426 0%, #0F2040 60%, #1a0e00 100%)`,
    borderBottom: `1px solid ${BORDER}`,
    padding: "48px 24px 40px",
    textAlign: "center",
  },
  headerInner: { maxWidth: 640, margin: "0 auto" },
  eyebrow: {
    fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
    color: GOLD, marginBottom: 12, fontWeight: 600,
  },
  title: {
    fontSize: "clamp(28px, 6vw, 48px)",
    fontWeight: 800, margin: "0 0 12px",
    background: `linear-gradient(135deg, #fff 30%, ${GOLD})`,
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    lineHeight: 1.1,
  },
  subtitle: { fontSize: 15, color: "#94a3b8", margin: 0 },
  demoBanner: {
    marginTop: 20, padding: "10px 16px",
    background: "#1a1000", border: `1px solid #5a3a00`,
    borderRadius: 8, fontSize: 12, color: "#f59e0b", lineHeight: 1.6,
  },
  ticker: {
    display: "flex", justifyContent: "center", alignItems: "center",
    flexWrap: "wrap", gap: 0,
    background: CARD, borderBottom: `1px solid ${BORDER}`,
    padding: "20px 24px",
  },
  tickerDivider: {
    width: 1, height: 48, background: BORDER,
    margin: "0 32px",
  },
  statBox: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: 800, color: GOLD },
  statLabel: { fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" },
  main: { maxWidth: 800, margin: "0 auto", padding: "40px 20px" },
  section: { marginBottom: 48 },
  sectionLabelWrap: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
    textTransform: "uppercase", color: GOLD, whiteSpace: "nowrap",
  },
  sectionLine: { flex: 1, height: 1, background: BORDER },
  sectionNote: { fontSize: 13, color: MUTED, marginBottom: 16, marginTop: -8 },
  milestoneGrid: {
    display: "flex", flexWrap: "wrap", gap: 12,
  },
  badge: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "16px 20px", borderRadius: 12, minWidth: 100, flex: "1 1 100px",
    textAlign: "center", gap: 4,
  },
  badgeUnlocked: {
    background: `linear-gradient(135deg, #1a1200 0%, #2a1e00 100%)`,
    border: `1px solid ${GOLD}`,
    boxShadow: `0 0 16px rgba(201,150,43,0.15)`,
  },
  badgeLocked: {
    background: CARD, border: `1px solid ${BORDER}`,
  },
  badgeEmoji: { fontSize: 28 },
  badgeName: { fontSize: 12, fontWeight: 700, color: TEXT },
  badgeSub: { fontSize: 11, color: MUTED },
  table: { borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}` },
  tableHeader: {
    background: "#0d1929", color: MUTED,
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "60px 1fr 1fr",
    alignItems: "center",
    padding: "14px 20px",
    borderBottom: `1px solid ${BORDER}`,
    fontSize: 14, gap: 8,
  },
  tableRowEven: { background: "rgba(255,255,255,0.02)" },
  tableRowTop: { background: "rgba(201,150,43,0.06)" },
  rankCell: { fontWeight: 700, fontSize: 16 },
  amountCell: { fontWeight: 700, color: GREEN },
  freqCell: { color: MUTED, fontSize: 12 },
  deptCell: { fontWeight: 700, color: TEXT },
  countCell: { color: MUTED, fontSize: 12 },
  cta: {
    textAlign: "center", padding: "48px 24px",
    background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`,
    marginTop: 16,
  },
  ctaText: { fontSize: 18, fontWeight: 700, marginBottom: 20, color: TEXT },
  ctaBtn: {
    display: "inline-block", padding: "14px 36px",
    background: `linear-gradient(135deg, ${GOLD}, #e6b033)`,
    color: "#000", fontWeight: 800, fontSize: 15,
    borderRadius: 8, textDecoration: "none",
    letterSpacing: "0.02em",
  },
  footer: {
    textAlign: "center", padding: "24px",
    borderTop: `1px solid ${BORDER}`,
    fontSize: 12, color: MUTED,
  },
};
