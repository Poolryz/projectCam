import { useEffect, useRef, useCallback } from "react";
import { VideoSocketClient, WS_URL } from "../../api/client.js";
import { useStore } from "../../store/Zustand.jsx";
import AlertBanner from "./AlertBanner.jsx";
import ConfirmBanner from "./ConfirmBanner.jsx";
import ManualWidthPanel from "./ManualWidthPanel.jsx";
import StatsPanel from "./StatsPanel.jsx";

const VideoStream = () => {
  const wsConnected = useStore((s) => s.wsConnected);
  const wsStatusText = useStore((s) => s.wsStatusText);
  const isFlashing = useStore((s) => s.isFlashing);
  const hasFrame = useStore((s) => s.hasFrame);

  const canvasRef = useRef(null);
  const clientRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());

  const sendMsg = useCallback((obj) => {
    clientRef.current?.send(obj);
  }, []);

  useEffect(() => {
    const {
      setWsConnected,
      setWsStatusText,
      setFps,
      setMeta,
      setHasFrame,
      setMonitorState,
      setExpectedMm,
      setBounds,
      setAlertBanner,
      setConfirmRequest,
      setIsFlashing,
    } = useStore.getState();

    let alertHideTimer = null;

    const showAlert = (text, cssClass, autohideMs = 0) => {
      clearTimeout(alertHideTimer);
      setAlertBanner({ text, cssClass });
      if (autohideMs > 0) {
        alertHideTimer = setTimeout(() => setAlertBanner(null), autohideMs);
      }
    };

    const client = new VideoSocketClient(WS_URL);
    clientRef.current = client;

    client.onStatus = ({ connected, text }) => {
      setWsConnected(connected);
      setWsStatusText(text);
      if (!connected) setFps(0);
    };

    client.onMessage = (msg) => {
      switch (msg.type) {
        case "frame": {
          if (!msg.data) break;
          setHasFrame(true);

          frameCountRef.current += 1;
          const now = Date.now();
          if (now - lastFpsTimeRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastFpsTimeRef.current = now;
          }

          setMeta(msg.meta ?? {});

          if (canvasRef.current) {
            const img = new Image();
            img.onload = () => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              canvas.getContext("2d").drawImage(img, 0, 0);
            };
            img.src = `data:image/jpeg;base64,${msg.data}`;
          }
          break;
        }

        case "no_frame":
          setHasFrame(false);
          break;

        case "width_confirm_request":
          setConfirmRequest({
            suggestedMm: msg.suggested_mm,
            measuredMm: msg.measured_mm,
          });
          setMonitorState("confirming");
          break;

        case "width_alert": {
          const dir = msg.direction === "wider" ? "шире нормы" : "уже нормы";
          const cls = msg.direction === "wider" ? "alert-wider" : "alert-narrower";
          showAlert(
            `⚠ Металл ${dir}: ${msg.width_mm} мм (норма ${msg.bounds[0]}–${msg.bounds[1]} мм)`,
            cls
          );
          setIsFlashing(true);
          break;
        }

        case "width_back_in_bounds":
          showAlert(
            `✔ Металл в норме: ${msg.width_mm} мм (${msg.bounds[0]}–${msg.bounds[1]} мм)`,
            "alert-ok",
            4000
          );
          setIsFlashing(false);
          break;

        case "width_monitor_state": {
          const s = msg.state || "idle";
          setMonitorState(s);
          if (msg.expected_mm != null) {
            setExpectedMm(msg.expected_mm);
            if (msg.bounds) setBounds(msg.bounds);
          } else {
            setExpectedMm(null);
            setBounds(null);
          }
          if (s !== "confirming") setConfirmRequest(null);
          if (s === "monitoring") {
            setIsFlashing(false);
            setAlertBanner(null);
          }
          break;
        }

        default:
          break;
      }
    };

    client.connect();

    return () => {
      clearTimeout(alertHideTimer);
      client.destroy();
      clientRef.current = null;
    };
  }, []);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className={`conn-dot${wsConnected ? " connected" : ""}`} />
        <h1>Мониторинг ширины металла</h1>
        <span className="status-text">{wsStatusText}</span>
      </header>

      <AlertBanner />
      <ConfirmBanner sendMsg={sendMsg} />
      <ManualWidthPanel sendMsg={sendMsg} />

      <main className="app-main">
        <div className={`canvas-wrap${isFlashing ? " flashing" : ""}`}>
          <canvas ref={canvasRef} />
          {!hasFrame && (
            <div className="canvas-overlay">Ожидание кадра…</div>
          )}
        </div>
        <StatsPanel />
      </main>
    </div>
  );
};

export default VideoStream;
