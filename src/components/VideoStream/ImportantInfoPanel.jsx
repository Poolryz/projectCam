import { useEffect, useMemo, useState } from "react";

function formatUnixSeconds(ts) {
  if (typeof ts !== "number") return "—";
  try {
    return new Date(ts * 1000).toLocaleString();
  } catch {
    return "—";
  }
}

function formatMeta(meta) {
  if (!meta || typeof meta !== "object") return null;
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return String(meta);
  }
}

const ImportantInfoPanel = ({
  apiBaseUrl = "http://localhost:8000",
  wsUrl = "ws://localhost:8000/video/processed/ws",
  isConnected,
  fps,
  lastMeta,
  lastMetaTimestamp,
  onRequestMeasurement,
}) => {
  const [health, setHealth] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [pollError, setPollError] = useState(null);
  const [lastPollAt, setLastPollAt] = useState(null);

  const metaPretty = useMemo(() => formatMeta(lastMeta), [lastMeta]);

  useEffect(() => {
    let isMounted = true;

    const fetchJson = async (path) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      try {
        const res = await fetch(`${apiBaseUrl}${path}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return await res.json();
      } finally {
        clearTimeout(timeout);
      }
    };

    const poll = async () => {
      try {
        const [healthJson, statusJson] = await Promise.all([
          fetchJson("/health"),
          fetchJson("/video/status"),
        ]);
        if (!isMounted) return;
        setHealth(healthJson);
        setVideoStatus(statusJson);
        setPollError(null);
        setLastPollAt(Date.now());
      } catch (e) {
        if (!isMounted) return;
        setPollError(e?.message || "Ошибка запроса к API");
      }
    };

    poll();
    const id = setInterval(poll, 2000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [apiBaseUrl]);

  return (
    <div className="important-info-panel">
      <h4>Важная информация</h4>

      <div className="important-info-grid">
        <div className="important-info-block">
          <div className="important-info-title">Backend</div>
          <div className="important-info-row">
            <span className="label">API</span>
            <span className="value">{apiBaseUrl}</span>
          </div>
          <div className="important-info-row">
            <span className="label">WS</span>
            <span className="value">{wsUrl}</span>
          </div>
          <div className="important-info-row">
            <span className="label">Health</span>
            <span className="value">
              {health?.status ? health.status : "—"}
            </span>
          </div>
          <div className="important-info-row">
            <span className="label">Video stream</span>
            <span className="value">
              {typeof health?.video_stream === "boolean"
                ? String(health.video_stream)
                : "—"}
            </span>
          </div>
          <div className="important-info-row">
            <span className="label">Health time</span>
            <span className="value">{formatUnixSeconds(health?.timestamp)}</span>
          </div>
          <div className="important-info-row">
            <span className="label">Last poll</span>
            <span className="value">
              {lastPollAt ? new Date(lastPollAt).toLocaleTimeString() : "—"}
            </span>
          </div>
          {pollError && (
            <div className="important-info-error">⚠ {pollError}</div>
          )}
        </div>

        <div className="important-info-block">
          <div className="important-info-title">Video status</div>
          <div className="important-info-row">
            <span className="label">WS connected</span>
            <span className="value">{String(Boolean(isConnected))}</span>
          </div>
          <div className="important-info-row">
            <span className="label">FPS</span>
            <span className="value">{fps || 0}</span>
          </div>
          <div className="important-info-row">
            <span className="label">is_running</span>
            <span className="value">
              {typeof videoStatus?.is_running === "boolean"
                ? String(videoStatus.is_running)
                : "—"}
            </span>
          </div>
          <div className="important-info-row">
            <span className="label">has_frame</span>
            <span className="value">
              {typeof videoStatus?.has_frame === "boolean"
                ? String(videoStatus.has_frame)
                : "—"}
            </span>
          </div>
          <div className="important-info-row">
            <span className="label">Status time</span>
            <span className="value">
              {formatUnixSeconds(videoStatus?.timestamp)}
            </span>
          </div>
        </div>

        <div className="important-info-block important-info-block-wide">
          <div className="important-info-title">
            Processed meta (последнее)
          </div>
          <div className="important-info-row">
            <span className="label">Meta time</span>
            <span className="value">{formatUnixSeconds(lastMetaTimestamp)}</span>
          </div>
          <div className="important-info-actions">
            <button
              type="button"
              onClick={onRequestMeasurement}
              disabled={!isConnected}
            >
              Запросить measurement
            </button>
          </div>
          <pre className="important-info-pre">
            {metaPretty ? metaPretty : "—"}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ImportantInfoPanel;

