import { useStore } from "../../store/Zustand.jsx";

const NA = "—";

const Stat = ({ label, value, className = "" }) => (
  <div className="stat">
    <span className="stat-label">{label}</span>
    <span className={`stat-value${className ? " " + className : ""}`}>
      {value ?? NA}
    </span>
  </div>
);

const StatsPanel = () => {
  const fps = useStore((s) => s.fps);
  const meta = useStore((s) => s.meta);
  const expectedMm = useStore((s) => s.expectedMm);
  const bounds = useStore((s) => s.bounds);

  const widthMm = meta?.width_mm_2dp ?? meta?.width_mm;
  const confidence = meta?.confidence;
  const ok = meta?.ok;

  return (
    <div className="stats-panel">
      <Stat
        label="Ширина (мм)"
        value={widthMm != null ? widthMm.toFixed(2) : null}
        className={widthMm == null ? "na" : ""}
      />
      <Stat
        label="Ожид. ширина"
        value={expectedMm != null ? `${Math.round(expectedMm)} мм` : null}
        className={expectedMm == null ? "na" : ""}
      />
      <Stat
        label="Допуск (мм)"
        value={
          bounds != null
            ? `${bounds[0].toFixed(0)}–${bounds[1].toFixed(0)}`
            : null
        }
        className={bounds == null ? "na" : ""}
      />
      <Stat
        label="Уверенность"
        value={confidence != null ? `${(confidence * 100).toFixed(0)}%` : null}
        className={confidence == null ? "na" : ""}
      />
      <Stat
        label="FPS"
        value={fps > 0 ? fps : null}
        className={fps === 0 ? "na" : ""}
      />
      <Stat
        label="Статус"
        value={ok == null ? null : ok ? "OK" : meta?.reason || "ошибка"}
        className={ok == null ? "na" : ok ? "" : "warn"}
      />
    </div>
  );
};

export default StatsPanel;
