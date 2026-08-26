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

const collisionDebris = Array.from({ length: 48 }, (_, index) => {
  const angle = (index / 48) * Math.PI * 2;
  const radius = 48 + ((index * 37) % 105);
  return [
    Math.round(Math.cos(angle) * radius),
    Math.round(Math.sin(angle) * radius * 0.58),
    ((index * 83) % 460) - 230,
  ];
});

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

const distantBursts = [
  { top: 15, left: 73, size: 34, delay: -16 },
  { top: 32, left: 45, size: 27, delay: -47 },
  { top: 52, left: 82, size: 31, delay: -72 },
];

const createCollisionEvent = (direction, sequence, source = "keyboard") => {
  const impactX = Math.round(25 + Math.random() * 50);
  const impactY = Math.round(19 + Math.random() * 43);
  const horizontalApproach = direction === "right" || direction === "left";
  const firstSign = direction === "left" || direction === "up" ? 1 : -1;

  return {
    id: `${Date.now()}-${sequence}`,
    direction,
    source,
    size: randomScale(0.78, 1.12),
    impactX,
    impactY,
    aCurveX: horizontalApproach
      ? Math.round(impactX + firstSign * (18 + Math.random() * 8))
      : Math.round(impactX - 12 + Math.random() * 24),
    aCurveY: horizontalApproach
      ? Math.round(impactY + 12 + Math.random() * 12)
      : Math.round(impactY - firstSign * (18 + Math.random() * 8)),
    bCurveX: Math.round(impactX - firstSign * (15 + Math.random() * 10)),
    bCurveY: Math.round(impactY - 10 - Math.random() * 12),
  };
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

      if (!direction || event.repeat || isTyping || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      event.preventDefault();
      keyEventCount.current += 1;
      setKeyEvent(createCollisionEvent(direction, keyEventCount.current));
    };

    window.addEventListener("keydown", handleArrowTrigger);
    return () => window.removeEventListener("keydown", handleArrowTrigger);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let collisionTimer;
    const directions = Object.values(arrowDirections);
    const scheduleNaturalCollision = (initial = false) => {
      const delay = initial
        ? 24000 + Math.random() * 16000
        : 48000 + Math.random() * 26000;
      collisionTimer = window.setTimeout(() => {
        keyEventCount.current += 1;
        const direction = directions[Math.floor(Math.random() * directions.length)];
        setKeyEvent(createCollisionEvent(direction, keyEventCount.current, "natural"));
        scheduleNaturalCollision();
      }, delay);
    };

    scheduleNaturalCollision(true);
    return () => window.clearTimeout(collisionTimer);
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
      {distantBursts.map((burst, burstIndex) => (
        <div
          className="orbital-distant-explosion"
          key={`${burst.top}-${burst.left}`}
          style={{
            top: `${burst.top}%`,
            left: `${burst.left}%`,
            right: "auto",
            "--distant-size": `${burst.size}px`,
            "--distant-delay": `${burst.delay}s`,
          }}
        >
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
                key={`${burstIndex}-${x}-${y}`}
                style={{ "--explosion-x": `${x}px`, "--explosion-y": `${y}px`, "--explosion-delay": `${index * 18}ms` }}
              />
            ))}
          </div>
          <div className="orbital-explosion-dust">
            {explosionDust.map(([x, y], index) => (
              <span
                key={`${burstIndex}-${x}-${y}`}
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
      ))}
      {keyEvent && (
        <div
          key={keyEvent.id}
          className={`orbital-key-event orbital-key-event-${keyEvent.direction}`}
          data-source={keyEvent.source}
          style={{
            "--manual-object-size": keyEvent.size,
            "--impact-x": `${keyEvent.impactX}%`,
            "--impact-y": `${keyEvent.impactY}%`,
          }}
        >
          <img
            src="/orbital-satellite-realistic.png"
            alt=""
            draggable="false"
            className="orbital-key-object orbital-key-object-a"
            style={{
              "--collision-curve-x": `${keyEvent.aCurveX}%`,
              "--collision-curve-y": `${keyEvent.aCurveY}%`,
            }}
          />
          <img
            src="/orbital-asteroid-realistic.png"
            alt=""
            draggable="false"
            className="orbital-key-object orbital-key-object-b orbital-key-object-collision-asteroid"
            style={{
              "--collision-curve-x": `${keyEvent.bCurveX}%`,
              "--collision-curve-y": `${keyEvent.bCurveY}%`,
            }}
          />
          <div className="orbital-key-explosion">
            <span className="orbital-collision-flash" />
            <span className="orbital-collision-shockwave" />
            <span className="orbital-collision-smoke-cloud" />
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
