const Satellite = ({ className = "" }) => (
  <svg
    viewBox="0 0 120 58"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="satellite-panel" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#72B7FF" />
        <stop offset="1" stopColor="#6149D8" />
      </linearGradient>
      <filter id="satellite-glow" x="-60%" y="-100%" width="220%" height="300%">
        <feGaussianBlur stdDeviation="3.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#satellite-glow)">
      <path d="M45 19H75V39H45z" fill="#BFD9FF" fillOpacity=".86" />
      <path d="M52 14H68L75 19H45L52 14Z" fill="#F1F6FF" fillOpacity=".8" />
      <path d="M58 12V5M55 5H61" stroke="#BDE5FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M41 23H35M85 23H79" stroke="#C4E6FF" strokeWidth="2" />
      <path d="M4 12H35V46H4zM85 12H116V46H85z" fill="url(#satellite-panel)" fillOpacity=".68" stroke="#9ACDFF" />
      <path d="M14 12V46M24 12V46M95 12V46M105 12V46M4 29H35M85 29H116" stroke="#C4E6FF" strokeOpacity=".45" />
      <circle cx="60" cy="29" r="5" fill="#5EEAD4" fillOpacity=".82" />
    </g>
  </svg>
);

const Spacecraft = ({ className = "" }) => (
  <svg
    viewBox="0 0 150 64"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="craft-body" x1="50" y1="12" x2="116" y2="51">
        <stop stopColor="#F4F8FF" />
        <stop offset=".52" stopColor="#91BFFF" />
        <stop offset="1" stopColor="#6555E8" />
      </linearGradient>
      <linearGradient id="craft-trail" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#5EE7FF" stopOpacity="0" />
        <stop offset="1" stopColor="#8B72FF" stopOpacity=".82" />
      </linearGradient>
      <filter id="craft-glow" x="-80%" y="-150%" width="280%" height="400%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#craft-glow)">
      <path d="M7 32L57 25V39L7 32Z" fill="url(#craft-trail)" />
      <path d="M53 21C77 8 111 10 138 32C111 54 77 56 53 43L66 32L53 21Z" fill="url(#craft-body)" />
      <path d="M83 17L66 5L70 24M83 47L66 59L70 40" fill="#6D72E8" fillOpacity=".9" />
      <ellipse cx="111" cy="27" rx="10" ry="7" fill="#071426" stroke="#7FE4FF" strokeWidth="2" />
      <circle cx="113" cy="25" r="2.5" fill="#DDF8FF" />
    </g>
  </svg>
);

function SpaceTraffic() {
  return (
    <div className="orbital-space-traffic" aria-hidden="true">
      <div className="orbital-flight orbital-flight-satellite-one">
        <Satellite className="h-auto w-20" />
      </div>
      <div className="orbital-flight orbital-flight-satellite-two">
        <Satellite className="h-auto w-14" />
      </div>
      <div className="orbital-flight orbital-flight-spacecraft">
        <Spacecraft className="h-auto w-24" />
      </div>
    </div>
  );
}

export default SpaceTraffic;
