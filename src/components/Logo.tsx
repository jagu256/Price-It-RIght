export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M30 6h22a6 6 0 0 1 6 6v22a6 6 0 0 1-1.8 4.2L36 58.4a6 6 0 0 1-8.5 0L5.6 36.5a6 6 0 0 1 0-8.5L25.8 7.8A6 6 0 0 1 30 6z"
        fill="#3E5A40"
      />
      <circle cx="46" cy="18" r="4.5" fill="#FAEDA8" />
      <text
        x="29"
        y="41"
        fontFamily="Bricolage Grotesque, Arial, sans-serif"
        fontWeight="800"
        fontSize="20"
        fill="#FBF7EC"
        textAnchor="middle"
      >
        $
      </text>
    </svg>
  );
}
