import logo from '../assets/logo.jpg';

// Holzschnitt-Zeichen: Steinhügel mit Laterne (Waldwegmarke bei Nacht).
export default function Mark({ size = 48, className = '' }) {
  return (
    <img
      className={`mark ${className}`.trim()}
      src={logo}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="eager"
    />
  );
}
