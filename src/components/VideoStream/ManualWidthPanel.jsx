import { useState, useEffect } from "react";
import { useStore } from "../../store/Zustand.jsx";

const STATE_LABELS = {
  idle: "Ожидание стабильного сигнала…",
  confirming: "Ожидаем подтверждения ширины…",
  monitoring: "Контроль активен",
};

const ManualWidthPanel = ({ sendMsg }) => {
  const monitorState = useStore((s) => s.monitorState);
  const expectedMm = useStore((s) => s.expectedMm);
  const setAlertBanner = useStore((s) => s.setAlertBanner);
  const setIsFlashing = useStore((s) => s.setIsFlashing);

  const [inputValue, setInputValue] = useState("");

  // Синхронизируем поле ввода при обновлении ожидаемой ширины с сервера
  useEffect(() => {
    if (expectedMm != null) {
      setInputValue(String(Math.round(expectedMm)));
    }
  }, [expectedMm]);

  const handleSet = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0) {
      sendMsg({ type: "set_width", expected_mm: val });
    }
  };

  const handleReset = () => {
    sendMsg({ type: "reset_monitor" });
    setAlertBanner(null);
    setIsFlashing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSet();
  };

  return (
    <div className="manual-panel">
      <label htmlFor="inp-width">Ожидаемая ширина (мм):</label>
      <input
        id="inp-width"
        type="number"
        min="0"
        step="10"
        placeholder="напр. 250"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="inp-width"
      />
      <button className="btn-set-width" onClick={handleSet}>
        Установить
      </button>
      <button className="btn-reset" onClick={handleReset}>
        Сбросить
      </button>
      <span className="monitor-status-label">
        Состояние: {STATE_LABELS[monitorState] ?? monitorState}
      </span>
    </div>
  );
};

export default ManualWidthPanel;
