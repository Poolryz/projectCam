import { useStore } from "../../store/Zustand.jsx";

const ConfirmBanner = ({ sendMsg }) => {
  const confirmRequest = useStore((s) => s.confirmRequest);
  const setConfirmRequest = useStore((s) => s.setConfirmRequest);

  if (!confirmRequest) return null;

  const handleYes = () => {
    sendMsg({
      type: "confirm_width",
      confirmed: true,
      expected_mm: confirmRequest.suggestedMm,
    });
    setConfirmRequest(null);
  };

  const handleNo = () => {
    sendMsg({ type: "confirm_width", confirmed: false });
    setConfirmRequest(null);
  };

  return (
    <div className="confirm-banner">
      <span className="confirm-text">
        Сервер видит ширину ~{confirmRequest.measuredMm} мм. Подтвердить норму{" "}
        {confirmRequest.suggestedMm} мм?
      </span>
      <button className="btn-yes" onClick={handleYes}>
        Да
      </button>
      <button className="btn-no" onClick={handleNo}>
        Нет
      </button>
    </div>
  );
};

export default ConfirmBanner;
