/**
 * VideoSocketClient
 *
 * Подключается к ws://host/video/ws
 * Сервер сам отправляет кадры + измерения ~25 FPS (push-модель).
 *
 * Использование:
 *   const client = new VideoSocketClient("ws://localhost:8000/video/ws");
 *   client.onMessage = (msg) => { ... };   // все типы сообщений
 *   client.onStatus  = ({ connected, text }) => { ... };
 *   client.connect();
 *   client.send({ type: 'set_width', expected_mm: 250 });
 *   // при размонтировании:
 *   client.destroy();
 */
export class VideoSocketClient {
  /** @param {string} url */
  constructor(url = `ws://${window.location.hostname}:8000/video/ws`) {    this.url = url;
    this._ws = null;
    this._destroyed = false;
    this._reconnectTimer = null;
    this._reconnectDelay = 3000; // мс

    /**
     * Вызывается для каждого распарсенного сообщения от сервера.
     * @type {((msg: object) => void) | null}
     */
    this.onMessage = null;

    /**
     * @type {((payload: {connected: boolean, text: string}) => void) | null}
     */
    this.onStatus = null;
  }

  connect() {
    if (this._destroyed) return;

    try {
      this._ws = new WebSocket(this.url);

      this._ws.onopen = () => {
        this._reconnectDelay = 3000;
        this.onStatus?.({ connected: true, text: "Подключено" });
      };

      this._ws.onmessage = (evt) => {
        let msg;
        try {
          msg = JSON.parse(evt.data);
        } catch {
          return;
        }
        this.onMessage?.(msg);
      };

      this._ws.onerror = () => {
        this.onStatus?.({ connected: false, text: "Ошибка соединения" });
      };

      this._ws.onclose = () => {
        this.onStatus?.({
          connected: false,
          text: `Отключено, повтор через ${Math.round(this._reconnectDelay / 1000)} сек…`,
        });
        this._scheduleReconnect();
      };
    } catch {
      this._scheduleReconnect();
    }
  }

  /** Отправить JSON-сообщение на сервер. */
  send(obj) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(obj));
    }
  }

  _scheduleReconnect() {
    if (this._destroyed) return;
    this._reconnectTimer = setTimeout(() => {
      this.connect();
    }, this._reconnectDelay);
    // Экспоненциальная задержка до 30 сек
    this._reconnectDelay = Math.min(this._reconnectDelay * 1.5, 30_000);
  }

  destroy() {
    this._destroyed = true;
    clearTimeout(this._reconnectTimer);
    if (this._ws) {
      this._ws.onopen = null;
      this._ws.onmessage = null;
      this._ws.onclose = null;
      this._ws.onerror = null;
      this._ws.close();
      this._ws = null;
    }
  }
}

/** URL сервера по умолчанию */
export const WS_URL = `ws://${window.location.hostname}:8000/video/ws`;