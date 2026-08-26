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

const explosionDust = [
  [28, -18],
  [36, 6],
  [21, 25],
  [-12, 31],
  [-34, 17],
  [-38, -8],
  [-22, -27],
  [7, -34],
  [44, -16],
  [12, 42],
  [-46, 4],
  [-7, -43],
];

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
        <div className="orbital-explosion-dust">
          {explosionDust.map(([x, y], index) => (
            <span
              key={`${x}-${y}`}
              style={{
                "--dust-x": `${x}px`,
                "--dust-y": `${y}px`,
                "--dust-mid-x": `${Math.round(x * 0.72)}px`,
                "--dust-mid-y": `${Math.round(y * 0.72)}px`,
                "--dust-far-x": `${Math.round(x * 1.18)}px`,
                "--dust-far-y": `${Math.round(y * 1.18) - 5}px`,
                "--dust-delay": `${index * 35}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpaceTraffic;
import { useEffect, useState } from "react";
