export default function ResortMarker({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ cursor: 'pointer' }}>
      {/* Hexagon background */}
      <polygon
        points="50,5 90,30 90,70 50,95 10,70 10,30"
        fill="#000044"
        stroke="#fff"
        strokeWidth="3"
      />

      {/* Snowflake */}
      <g transform="translate(50, 50)" stroke="#fff" strokeWidth="3" fill="none">
        {/* Main axes */}
        <line x1="0" y1="-20" x2="0" y2="20" />
        <line x1="-17.3" y1="-10" x2="17.3" y2="10" />
        <line x1="-17.3" y1="10" x2="17.3" y2="-10" />

        {/* Top branches */}
        <line x1="0" y1="-20" x2="-5" y2="-15" />
        <line x1="0" y1="-20" x2="5" y2="-15" />

        {/* Bottom branches */}
        <line x1="0" y1="20" x2="-5" y2="15" />
        <line x1="0" y1="20" x2="5" y2="15" />

        {/* Upper right branches */}
        <line x1="17.3" y1="-10" x2="13" y2="-12" />
        <line x1="17.3" y1="-10" x2="15" y2="-5" />

        {/* Lower left branches */}
        <line x1="-17.3" y1="10" x2="-13" y2="12" />
        <line x1="-17.3" y1="10" x2="-15" y2="5" />

        {/* Upper left branches */}
        <line x1="-17.3" y1="-10" x2="-13" y2="-12" />
        <line x1="-17.3" y1="-10" x2="-15" y2="-5" />

        {/* Lower right branches */}
        <line x1="17.3" y1="10" x2="13" y2="12" />
        <line x1="17.3" y1="10" x2="15" y2="5" />
      </g>
    </svg>
  );
}
