import { create } from "zustand";

/**
 * Глобальное состояние приложения.
 *
 * wsConnected    – WebSocket подключён
 * wsStatusText   – строка статуса соединения
 * fps            – текущий FPS видеопотока
 * meta           – метаданные последнего кадра { ok, width_mm, width_mm_2dp, confidence, ... }
 * hasFrame       – был ли получен хотя бы один кадр
 * monitorState   – 'idle' | 'confirming' | 'monitoring'
 * expectedMm     – ожидаемая ширина металла (мм) или null
 * bounds         – допуск [min, max] (мм) или null
 * alertBanner    – { text, cssClass } | null  — баннер тревоги
 * confirmRequest – { suggestedMm, measuredMm } | null  — запрос подтверждения
 * isFlashing     – мигание canvas при выходе за допуск
 * lampOn         – true (тревога) | false (норма) | null (статус неизвестен)
 */
const useStore = create((set) => ({
  wsConnected: false,
  wsStatusText: "Подключение…",
  fps: 0,
  meta: null,
  hasFrame: false,
  monitorState: "idle",
  expectedMm: null,
  bounds: null,
  alertBanner: null,
  confirmRequest: null,
  isFlashing: false,
  lampOn: null,

  setWsConnected: (v) => set({ wsConnected: Boolean(v) }),
  setWsStatusText: (v) => set({ wsStatusText: v }),
  setFps: (fps) => set({ fps }),
  setMeta: (meta) => set({ meta }),
  setHasFrame: (v) => set({ hasFrame: v }),
  setMonitorState: (v) => set({ monitorState: v }),
  setExpectedMm: (v) => set({ expectedMm: v }),
  setBounds: (v) => set({ bounds: v }),
  setAlertBanner: (v) => set({ alertBanner: v }),
  setConfirmRequest: (v) => set({ confirmRequest: v }),
  setIsFlashing: (v) => set({ isFlashing: v }),
  setLampOn: (v) => set({ lampOn: v }),
}));

export { useStore };
