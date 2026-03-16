import { useStore } from "../../store/Zustand.jsx";

const AlertBanner = () => {
  const alertBanner = useStore((s) => s.alertBanner);

  if (!alertBanner) return null;

  return (
    <div className={`alert-banner ${alertBanner.cssClass}`}>
      {alertBanner.text}
    </div>
  );
};

export default AlertBanner;
