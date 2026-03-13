// VideoStream.jsx
import { useEffect, useRef, useState } from "react";
import ImportantInfoPanel from "./ImportantInfoPanel.jsx";

const VideoStream = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState(null);
  const [useMjpeg] = useState(false); // Переключатель между MJPEG и WebSocket
  const [lastMeta, setLastMeta] = useState(null);
  const [lastMetaTimestamp, setLastMetaTimestamp] = useState(null);

  const wsRef = useRef(null);
  const canvasRef = useRef(null);
  const frameCountRef = useRef(0);
  // eslint-disable-next-line react-hooks/purity
  const lastTimeRef = useRef(Date.now());
  const animationRef = useRef(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket("ws://localhost:8000/video/processed/ws");

        wsRef.current.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          setError(null);
          startFrameRequest();
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);
          // Пытаемся переподключиться через 3 секунды
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("Ошибка WebSocket соединения");
        };

        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data?.type === "measurement") {
            setLastMeta(data?.meta ?? null);
            setLastMetaTimestamp(data?.timestamp ?? null);
            return;
          }

          if (data?.type === "frame" && canvasRef.current) {
            if (data?.meta && typeof data.meta === "object") {
              setLastMeta(data.meta);
              setLastMetaTimestamp(data?.timestamp ?? null);
            }

            // Обновляем FPS
            frameCountRef.current += 1;
            const now = Date.now();
            if (now - lastTimeRef.current >= 1000) {
              setFps(frameCountRef.current);
              frameCountRef.current = 0;
              lastTimeRef.current = now;
            }

            // Отображаем кадр через canvas для лучшего контроля
            const img = new Image();
            img.onload = () => {
              const ctx = canvasRef.current.getContext("2d");
              canvasRef.current.width = img.width;
              canvasRef.current.height = img.height;
              ctx.drawImage(img, 0, 0, img.width, img.height);
            };
            img.src = `data:image/jpeg;base64,${data.data}`;
          }
        };
      } catch (err) {
        console.error("Connection error:", err);
        setError("Не удалось подключиться к серверу");
      }
    };

    const startFrameRequest = () => {
      const requestFrame = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send("get_frame");
          animationRef.current = setTimeout(requestFrame, 33); // ~30 FPS
        }
      };
      requestFrame();
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [useMjpeg]);

  const requestMeasurement = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send("get_measurement");
    }
  };

  return (
    <div className="video-stream-container">
      <div className="video-header">
        <h2>RTSP Video Stream</h2>
      </div>

      <div className="status-bar">
        <div
          className={`status-indicator ${
            isConnected ? "connected" : "disconnected"
          }`}
        >
          {isConnected ? "● Подключено" : "○ Отключено"}
        </div>
        {fps > 0 && <div className="fps-counter">FPS: {fps}</div>}
        {error && <div className="error-message">⚠ {error}</div>}
      </div>

      <ImportantInfoPanel
        apiBaseUrl="http://localhost:8000"
        wsUrl="ws://localhost:8000/video/processed/ws"
        isConnected={isConnected}
        fps={fps}
        lastMeta={lastMeta}
        lastMetaTimestamp={lastMetaTimestamp}
        onRequestMeasurement={requestMeasurement}
      />

      <div className="video-wrapper">
        <canvas ref={canvasRef} className="video-player" />
      </div>

      <div className="info-panel">
        <h4>Информация о подключении:</h4>
        <ul>
          <li>
            Метод: <strong>{useMjpeg ? "MJPEG" : "WebSocket"}</strong>
          </li>
          <li>
            Сервер: <strong>localhost:8000</strong>
          </li>
          <li>
            Статус:{" "}
            <span className={isConnected ? "text-success" : "text-error"}>
              {isConnected ? "Активно" : "Неактивно"}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VideoStream;
