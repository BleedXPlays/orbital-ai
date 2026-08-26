import { useEffect, useRef, useState } from "react";

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

const collisionDebris = [
  [-92, -24, -170],
  [-74, 18, 125],
  [-58, -38, -95],
  [-42, 31, 210],
  [-25, -17, -145],
  [-12, 42, 88],
  [8, -35, 175],
  [21, 28, -120],
  [38, -18, 245],
  [55, 39, -185],
  [72, -31, 135],
  [91, 16, -225],
  [-103, 8, 155],
  [105, -8, -105],
  [-33, 52, 198],
  [46, 55, -160],
  [-66, -51, 115],
  [67, -53, -205],
  [-118, -12, 75],
  [121, 9, -82],
  [-86, 61, 230],
  [88, 64, -215],
  [-51, 76, 145],
  [54, 79, -135],
  [-17, 68, 190],
  [19, 72, -175],
  [-111, 34, 118],
  [114, 38, -128],
];

const randomScale = (minimum, maximum) =>
  Number((minimum + Math.random() * (maximum - minimum)).toFixed(2));

const createSizeVariation = () => ({
  nearSatellite: randomScale(0.82, 1.18),
  farSatellite: randomScale(0.72, 1.14),
  asteroid: randomScale(0.68, 1.2),
});

const arrowDirections = {
  ArrowRight: "right",
  ArrowLeft: "left",
  ArrowUp: "up",
  ArrowDown: "down",
};

function SpaceTraffic({ variant = "app" }) {
  const [sizeVariation, setSizeVariation] = useState(createSizeVariation);
  const [keyEvent, setKeyEvent] = useState(null);
  const keyEventCount = useRef(0);

  useEffect(() => {
    const variationTimer = window.setInterval(() => {
      setSizeVariation(createSizeVariation());
    }, 40000);

    return () => window.clearInterval(variationTimer);
  }, []);

  useEffect(() => {
    const handleArrowTrigger = (event) => {
      const direction = arrowDirections[event.key];
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (!direction || isTyping || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      event.preventDefault();
      keyEventCount.current += 1;
      setKeyEvent({
        id: `${Date.now()}-${keyEventCount.current}`,
        direction,
        size: randomScale(0.72, 1.16),
      });
    };

    window.addEventListener("keydown", handleArrowTrigger);
    return () => window.removeEventListener("keydown", handleArrowTrigger);
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
        <img
          src="/orbital-collision-explosion.png"
          alt=""
          draggable="false"
          className="orbital-explosion-image orbital-distant-explosion-image"
        />
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
      {keyEvent && (
        <div
          key={keyEvent.id}
          className={`orbital-key-event orbital-key-event-${keyEvent.direction}`}
          style={{ "--manual-object-size": keyEvent.size }}
        >
          <img
            src="/orbital-satellite-realistic.png"
            alt=""
            draggable="false"
            className="orbital-key-object orbital-key-object-a"
          />
          <img
            src="/orbital-asteroid-realistic.png"
            alt=""
            draggable="false"
            className="orbital-key-object orbital-key-object-b orbital-key-object-collision-asteroid"
          />
          <div className="orbital-key-explosion">
            <img
              src="/orbital-collision-explosion.png"
              alt=""
              draggable="false"
              className="orbital-explosion-image orbital-key-explosion-image"
            />
            <div className="orbital-collision-debris">
              {collisionDebris.map(([x, lift, rotation], index) => (
                <span
                  key={`${x}-${lift}`}
                  style={{
                    "--debris-x": `${x}px`,
                    "--debris-lift": `${lift}px`,
                    "--debris-mid-x": `${Math.round(x * 1.35)}px`,
                    "--debris-settle-x": `${Math.round(x * 2)}px`,
                    "--debris-rotation": `${rotation}deg`,
                    "--debris-delay": `${index * 22}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpaceTraffic;
