const Satellite = ({ className = "" }) => (
  <img
    src="/orbital-satellite-realistic.png"
    alt=""
    draggable="false"
    className={className}
  />
);

const Spacecraft = () => (
  <div className="orbital-realistic-spacecraft">
    <div className="orbital-engine-glow" />
    <div className="orbital-exhaust-plume">
      <span className="orbital-flame orbital-flame-outer" />
      <span className="orbital-flame orbital-flame-core" />
    </div>
    <div className="orbital-sparks">
      {Array.from({ length: 18 }, (_, index) => (
        <span key={index} style={{ "--spark-index": index }} />
      ))}
    </div>
    <img
      src="/orbital-spacecraft-realistic.png"
      alt=""
      draggable="false"
    />
  </div>
);

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
      <div className="orbital-flight orbital-flight-spacecraft">
        <Spacecraft />
      </div>
      <div className="orbital-flight orbital-flight-asteroid">
        <img
          src="/orbital-asteroid-realistic.png"
          alt=""
          draggable="false"
          className="orbital-realistic-asteroid"
        />
      </div>
    </div>
  );
}

export default SpaceTraffic;
