import { useEffect, useState } from "react";

const Satellite = ({ className = "" }) => (
  <img
    src="/orbital-satellite-realistic.png"
    alt=""
    draggable="false"
    className={className}
  />
);

const randomScale = (minimum, maximum) =>
  Number((minimum + Math.random() * (maximum - minimum)).toFixed(2));

const createSizeVariation = () => ({
  nearSatellite: randomScale(0.82, 1.18),
  farSatellite: randomScale(0.72, 1.14),
  asteroid: randomScale(0.68, 1.2),
});

function SpaceTraffic({ variant = "app" }) {
  const [sizeVariation, setSizeVariation] = useState(createSizeVariation);

  useEffect(() => {
    const variationTimer = window.setInterval(() => {
      setSizeVariation(createSizeVariation());
    }, 40000);

    return () => window.clearInterval(variationTimer);
  }, []);

  return (
    <div
      className={`orbital-space-traffic ${variant === "login" ? "orbital-space-traffic-login" : ""}`}
      aria-hidden="true"
    >
      <div
        className="orbital-flight orbital-flight-satellite-one"
        style={{ "--object-size": sizeVariation.nearSatellite }}
      >
        <Satellite className="orbital-realistic-satellite orbital-realistic-satellite-near" />
      </div>
      <div
        className="orbital-flight orbital-flight-satellite-two"
        style={{ "--object-size": sizeVariation.farSatellite }}
      >
        <Satellite className="orbital-realistic-satellite orbital-realistic-satellite-far" />
      </div>
      <div
        className="orbital-flight orbital-flight-asteroid"
        style={{ "--object-size": sizeVariation.asteroid }}
      >
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
