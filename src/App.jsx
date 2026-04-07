import { useState, useMemo, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const EDU_INF = 0.10;
const STD_INF = 0.06;
const RETURN = 0.12;
const STEP_UP = 0.10;
const BASE_COLLEGE = 2000000;
const SIP_CAP = 30;
const GOAL_TYPES = ["Foreign Trip", "New Car", "Home Down Payment", "Big Purchase"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (!n || isNaN(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

const fmtAx = (n) => {
  if (!n || isNaN(n)) return "0";
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(0)}L`;
  return Math.round(n).toLocaleString("en-IN");
};

const toVal = (v, u) => {
  const n = parseFloat(v) || 0;
  return u === "crore" ? n * 10000000 : n * 100000;
};

const calcSIP = (fv, years) => {
  if (years <= 0 || fv <= 0) return 0;
  const n = Math.min(years, SIP_CAP);
  const r = RETURN / 12;
  const N = n * 12;
  const A = (1 - Math.pow(1 + r, -12)) / r;
  const X = (1 + STEP_UP) / Math.pow(1 + r, 12);
  const S = Math.abs(X - 1) < 1e-9 ? n : (1 - Math.pow(X, n)) / (1 - X);
  const D = A * Math.pow(1 + r, N) * S;
  return D > 0 ? fv / D : 0;
};

// ─── All components DEFINED AT MODULE LEVEL (never inside App) ────────────────

const Blank = ({ value, onChange, width }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="__"
    style={{
      background: "transparent",
      border: "none",
      borderBottom: "2px solid rgba(234,88,12,0.4)",
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 600,
      color: "#ea580c",
      fontSize: "inherit",
      textAlign: "center",
      width: width || "54px",
      outline: "none",
      padding: "0 4px 2px",
      verticalAlign: "baseline",
    }}
  />
);

const MoneyBlank = ({ val, unit, onVal, onUnit }) => {
  const dynW = Math.max(54, (String(val).length || 1) * 13 + 20);
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
      <input
        value={val}
        onChange={(e) => onVal(e.target.value)}
        placeholder="__"
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "2px solid rgba(234,88,12,0.4)",
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 600,
          color: "#ea580c",
          fontSize: "inherit",
          textAlign: "center",
          width: `${dynW}px`,
          outline: "none",
          padding: "0 4px 2px",
          verticalAlign: "baseline",
        }}
      />
      <button
        onClick={() => onUnit(unit === "lakh" ? "crore" : "lakh")}
        style={{
          background: "transparent",
          border: "none",
          color: "#ea580c",
          fontFamily: "Helvetica Neue, Arial, sans-serif",
          fontSize: "0.6em",
          fontWeight: 700,
          cursor: "pointer",
          padding: "0 2px",
          verticalAlign: "super",
          lineHeight: 1,
        }}
      >
        {unit === "lakh" ? "L↕" : "Cr↕"}
      </button>
    </span>
  );
};

const Toggle = ({ options, value, onChange }) => (
  <span style={{ display: "inline-flex", gap: 4, verticalAlign: "middle" }}>
    {options.map((o) => (
      <button
        key={o.v}
        onClick={() => onChange(o.v)}
        style={{
          padding: "3px 14px",
          borderRadius: 20,
          border: "1.5px solid #ea580c",
          background: value === o.v ? "#ea580c" : "transparent",
          color: value === o.v ? "#fff" : "#ea580c",
          fontFamily: "Helvetica Neue, Arial, sans-serif",
          fontSize: "0.82em",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {o.l}
      </button>
    ))}
  </span>
);

const NumToggle = ({ min, max, value, onChange }) => (
  <span style={{ display: "inline-flex", gap: 6, verticalAlign: "middle" }}>
    {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
      <button
        key={n}
        onClick={() => onChange(n)}
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          border: "1.5px solid #ea580c",
          background: value === n ? "#ea580c" : "transparent",
          color: value === n ? "#fff" : "#ea580c",
          fontFamily: "Georgia, serif",
          fontSize: "0.95em",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {n}
      </button>
    ))}
  </span>
);

const HintText = ({ children, color }) => (
  <div
    style={{
      fontFamily: "Helvetica Neue, Arial, sans-serif",
      fontSize: "0.78em",
      color: color || "#92400e",
      marginTop: 8,
      padding: "5px 14px",
      background: "rgba(234,88,12,0.06)",
      borderRadius: 8,
      display: "inline-block",
      lineHeight: 1.5,
    }}
  >
    {children}
  </div>
);

const Prose = ({ children }) => (
  <p
    style={{
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: "1.15rem",
      lineHeight: 2.15,
      color: "#1c1410",
      margin: 0,
    }}
  >
    {children}
  </p>
);

const Card = ({ children, tint }) => (
  <div
    style={{
      background: tint || "#fff",
      borderRadius: 18,
      padding: "26px 30px",
      boxShadow: "0 2px 24px rgba(0,0,0,0.055)",
      marginBottom: 16,
      border: "1px solid rgba(234,88,12,0.07)",
    }}
  >
    {children}
  </div>
);

const Sec = ({ children, tint, title }) => (
  <div
    style={{
      background: tint || "#fafafa",
      borderRadius: 20,
      padding: "26px 28px",
      marginBottom: 18,
      border: "1px solid rgba(0,0,0,0.04)",
    }}
  >
    {title && (
      <div
        style={{
          fontFamily: "Helvetica Neue, Arial, sans-serif",
          fontSize: "0.7em",
          fontWeight: 700,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: "#92400e",
          marginBottom: 16,
        }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);

const HealthCard = ({ icon, label, value, sub, color }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.045)",
      borderRadius: 16,
      padding: "18px 16px",
      border: `1px solid ${color}40`,
      flex: 1,
      minWidth: 0,
    }}
  >
    <div style={{ fontSize: "1.3em", marginBottom: 6 }}>{icon}</div>
    <div
      style={{
        fontFamily: "Helvetica Neue, Arial, sans-serif",
        fontSize: "0.64em",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: "Georgia, serif",
        fontSize: "1.15em",
        fontWeight: 700,
        color: "#fff",
        marginBottom: 4,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontFamily: "Helvetica Neue, Arial, sans-serif",
        fontSize: "0.68em",
        color: "rgba(255,255,255,0.42)",
        lineHeight: 1.4,
      }}
    >
      {sub}
    </div>
  </div>
);

const BarChart = ({ flows, currentAge }) => {
  const maxYear = 40;
  const byYear = {};
  flows.forEach((f) => {
    const y = Math.round(f.year);
    if (y > 0 && y <= maxYear) {
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(f);
    }
  });

  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  if (!years.length) return null;

  const totals = years.map((y) =>
    byYear[y].reduce((s, f) => s + f.fv, 0)
  );
  const maxVal = Math.max(...totals, 1);

  const W = 580;
  const H = 160;
  const PAD_L = 44;
  const PAD_B = 36;
  const chartW = W - PAD_L - 10;
  const barW = Math.max(10, Math.min(32, chartW / years.length - 5));
  const spacing = chartW / years.length;

  const yLine = (v) => H - (v / maxVal) * H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + PAD_B}`}
      style={{ width: "100%", height: "auto" }}
    >
      {[0, 0.5, 1].map((frac, i) => {
        const y = yLine(frac * maxVal);
        return (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={y}
              x2={W - 10}
              y2={y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={y + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.28)"
              fontSize={9}
              fontFamily="Helvetica Neue, Arial, sans-serif"
            >
              {frac === 0 ? "0" : fmtAx(frac * maxVal)}
            </text>
          </g>
        );
      })}

      {years.map((yr, i) => {
        const cx = PAD_L + i * spacing + spacing / 2;
        let stackY = H;
        return (
          <g key={yr}>
            {byYear[yr].map((f, j) => {
              const h = Math.max(3, (f.fv / maxVal) * H);
              stackY -= h;
              const isRetire = f.type === "retirement";
              const fill = isRetire ? "#fb923c" : "#c7d2fe";
              return (
                <rect
                  key={j}
                  x={cx - barW / 2}
                  y={stackY}
                  width={barW}
                  height={h}
                  fill={fill}
                  rx={3}
                  opacity={0.9}
                />
              );
            })}
            <text
              x={cx}
              y={H + 14}
              textAnchor="middle"
              fill="rgba(255,255,255,0.45)"
              fontSize={8}
              fontFamily="Helvetica Neue, Arial, sans-serif"
            >
              Yr {yr}
            </text>
            <text
              x={cx}
              y={H + 26}
              textAnchor="middle"
              fill="rgba(255,255,255,0.22)"
              fontSize={7.5}
              fontFamily="Helvetica Neue, Arial, sans-serif"
            >
              {currentAge + yr}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const GoalLine = ({ goal, idx, onChange, onRemove }) => (
  <div
    style={{
      marginBottom: 22,
      paddingBottom: 22,
      borderBottom: "1px solid rgba(234,88,12,0.09)",
    }}
  >
    <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
      {GOAL_TYPES.map((t) => (
        <button
          key={t}
          onClick={() => onChange(idx, "type", t)}
          style={{
            padding: "3px 12px",
            borderRadius: 16,
            border: "1.5px solid #ea580c",
            background: goal.type === t ? "#ea580c" : "transparent",
            color: goal.type === t ? "#fff" : "#ea580c",
            fontFamily: "Helvetica Neue, Arial, sans-serif",
            fontSize: "0.72em",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t}
        </button>
      ))}
    </div>
    <Prose>
      We're saving for{" "}
      <span style={{ color: "#ea580c", fontWeight: 700 }}>{goal.type}</span>,
      about{" "}
      <MoneyBlank
        val={goal.amt}
        unit={goal.unit}
        onVal={(v) => onChange(idx, "amt", v)}
        onUnit={(u) => onChange(idx, "unit", u)}
      />
      ,{" "}
      <Toggle
        options={[
          { v: "once", l: "once" },
          { v: "every", l: "every" },
        ]}
        value={goal.freq}
        onChange={(v) => onChange(idx, "freq", v)}
      />{" "}
      in{" "}
      <Blank
        value={goal.yrs}
        onChange={(v) => onChange(idx, "yrs", v)}
        width="44px"
      />{" "}
      yrs.
    </Prose>
    <button
      onClick={() => onRemove(idx)}
      style={{
        background: "none",
        border: "none",
        color: "rgba(234,88,12,0.38)",
        fontFamily: "Helvetica Neue, Arial, sans-serif",
        fontSize: "0.74em",
        cursor: "pointer",
        marginTop: 6,
        padding: 0,
      }}
    >
      remove
    </button>
  </div>
);

const StepDots = ({ current }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
    {[1, 2, 3].map((s) => (
      <div
        key={s}
        style={{
          width: s === current ? 28 : 8,
          height: 8,
          borderRadius: 4,
          background: s <= current ? "#ea580c" : "rgba(234,88,12,0.18)",
          transition: "all 0.3s ease",
        }}
      />
    ))}
    <span
      style={{
        fontFamily: "Helvetica Neue, Arial, sans-serif",
        fontSize: "0.73em",
        color: "#92400e",
        marginLeft: 6,
        letterSpacing: "0.06em",
      }}
    >
      {current === 1 ? "The Baseline" : current === 2 ? "Life Goals" : "Your Plan"}
    </span>
  </div>
);

const CTABtn = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled
        ? "rgba(234,88,12,0.18)"
        : "linear-gradient(135deg, #f97316, #ea580c, #dc2626)",
      color: disabled ? "#ea580c" : "#fff",
      border: "none",
      borderRadius: 50,
      padding: "15px 38px",
      fontFamily: "Helvetica Neue, Arial, sans-serif",
      fontSize: "0.95rem",
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: disabled ? "none" : "0 6px 28px rgba(234,88,12,0.3)",
      letterSpacing: "0.02em",
      transition: "all 0.2s",
    }}
  >
    {children}
  </button>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);

  // Step 1
  const [inc, setInc] = useState({ v: "", u: "lakh" });
  const [exp, setExp] = useState({ v: "", u: "lakh" });
  const [sav, setSav] = useState({ v: "", u: "lakh" });
  const [age, setAge] = useState("");

  // Step 2
  const [rTog, setRTog] = useState("do");
  const [rAge, setRAge] = useState("");
  const [rInc, setRInc] = useState({ v: "", u: "lakh" });
  const [kTog, setKTog] = useState("plan");
  const [nKid, setNKid] = useState(1);
  const [kYrs, setKYrs] = useState(["", "", ""]);
  const [goals, setGoals] = useState([]);

  // Derived base values
  const incV = useMemo(() => toVal(inc.v, inc.u), [inc]);
  const expV = useMemo(() => toVal(exp.v, exp.u), [exp]);
  const savV = useMemo(() => toVal(sav.v, sav.u), [sav]);
  const ageN = useMemo(() => parseInt(age) || 0, [age]);
  const rAgeN = useMemo(() => parseInt(rAge) || 0, [rAge]);
  const rIncV = useMemo(() => toVal(rInc.v, rInc.u), [rInc]);

  // Flows
  const flows = useMemo(() => {
    const f = [];

    if (rTog === "do" && rAgeN > ageN && rIncV > 0) {
      const yrs = rAgeN - ageN;
      const futureMonthly = rIncV * Math.pow(1.06, yrs);
      const corpus = futureMonthly * 300;
      f.push({
        type: "retirement",
        label: `Retire at ${rAgeN}`,
        year: yrs,
        fv: corpus,
        years: yrs,
        inSIP: true,
      });
    }

    if (kTog === "plan") {
      for (let c = 0; c < nKid; c++) {
        const birthYrs = parseFloat(kYrs[c]) || 0;
        if (birthYrs > 0) {
          const eduYrs = birthYrs + 18;
          const fv = BASE_COLLEGE * Math.pow(1 + EDU_INF, eduYrs);
          f.push({
            type: "education",
            label: `Child ${c + 1} — College`,
            year: eduYrs,
            fv,
            years: eduYrs,
            inSIP: true,
          });
        }
      }
    }

    goals.forEach((g) => {
      const gAmt = toVal(g.amt, g.unit);
      const gYrs = parseFloat(g.yrs) || 0;
      if (gAmt > 0 && gYrs > 0) {
        if (g.freq === "once") {
          const fv = gAmt * Math.pow(1 + STD_INF, gYrs);
          f.push({
            type: "goal",
            label: g.type,
            year: gYrs,
            fv,
            years: gYrs,
            inSIP: gYrs <= SIP_CAP,
          });
        } else {
          for (let k = 1; k * gYrs <= 40; k++) {
            const y = k * gYrs;
            const fv = gAmt * Math.pow(1 + STD_INF, y);
            f.push({
              type: "goal",
              label: `${g.type} #${k}`,
              year: y,
              fv,
              years: y,
              inSIP: y <= SIP_CAP,
            });
          }
        }
      }
    });

    return f.sort((a, b) => a.year - b.year);
  }, [rTog, rAgeN, rIncV, ageN, kTog, nKid, kYrs, goals]);

  // SIP & totals
  const { totalSIP, totalFV, horizon } = useMemo(() => {
    let sipSum = 0;
    let fvSum = 0;
    let maxH = 0;
    flows.forEach((f) => {
      if (f.inSIP) sipSum += calcSIP(f.fv, f.years);
      fvSum += f.fv;
      if (f.years > maxH) maxH = f.years;
    });
    return { totalSIP: sipSum, totalFV: fvSum, horizon: maxH };
  }, [flows]);

  // Health
  const surplus = incV - expV;
  const surplusPct = incV > 0 ? ((surplus / incV) * 100).toFixed(0) : 0;
  const expPct = incV > 0 ? ((expV / incV) * 100).toFixed(0) : 0;
  const expColor =
    expPct <= 40 ? "#15803d" : expPct <= 60 ? "#b45309" : "#b91c1c";

  const emergencyMonths = expV > 0 ? savV / expV : 0;
  const efGap = Math.max(0, expV * 6 - savV);
  const efColor =
    emergencyMonths >= 6 ? "#15803d" : emergencyMonths >= 3 ? "#b45309" : "#b91c1c";
  const efStatus =
    emergencyMonths >= 6 ? "Healthy" : emergencyMonths >= 3 ? "Building" : "Critical";

  const incFit = incV > 0 ? (totalSIP / incV) * 100 : 0;
  const fitColor =
    incFit <= 20 ? "#15803d" : incFit <= 30 ? "#b45309" : "#b91c1c";
  const fitStatus =
    incFit <= 20 ? "Comfortable" : incFit <= 30 ? "Stretch" : "Tough";

  // Retirement hint (pre-computed for Step 2, avoids IIFE in JSX)
  const retHintEl = useMemo(() => {
    if (rTog !== "do" || rAgeN <= ageN || rIncV <= 0) return null;
    const yrs = rAgeN - ageN;
    const futureMonthly = rIncV * Math.pow(1.06, yrs);
    const corpus = futureMonthly * 300;
    return (
      <HintText>
        Corpus needed: {fmt(corpus)} in {yrs} years (4% withdrawal rule)
      </HintText>
    );
  }, [rTog, rAgeN, ageN, rIncV]);

  // Child hints (pre-computed)
  const childHintEls = useMemo(
    () =>
      Array.from({ length: nKid }, (_, c) => {
        const birthYrs = parseFloat(kYrs[c]) || 0;
        if (birthYrs <= 0) return null;
        const eduYrs = birthYrs + 18;
        const fv = BASE_COLLEGE * Math.pow(1 + EDU_INF, eduYrs);
        return (
          <HintText key={c} color="#1d4ed8">
            Child {c + 1} college (year {eduYrs}): {fmt(fv)}
          </HintText>
        );
      }),
    [nKid, kYrs]
  );

  // Goal handlers
  const handleGoalChange = useCallback((idx, field, val) => {
    setGoals((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, [field]: val } : g))
    );
  }, []);

  const handleGoalRemove = useCallback((idx) => {
    setGoals((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addGoal = useCallback(() => {
    setGoals((prev) => [
      ...prev,
      { type: "Foreign Trip", amt: "", unit: "lakh", freq: "once", yrs: "" },
    ]);
  }, []);

  const resetAll = useCallback(() => {
    setStep(0);
    setInc({ v: "", u: "lakh" });
    setExp({ v: "", u: "lakh" });
    setSav({ v: "", u: "lakh" });
    setAge("");
    setRTog("do");
    setRAge("");
    setRInc({ v: "", u: "lakh" });
    setKTog("plan");
    setNKid(1);
    setKYrs(["", "", ""]);
    setGoals([]);
  }, []);

  const shareWA = useCallback(() => {
    const lines = [
      `Our family roadmap 🧭\n`,
      `Step-Up SIP: ${fmt(totalSIP)}/mo today, +10%/yr\n`,
    ];
    flows.slice(0, 5).forEach((f) => {
      const e =
        f.type === "retirement" ? "🌅" : f.type === "education" ? "🎓" : "✈️";
      lines.push(`${e} ${f.label}: ${fmt(f.fv)}`);
    });
    lines.push(`\nTotal corpus: ${fmt(totalFV)}\n\nMade with LifeCompass`);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank"
    );
  }, [flows, totalSIP, totalFV]);

  const LIGHT_BG = {
    minHeight: "100vh",
    background:
      "linear-gradient(155deg, #fffbf5 0%, #fff7ed 45%, #fef9f0 100%)",
    padding: "44px 24px 64px",
    fontFamily: 'Georgia, "Times New Roman", serif',
  };

  const WRAP = { maxWidth: 600, margin: "0 auto" };

  // ─── STEP 0: Landing ────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div
        style={{
          ...LIGHT_BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 540, width: "100%", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f97316, #dc2626)",
              marginBottom: 28,
              fontSize: "1.4em",
            }}
          >
            🧭
          </div>

          <div
            style={{
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: "0.72em",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#ea580c",
              marginBottom: 18,
            }}
          >
            LifeCompass
          </div>

          <h1
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "clamp(2.1rem, 5.5vw, 3.4rem)",
              fontWeight: 700,
              color: "#1c1410",
              lineHeight: 1.18,
              margin: "0 0 22px",
              letterSpacing: "-0.025em",
            }}
          >
            Your best years
            <br />
            deserve a plan.
          </h1>

          <p
            style={{
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: "1.02rem",
              color: "#78350f",
              lineHeight: 1.85,
              marginBottom: 40,
              maxWidth: 440,
              margin: "0 auto 40px",
            }}
          >
            LifeCompass turns your household's financial future into a clear,
            human plan — retirement, children's education, a home, travel, and
            everything in between. Not a spreadsheet. A story about your life,
            with numbers that actually make sense.
          </p>

          <button
            onClick={() => setStep(1)}
            style={{
              background:
                "linear-gradient(135deg, #f97316 0%, #ea580c 55%, #dc2626 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 50,
              padding: "17px 44px",
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: "1.05rem",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.025em",
              boxShadow: "0 10px 36px rgba(234,88,12,0.38)",
              display: "block",
              margin: "0 auto 28px",
            }}
          >
            Plan our life together →
          </button>

          <div
            style={{
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: "0.78em",
              color: "#b45309",
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "8px 24px",
            }}
          >
            {[
              "⏱ ~3 minutes",
              "🔒 No sign-up",
              "🧭 Stays in your browser",
            ].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 1: Baseline ────────────────────────────────────────────────────────
  if (step === 1) {
    const expHint =
      incV > 0 && expV > 0 ? (
        <HintText color={expColor}>
          Expenses are {expPct}% of income · Monthly surplus:{" "}
          <strong>{fmt(surplus)}</strong>
        </HintText>
      ) : null;

    const efHint =
      expV > 0 && savV > 0 ? (
        <HintText color={efColor}>
          Emergency fund: {emergencyMonths.toFixed(1)} months covered
          {efGap > 0 ? ` · Gap: ${fmt(efGap)} to reach 6 months` : " · ✓ You're well covered"}
        </HintText>
      ) : null;

    const ageHint =
      ageN > 0 ? (
        <HintText>We'll use this to map your retirement timeline.</HintText>
      ) : null;

    const canProceed = incV > 0 && expV > 0 && ageN > 0;

    return (
      <div style={LIGHT_BG}>
        <div style={WRAP}>
          <StepDots current={1} />

          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "1.65rem",
              color: "#1c1410",
              marginBottom: 8,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            Let's start with where you are today.
          </h2>
          <p
            style={{
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: "0.88rem",
              color: "#92400e",
              marginBottom: 32,
            }}
          >
            Every number you share shapes the plan we build together.
          </p>

          <Card>
            <Prose>
              Together, we bring home{" "}
              <MoneyBlank
                val={inc.v}
                unit={inc.u}
                onVal={(v) => setInc((p) => ({ ...p, v }))}
                onUnit={(u) => setInc((p) => ({ ...p, u }))}
              />{" "}
              a month. Our household costs about{" "}
              <MoneyBlank
                val={exp.v}
                unit={exp.u}
                onVal={(v) => setExp((p) => ({ ...p, v }))}
                onUnit={(u) => setExp((p) => ({ ...p, u }))}
              />{" "}
              every month to run.
            </Prose>
            {expHint}
          </Card>

          <Card>
            <Prose>
              We've built up{" "}
              <MoneyBlank
                val={sav.v}
                unit={sav.u}
                onVal={(v) => setSav((p) => ({ ...p, v }))}
                onUnit={(u) => setSav((p) => ({ ...p, u }))}
              />{" "}
              in savings and investments so far.
            </Prose>
            {efHint}
          </Card>

          <Card>
            <Prose>
              I'm{" "}
              <Blank value={age} onChange={setAge} width="48px" /> years old
              today.
            </Prose>
            {ageHint}
          </Card>

          <div
            style={{
              marginTop: 36,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <CTABtn onClick={() => setStep(2)} disabled={!canProceed}>
              Now let's talk about your goals →
            </CTABtn>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Life Goals ──────────────────────────────────────────────────────
  if (step === 2) {
    const kidRows = Array.from({ length: nKid }, (_, c) => (
      <div key={c} style={{ marginTop: 14 }}>
        <Prose>
          Child {c + 1} arrives in{" "}
          <Blank
            value={kYrs[c]}
            onChange={(v) =>
              setKYrs((prev) => {
                const a = [...prev];
                a[c] = v;
                return a;
              })
            }
            width="44px"
          />{" "}
          years.
        </Prose>
        {childHintEls[c]}
      </div>
    ));

    const kidsSection =
      kTog === "plan" ? (
        <div style={{ marginTop: 16 }}>
          <Prose>
            We're thinking{" "}
            <NumToggle min={1} max={3} value={nKid} onChange={setNKid} />{" "}
            {nKid === 1 ? "child" : "children"}.
          </Prose>
          {kidRows}
          <div style={{ marginTop: 10 }}>
            <HintText color="#1d4ed8">
              Their future is already part of yours.
            </HintText>
          </div>
        </div>
      ) : null;

    const retSection =
      rTog === "do" ? (
        <div style={{ marginTop: 16 }}>
          <Prose>
            We'd like to stop working at age{" "}
            <Blank value={rAge} onChange={setRAge} width="48px" />, and live
            on{" "}
            <MoneyBlank
              val={rInc.v}
              unit={rInc.u}
              onVal={(v) => setRInc((p) => ({ ...p, v }))}
              onUnit={(u) => setRInc((p) => ({ ...p, u }))}
            />{" "}
            a month (today's money).
          </Prose>
          <div style={{ marginTop: 8 }}>
            {retHintEl}
          </div>
          <div style={{ marginTop: 8 }}>
            <HintText color="#92400e" style={{ fontStyle: "italic" }}>
              The day you stop working should feel like a beginning.
            </HintText>
          </div>
        </div>
      ) : null;

    return (
      <div style={LIGHT_BG}>
        <div style={WRAP}>
          <StepDots current={2} />

          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "1.65rem",
              color: "#1c1410",
              marginBottom: 8,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            Now let's map the chapters ahead.
          </h2>
          <p
            style={{
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: "0.88rem",
              color: "#92400e",
              marginBottom: 30,
            }}
          >
            Every choice here shapes what you invest today.
          </p>

          {/* Retirement */}
          <Sec tint="#fffbeb" title="🌅 Retirement">
            <Prose>
              We{" "}
              <Toggle
                options={[
                  { v: "do", l: "do" },
                  { v: "havent", l: "haven't decided if we" },
                ]}
                value={rTog}
                onChange={setRTog}
              />{" "}
              want to retire one day.
            </Prose>
            {retSection}
          </Sec>

          {/* Children */}
          <Sec tint="#eff6ff" title="🎓 Children">
            <Prose>
              We{" "}
              <Toggle
                options={[
                  { v: "plan", l: "plan" },
                  { v: "dont", l: "don't plan" },
                ]}
                value={kTog}
                onChange={setKTog}
              />{" "}
              to have children.
            </Prose>
            {kidsSection}
          </Sec>

          {/* Lifestyle Goals */}
          <Sec tint="#fafafa" title="✈️ Lifestyle Goals">
            {goals.length === 0 && (
              <p
                style={{
                  fontFamily: "Helvetica Neue, Arial, sans-serif",
                  fontSize: "0.85em",
                  color: "#bbb",
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                Add travel, a new car, a home down payment — anything you're
                saving towards.
              </p>
            )}
            {goals.map((g, i) => (
              <GoalLine
                key={i}
                goal={g}
                idx={i}
                onChange={handleGoalChange}
                onRemove={handleGoalRemove}
              />
            ))}
            <button
              onClick={addGoal}
              style={{
                background: "transparent",
                border: "1.5px dashed rgba(234,88,12,0.35)",
                borderRadius: 12,
                padding: "11px 20px",
                color: "#ea580c",
                fontFamily: "Helvetica Neue, Arial, sans-serif",
                fontSize: "0.87em",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
                transition: "border-color 0.15s",
              }}
            >
              + add a goal
            </button>
          </Sec>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 32,
            }}
          >
            <button
              onClick={() => setStep(1)}
              style={{
                background: "none",
                border: "none",
                color: "#ea580c",
                fontFamily: "Helvetica Neue, Arial, sans-serif",
                fontSize: "0.9rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ← back
            </button>
            <CTABtn onClick={() => setStep(3)}>Show me our plan →</CTABtn>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 3: Results ─────────────────────────────────────────────────────────
  const QUOTES = [
    "You didn't plan a spreadsheet. You planned a life.",
    "Every rupee you invest today is a letter to your future self.",
    "The best time to start was 20 years ago. The second best time is right now.",
  ];
  const quote = QUOTES[Math.min(Math.floor(totalSIP / 50000), 2)];

  const DARK_BG = {
    minHeight: "100vh",
    background:
      "linear-gradient(155deg, #0c0a09 0%, #1c1410 25%, #0f172a 65%, #1e1b4b 100%)",
    padding: "44px 24px 72px",
    color: "#fff",
    fontFamily: 'Georgia, "Times New Roman", serif',
  };

  const numGoals = flows.length;

  return (
    <div style={DARK_BG}>
      <div style={{ ...WRAP }}>

        {/* Wordmark */}
        <div
          style={{
            fontFamily: "Helvetica Neue, Arial, sans-serif",
            fontSize: "0.68em",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(249,115,22,0.5)",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          LifeCompass
        </div>

        {/* Quote */}
        <p
          style={{
            fontStyle: "italic",
            fontSize: "1.0rem",
            color: "rgba(255,255,255,0.45)",
            textAlign: "center",
            marginBottom: 36,
            lineHeight: 1.75,
            padding: "0 16px",
          }}
        >
          "{quote}"
        </p>

        {/* Hero SIP card */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(234,88,12,0.07) 100%)",
            border: "1px solid rgba(249,115,22,0.28)",
            borderRadius: 24,
            padding: "36px 28px",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: "0.68em",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#fb923c",
              marginBottom: 10,
            }}
          >
            Your Step-Up SIP
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: "clamp(2.6rem, 7vw, 4rem)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.025em",
                lineHeight: 1,
              }}
            >
              {fmt(totalSIP)}
            </span>
            <span
              style={{
                fontFamily: "Helvetica Neue, Arial, sans-serif",
                fontSize: "1rem",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              /mo
            </span>
          </div>
          <p
            style={{
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: "0.82em",
              color: "rgba(255,255,255,0.5)",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Increase by 10% every year —{" "}
            {numGoals > 0 ? `all ${numGoals} goal${numGoals !== 1 ? "s" : ""} funded` : "add goals to see your SIP"}{" "}
            {numGoals > 0 ? "✓" : ""}
          </p>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            { l: "Total Corpus", v: fmt(totalFV) },
            { l: "Horizon", v: `${horizon} yrs` },
            { l: "Goals Covered", v: `${numGoals}` },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                padding: "16px 10px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  fontFamily: "Helvetica Neue, Arial, sans-serif",
                  fontSize: "0.62em",
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "1.1em",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>

        {/* Assumptions pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          {[
            "12% returns",
            "10% step-up",
            "10% edu inflation",
            "6% lifestyle inflation",
          ].map((a) => (
            <span
              key={a}
              style={{
                fontFamily: "Helvetica Neue, Arial, sans-serif",
                fontSize: "0.67em",
                color: "rgba(255,255,255,0.38)",
                background: "rgba(255,255,255,0.05)",
                padding: "4px 12px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              {a}
            </span>
          ))}
        </div>

        {/* Health Cards */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <HealthCard
            icon="🛡️"
            label="Emergency Fund"
            value={efStatus}
            sub={
              efGap > 0
                ? `Gap: ${fmt(efGap)}`
                : `${emergencyMonths.toFixed(0)} months covered`
            }
            color={efColor}
          />
          <HealthCard
            icon="💰"
            label="Income Fit"
            value={fitStatus}
            sub={`${incFit.toFixed(0)}% of monthly income`}
            color={fitColor}
          />
          <HealthCard
            icon="📈"
            label="Surplus"
            value={fmt(surplus)}
            sub={`${surplusPct}% savings rate`}
            color="#15803d"
          />
        </div>

        {/* Bar Chart */}
        {flows.length > 0 && (
          <div
            style={{
              background: "rgba(255,255,255,0.025)",
              borderRadius: 20,
              padding: "22px 18px 16px",
              marginBottom: 22,
              border: "1px solid rgba(255,255,255,0.055)",
            }}
          >
            <div
              style={{
                fontFamily: "Helvetica Neue, Arial, sans-serif",
                fontSize: "0.66em",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: 14,
              }}
            >
              Your Financial Timeline
            </div>
            <div style={{ display: "flex", gap: 18, marginBottom: 14 }}>
              {[
                ["#fb923c", "Retirement"],
                ["#c7d2fe", "Goals & Education"],
              ].map(([c, l]) => (
                <span
                  key={l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontFamily: "Helvetica Neue, Arial, sans-serif",
                    fontSize: "0.68em",
                    color: "rgba(255,255,255,0.38)",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: c,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {l}
                </span>
              ))}
            </div>
            <BarChart flows={flows} currentAge={ageN} />
          </div>
        )}

        {/* Milestones list */}
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            borderRadius: 20,
            padding: "22px 22px",
            marginBottom: 24,
            border: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          <div
            style={{
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: "0.66em",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              marginBottom: 18,
            }}
          >
            Every Milestone
          </div>

          {flows.length === 0 ? (
            <p
              style={{
                fontFamily: "Helvetica Neue, Arial, sans-serif",
                fontSize: "0.85em",
                color: "rgba(255,255,255,0.25)",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              Go back and add some life chapters.
            </p>
          ) : (
            flows.map((f, i) => {
              const emoji =
                f.type === "retirement"
                  ? "🌅"
                  : f.type === "education"
                  ? "🎓"
                  : "✈️";
              const valueColor =
                f.type === "retirement" ? "#fb923c" : "#c7d2fe";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "13px 0",
                    borderBottom:
                      i < flows.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{ marginRight: 10, fontSize: "1em" }}>
                      {emoji}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: "0.92em",
                        color: "rgba(255,255,255,0.82)",
                      }}
                    >
                      {f.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "Helvetica Neue, Arial, sans-serif",
                        fontSize: "0.68em",
                        color: "rgba(255,255,255,0.28)",
                        marginLeft: 8,
                        whiteSpace: "nowrap",
                      }}
                    >
                      in {Math.round(f.year)} yrs · age {ageN + Math.round(f.year)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: "0.98em",
                      fontWeight: 700,
                      color: valueColor,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {fmt(f.fv)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* WhatsApp share */}
        <button
          onClick={shareWA}
          style={{
            background: "#25D366",
            color: "#fff",
            border: "none",
            borderRadius: 50,
            padding: "16px",
            fontFamily: "Helvetica Neue, Arial, sans-serif",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
            marginBottom: 14,
            letterSpacing: "0.02em",
            boxShadow: "0 6px 20px rgba(37,211,102,0.25)",
          }}
        >
          📱 Share on WhatsApp
        </button>

        <button
          onClick={resetAll}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 50,
            padding: "13px",
            color: "rgba(255,255,255,0.28)",
            fontFamily: "Helvetica Neue, Arial, sans-serif",
            fontSize: "0.85rem",
            cursor: "pointer",
            width: "100%",
          }}
        >
          ← start over
        </button>
      </div>
    </div>
  );
}
