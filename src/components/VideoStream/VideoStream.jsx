// VideoStream.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';

const VideoStream = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const animationRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Функция для подключения WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      // Закрываем предыдущее соединение если есть
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log('Подключение к WebSocket...');
      wsRef.current = new WebSocket('ws://localhost:8000/ws/video');

      wsRef.current.onopen = () => {
        console.log('WebSocket подключен');
        setIsConnected(true);
        setError(null);
        startFrameRequest();
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket отключен', event.code, event.reason);
        setIsConnected(false);

        // Пытаемся переподключиться через 3 секунды
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Попытка переподключения...');
          connectWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket ошибка:', event);
        setError('Ошибка соединения с сервером');
        setIsConnected(false);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'frame' && canvasRef.current) {
            // Обновляем FPS
            frameCountRef.current += 1;
            const now = Date.now();
            if (now - lastTimeRef.current >= 1000) {
              setFps(frameCountRef.current);
              frameCountRef.current = 0;
              lastTimeRef.current = now;
            }

            // Создаем изображение из base64 данных
            const img = new Image();
            img.onload = () => {
              const ctx = canvasRef.current.getContext('2d');

              // Устанавливаем размер canvas под изображение
              if (canvasRef.current.width !== img.width || canvasRef.current.height !== img.height) {
                canvasRef.current.width = img.width;
                canvasRef.current.height = img.height;
                setVideoSize({ width: img.width, height: img.height });
              }

              // Рисуем изображение на canvas
              ctx.drawImage(img, 0, 0, img.width, img.height);
            };

            img.onerror = (imgError) => {
              console.error('Ошибка загрузки изображения:', imgError);
            };

            img.src = `data:image/jpeg;base64,${data.data}`;
          } else if (data.type === 'pong') {
            // Ответ на ping, можно использовать для проверки соединения
            console.log('Получен pong от сервера');
          }
        } catch (err) {
          console.error('Ошибка обработки сообщения:', err);
        }
      };
    } catch (err) {
      console.error('Ошибка подключения:', err);
      setError('Не удалось создать WebSocket соединение');
    }
  }, []);

  // Функция для запроса кадров
  const startFrameRequest = useCallback(() => {
    const requestFrame = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send('get_frame');
        // Запрашиваем следующий кадр через ~33ms (≈30 FPS)
        animationRef.current = setTimeout(requestFrame, 33);
      }
    };

    // Начинаем циклические запросы
    requestFrame();
  }, []);

  // Функция для отправки ping (проверка соединения)
  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('ping');
    }
  }, []);

  // Инициализация соединения
  useEffect(() => {
    connectWebSocket();

    // Настраиваем периодическую отправку ping (каждые 30 секунд)
    const pingInterval = setInterval(sendPing, 30000);

    // Очистка при размонтировании
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(pingInterval);
    };
  }, [connectWebSocket, sendPing]);

  // Функция для ручного переподключения
  const handleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    connectWebSocket();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>RTSP Video Stream (WebSocket)</h2>
        <button
          onClick={handleReconnect}
          style={styles.reconnectButton}
          disabled={isConnected}
        >
          {isConnected ? 'Подключено' : 'Переподключиться'}
        </button>
      </div>

      <div style={styles.statusBar}>
        <div style={styles.statusContainer}>
          <span style={styles.statusLabel}>Статус:</span>
          <span style={{
            ...styles.statusValue,
            color: isConnected ? '#4caf50' : '#f44336'
          }}>
            {isConnected ? '● Подключено' : '○ Отключено'}
          </span>
        </div>

        {fps > 0 && (
          <div style={styles.fpsContainer}>
            <span style={styles.fpsLabel}>FPS:</span>
            <span style={styles.fpsValue}>{fps}</span>
          </div>
        )}

        {videoSize.width > 0 && (
          <div style={styles.sizeContainer}>
            <span style={styles.sizeLabel}>Разрешение:</span>
            <span style={styles.sizeValue}>
              {videoSize.width} x {videoSize.height}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={styles.errorMessage}>
          ⚠ {error}
        </div>
      )}

      <div style={styles.videoWrapper}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
        />
        {!isConnected && !error && (
          <div style={styles.overlay}>
            <div style={styles.overlayText}>
              Подключение к серверу...
            </div>
          </div>
        )}
        {error && (
          <div style={styles.overlay}>
            <div style={styles.overlayError}>
              {error}
            </div>
          </div>
        )}
      </div>

      <div style={styles.infoPanel}>
        <h4 style={styles.infoTitle}>Информация о подключении:</h4>
        <ul style={styles.infoList}>
          <li><strong>WebSocket URL:</strong> ws://localhost:8000/ws/video</li>
          <li><strong>Протокол:</strong> WebSocket + Base64 JPEG</li>
          <li><strong>FPS:</strong> ~30 кадров/сек</li>
          <li><strong>Состояние:</strong> {isConnected ? 'Активно' : 'Неактивно'}</li>
          <li><strong>Буферизация:</strong> Отсутствует (реальное время)</li>
        </ul>
      </div>
    </div>
  );
};

// Стили компонента
const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    color: '#333'
  },
  reconnectButton: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: '#1976D2'
    },
    ':disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    flexWrap: 'wrap'
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  statusLabel: {
    fontWeight: 'bold',
    color: '#666'
  },
  statusValue: {
    fontWeight: 'bold',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#fff'
  },
  fpsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#2196F3',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  fpsLabel: {
    fontWeight: 'bold',
    color: '#fff'
  },
  fpsValue: {
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  sizeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  sizeLabel: {
    fontWeight: 'bold',
    color: '#666'
  },
  sizeValue: {
    color: '#333',
    backgroundColor: '#fff',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  errorMessage: {
    backgroundColor: '#ff9800',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  videoWrapper: {
    position: 'relative',
    border: '2px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: '480px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  canvas: {
    maxWidth: '100%',
    maxHeight: '540px',
    display: 'block'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white'
  },
  overlayText: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '18px',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  overlayError: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '18px',
    backgroundColor: '#f44336',
    borderRadius: '4px'
  },
  infoPanel: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    borderLeft: '4px solid #2196F3'
  },
  infoTitle: {
    margin: '0 0 10px 0',
    color: '#333'
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#666'
  }
};

// Добавляем анимацию пульсации
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default VideoStream;
