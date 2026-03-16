/**
 * ImportantInfoPanel
 *
 * Props:
 *   isConnected  – boolean, WebSocket подключён
 *   fps          – number
 *   meta         – объект из поля "meta" последнего WebSocket-сообщения:
 *     {
 *       ok              : boolean
 *       width_mm        : number   – сглаженная ширина (мм)
 *       width_mm_2dp    : number   – округлено до 2 знаков
 *       width_mm_raw    : number   – сырое значение
 *       width_px        : number   – ширина в пикселях
 *       left_edge_px    : number
 *       right_edge_px   : number
 *       measure_y       : number
 *       confidence      : number   – 0..1
 *       reason          : string   – причина, если ok=false
 *       timestamp       : number   – Unix-секунды
 *     }
 */

const NA = "—";

function fmt(value, digits = 2) {
  return typeof value === "number" ? value.toFixed(digits) : NA;
}

function fmtPct(value) {
  return typeof value === "number" ? (value * 100).toFixed(0) + "%" : NA;
}

function fmtTime(unixSec) {
  if (typeof unixSec !== "number") return NA;
  try {
    return new Date(unixSec * 1000).toLocaleTimeString();
  } catch {
    return NA;
  }
}

const Row = ({ label, value, warn = false }) => (
  <div className="important-info-row">
    <span className="label">{label}</span>
    <span className={`value${warn ? " text-error" : ""}`}>{value}</span>
  </div>
);

const ImportantInfoPanel = ({ isConnected, fps, meta }) => {
  const ok = meta?.ok === true;
  const widthMm = meta?.width_mm_2dp ?? meta?.width_mm;
  const belowThreshold = typeof widthMm === "number" && widthMm < 134;

  return (
    <div className="important-info-panel">
      <h4>Важная информация</h4>

      <div className="important-info-grid">
        {/* --- Соединение --- */}
        <div className="important-info-block">
          <div className="important-info-title">Соединение</div>
          <Row label="WebSocket"  value={isConnected ? "подключено" : "отключено"} warn={!isConnected} />
          <Row label="FPS"        value={fps > 0 ? fps : NA} />
          <Row label="Сервер"     value="localhost:8000" />
          <Row label="Endpoint"   value="/video/ws" />
        </div>

        {/* --- Измерение --- */}
        <div className="important-info-block">
          <div className="important-info-title">Измерение металла</div>

          {meta == null ? (
            <div className="important-info-row">
              <span className="label">Статус</span>
              <span className="value">Ожидание данных…</span>
            </div>
          ) : ok ? (
            <>
              <Row label="Ширина (мм)"   value={fmt(widthMm)}              warn={belowThreshold} />
              <Row label="Сырое (мм)"    value={fmt(meta.width_mm_raw)} />
              <Row label="Ширина (px)"   value={fmt(meta.width_px, 1)} />
              <Row label="Уверенность"   value={fmtPct(meta.confidence)} />
              <Row label="Левый край px" value={fmt(meta.left_edge_px, 1)} />
              <Row label="Правый край px"value={fmt(meta.right_edge_px, 1)} />
              <Row label="Линия Y"       value={meta.measure_y ?? NA} />
              <Row label="Время"         value={fmtTime(meta.timestamp)} />
            </>
          ) : (
            <>
              <Row label="Статус" value={`Ошибка: ${meta.reason ?? "неизвестно"}`} warn />
              <Row label="Время"  value={fmtTime(meta.timestamp)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportantInfoPanel;
