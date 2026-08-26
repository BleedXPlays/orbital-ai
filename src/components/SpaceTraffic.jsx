const Satellite = ({ className = "" }) => (
  <img
    src="/orbital-satellite-realistic.png"
    alt=""
    draggable="false"
    className={className}
  />
);

const explosionSparks = [
  [18, -12],
  [14, 11],
  [-16, -10],
  [-20, 8],
  [3, -19],
  [-4, 18],
  [22, 2],
  [-23, -2],
];

function SpaceTraffic({ variant = "app" }) {
  return (
    <div
      className={`orbital-space-traffic ${variant === "login" ? "orbital-space-traffic-login" : ""}`}
      aria-hidden="true"
    >
      <div className="orbital-flight orbital-flight-satellite-one">
        <Satellite className="orbital-realistic-satellite orbital-realistic-satellite-near" />
      </div>
      <div className="orbital-flight orbital-flight-satellite-two">
        <Satellite className="orbital-realistic-satellite orbital-realistic-satellite-far" />
      </div>
      <div className="orbital-flight orbital-flight-asteroid">
        <img
          src="/orbital-asteroid-realistic.png"
          alt=""
          draggable="false"
          className="orbital-realistic-asteroid"
        />
      </div>
      <div className="orbital-distant-explosion">
        <span className="orbital-explosion-halo" />
        <span className="orbital-explosion-core" />
        <span className="orbital-explosion-smoke" />
        <div className="orbital-explosion-sparks">
          {explosionSparks.map(([x, y], index) => (
            <span
              key={`${x}-${y}`}
              style={{ "--explosion-x": `${x}px`, "--explosion-y": `${y}px`, "--explosion-delay": `${index * 18}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpaceTraffic;
