import { useLayoutEffect, useMemo, useRef, useState } from "react";

// Weekly stock purchases minus sales by members of Congress, counted by trade, with the S&P 500 above on the same
// time axis. Two bands instead of a dual axis: the index line on top, the bars below, each with its own heading.
// Hovering a week shows its purchases, sales, members and the SPY close. Weeks in the last 45 days are still being
// disclosed, which the note under the chart says.
const BUY = "#0f7b3f", SELL = "#be2929", INK = "#0b0c0c", MUTED = "#6b7276", GRID = "rgba(0,0,0,0.06)", AXIS = "rgba(0,0,0,0.35)";
const RANGES = [["2026", "2026"], ["all", "Since 2025"]];
const MARKERS = [{ date: "2026-02-28", label: "Iran war begins" }];
const t = (s) => Date.parse(`${s}T00:00:00Z`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabel = (s) => { const d = new Date(t(s)); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

export default function WeeklyFlows({ flows }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [range, setRange] = useState("2026");
  const [hover, setHover] = useState(null);
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    setWidth(ref.current.getBoundingClientRect().width);
    const ro = new ResizeObserver((e) => setWidth(e[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const rows = useMemo(() => flows.filter((r) => (range === "2026" ? r.week >= "2025-12-29" : true)).map((r) => ({ ...r, net: r.buys - r.sells })), [flows, range]);
  if (!rows.length) return null;
  const narrow = width < 640;
  const W = Math.max(320, width), P = { l: narrow ? 36 : 44, r: narrow ? 36 : 48 };
  const lineTop = 34, lineBot = narrow ? 150 : 210, barTop = lineBot + 64, barBot = barTop + (narrow ? 130 : 180), H = barBot + 30;
  const x0 = t(rows[0].week), x1 = t(rows.at(-1).week) + 7 * 86400000;
  const x = (s) => P.l + ((t(s) - x0) / (x1 - x0)) * (W - P.l - P.r);
  const spy = rows.filter((r) => r.spy != null);
  const sLo = Math.min(...spy.map((r) => r.spy)), sHi = Math.max(...spy.map((r) => r.spy));
  const yS = (v) => lineBot - ((v - sLo) / (sHi - sLo || 1)) * (lineBot - lineTop);
  const nMax = Math.max(20, ...rows.map((r) => r.net)), nMin = Math.min(-20, ...rows.map((r) => r.net));
  const step = nMax - nMin > 150 ? 50 : 25;
  const nHi = Math.ceil(nMax / step) * step, nLo = Math.floor(nMin / step) * step;
  const yN = (v) => barBot - ((v - nLo) / (nHi - nLo)) * (barBot - barTop);
  const weekW = (W - P.l - P.r) / rows.length, bw = Math.max(2, weekW * 0.62);
  const cx = (r) => x(r.week) + weekW / 2;
  const ticks = []; for (let v = nLo; v <= nHi; v += step) ticks.push(v);
  const months = [];
  for (let d = new Date(x0); d.getTime() <= x1; d.setUTCMonth(d.getUTCMonth() + 1)) { d.setUTCDate(1); if (d.getTime() >= x0) months.push(new Date(d)); }
  const monthStep = range === "all" ? (narrow ? 6 : 3) : narrow ? 2 : 1;
  const low = spy.reduce((a, r) => (r.spy < a.spy ? r : a));
  const last = spy.at(-1);
  const path = spy.map((r, i) => `${i ? "L" : "M"}${cx(r).toFixed(1)},${yS(r.spy).toFixed(1)}`).join("");
  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.max(0, Math.min(rows.length - 1, Math.floor((px - P.l) / weekW)));
    setHover(rows[i]);
  };
  const tip = hover && { left: Math.min(Math.max(cx(hover), 90), W - 90) };
  return (
    <div>
      <div className="govuk-form-group" style={{ marginBottom: 12 }}>
        <label className="govuk-label" htmlFor="flows-range">Period</label>
        <select className="govuk-select" id="flows-range" value={range} onChange={(e) => { setRange(e.target.value); setHover(null); }}>
          {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div ref={ref} style={{ position: "relative" }}>
        {width > 0 && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img"
            aria-label={`Weekly net stock purchases by members of Congress and the S&P 500. The S&P 500 low was ${Math.round(low.spy)} in the week of ${dayLabel(low.week)}.`}>
            <text x={0} y={lineTop - 18} fontSize="15" fontWeight="700" fill={INK}>S&amp;P 500</text>
            <text x={0} y={barTop - 18} fontSize="15" fontWeight="700" fill={INK}>Net stock purchases by members of Congress, per week</text>
            {MARKERS.filter((m) => t(m.date) >= x0 && t(m.date) <= x1).map((m) => (
              <g key={m.date}>
                <line x1={x(m.date)} x2={x(m.date)} y1={lineTop - 4} y2={barTop - 40} stroke={MUTED} strokeDasharray="3 4" />
                <line x1={x(m.date)} x2={x(m.date)} y1={barTop - 6} y2={barBot} stroke={MUTED} strokeDasharray="3 4" />
                <text x={x(m.date) + 6} y={lineTop + 8} fontSize="13" fill={MUTED}>{m.label}</text>
              </g>
            ))}
            {ticks.map((v) => (
              <g key={v}>
                <line x1={P.l} x2={W - P.r} y1={yN(v)} y2={yN(v)} stroke={v ? GRID : AXIS} />
                <text x={P.l - 6} y={yN(v) + 4} textAnchor="end" fontSize="12" fill={MUTED}>{v > 0 ? `+${v}` : v}</text>
              </g>
            ))}
            {rows.map((r) => {
              const y0 = yN(0), y1 = yN(r.net);
              return <rect key={r.week} x={cx(r) - bw / 2} y={Math.min(y0, y1)} width={bw} height={Math.max(1, Math.abs(y1 - y0))} fill={r.net >= 0 ? BUY : SELL} opacity={hover && hover.week !== r.week ? 0.45 : 1} />;
            })}
            <path d={path} fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <circle cx={cx(low)} cy={yS(low.spy)} r="3.5" fill={INK} />
            <text x={cx(low) + 8} y={yS(low.spy) + 16} fontSize="13" fill={INK}>Low {Math.round(low.spy)}</text>
            <text x={cx(last) + 6} y={yS(last.spy) + 4} fontSize="13" fontWeight="700" fill={INK}>{Math.round(last.spy)}</text>
            {months.filter((d, i) => i % monthStep === 0).map((d) => {
              const iso = d.toISOString().slice(0, 10);
              return (
                <g key={iso}>
                  <line x1={x(iso)} x2={x(iso)} y1={barBot} y2={barBot + 5} stroke={AXIS} />
                  <text x={x(iso)} y={barBot + 20} textAnchor="middle" fontSize="12" fill={MUTED}>{MONTHS[d.getUTCMonth()]}{d.getUTCMonth() === 0 ? ` ${d.getUTCFullYear()}` : ""}</text>
                </g>
              );
            })}
            {hover && <line x1={cx(hover)} x2={cx(hover)} y1={lineTop} y2={barBot} stroke={INK} strokeOpacity="0.25" />}
          </svg>
        )}
        {hover && (
          <div style={{ position: "absolute", top: 0, left: tip.left, transform: "translateX(-50%)", background: "#fff", border: "1px solid #b1b4b6", padding: "6px 10px", fontSize: 14, lineHeight: "20px", pointerEvents: "none", whiteSpace: "nowrap" }}>
            <strong>Week of {dayLabel(hover.week)}</strong><br />
            <span style={{ color: BUY }}>{hover.buys} purchases</span>, <span style={{ color: SELL }}>{hover.sells} sales</span><br />
            Net {hover.net > 0 ? "+" : ""}{hover.net}, {hover.members} members{hover.spy != null ? `, S&P ${Math.round(hover.spy)}` : ""}
          </div>
        )}
      </div>
      <p className="govuk-body-s" style={{ color: MUTED, marginTop: 8 }}>
        Counted by trade, not dollars: filings give only value ranges. Members have 45 days to disclose, so the latest weeks will still change. The President's filings are not included.
      </p>
    </div>
  );
}
