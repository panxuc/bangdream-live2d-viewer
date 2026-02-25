const ID_PHOTO_BG = "id-photo-blue-white-gradient";
const ID_PHOTO_BLUE = "#3492C4";
const CUSTOM_BG_PREFIX = "custom-bg:";

const DEFAULT_CUSTOM_BACKGROUND = {
  primary: "#e5004f",
  alpha: 100,
  gradient: false,
  secondary: "#ffffff",
  secondaryAlpha: 100,
  direction: "to bottom",
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const isHexColor = (value) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value || "");

const normalizeHexColor = (value, fallback = "#ffffff") => {
  if (!isHexColor(value)) return fallback;
  if (value.length === 4) {
    const r = value[1];
    const g = value[2];
    const b = value[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return value.toLowerCase();
};

const parseHexColor = (value, fallback = "#ffffff") => {
  const hex = normalizeHexColor(value, fallback).slice(1);
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
};

const toRgbaString = (hex, alphaPercent) => {
  const { r, g, b } = parseHexColor(hex);
  const alpha = clamp((alphaPercent || 0) / 100, 0, 1);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const normalizeDirection = (value) =>
  [
    "to bottom",
    "to right",
    "to top",
    "to left",
    "to bottom right",
    "to top left",
    "to top right",
    "to bottom left",
  ].includes(value)
    ? value
    : "to bottom";

const normalizeCustomBackground = (config = {}) => ({
  primary: normalizeHexColor(config.primary, DEFAULT_CUSTOM_BACKGROUND.primary),
  alpha: clamp(Number.parseInt(config.alpha, 10) || 0, 0, 100),
  gradient: Boolean(config.gradient),
  secondary: normalizeHexColor(config.secondary, DEFAULT_CUSTOM_BACKGROUND.secondary),
  secondaryAlpha: clamp(Number.parseInt(config.secondaryAlpha, 10) || 0, 0, 100),
  direction: normalizeDirection(config.direction),
});

const encodeCustomBackground = (config) =>
  `${CUSTOM_BG_PREFIX}${encodeURIComponent(JSON.stringify(normalizeCustomBackground(config)))}`;

const decodeCustomBackground = (value) => {
  if (!value || typeof value !== "string" || !value.startsWith(CUSTOM_BG_PREFIX)) return null;
  try {
    const raw = value.slice(CUSTOM_BG_PREFIX.length);
    return normalizeCustomBackground(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return null;
  }
};

const isCustomBackground = (value) => typeof value === "string" && value.startsWith(CUSTOM_BG_PREFIX);

const resolveBackground = (value) => {
  if (!value || value === "transparent") {
    return { type: "transparent" };
  }

  if (value === ID_PHOTO_BG) {
    return {
      type: "gradient",
      from: { hex: ID_PHOTO_BLUE, alpha: 100 },
      to: { hex: "#ffffff", alpha: 100 },
      direction: "to bottom",
    };
  }

  if (isCustomBackground(value)) {
    const custom = decodeCustomBackground(value) || DEFAULT_CUSTOM_BACKGROUND;
    if (custom.gradient) {
      return {
        type: "gradient",
        from: { hex: custom.primary, alpha: custom.alpha },
        to: { hex: custom.secondary, alpha: custom.secondaryAlpha },
        direction: custom.direction,
      };
    }
    return {
      type: "solid",
      color: { hex: custom.primary, alpha: custom.alpha },
    };
  }

  return {
    type: "solid",
    color: { hex: normalizeHexColor(value, "#ffffff"), alpha: 100 },
  };
};

const getGradientVector = (direction, width, height) => {
  switch (direction) {
    case "to top":
      return [0, height, 0, 0];
    case "to right":
      return [0, 0, width, 0];
    case "to left":
      return [width, 0, 0, 0];
    case "to bottom right":
      return [0, 0, width, height];
    case "to top left":
      return [width, height, 0, 0];
    case "to top right":
      return [0, height, width, 0];
    case "to bottom left":
      return [width, 0, 0, height];
    case "to bottom":
    default:
      return [0, 0, 0, height];
  }
};

const getBackgroundCanvasStyle = (value) => {
  const background = resolveBackground(value);
  if (background.type === "transparent") {
    return { backgroundColor: "transparent", backgroundImage: "none" };
  }

  if (background.type === "solid") {
    return {
      backgroundColor: toRgbaString(background.color.hex, background.color.alpha),
      backgroundImage: "none",
    };
  }

  return {
    backgroundColor: toRgbaString(background.from.hex, background.from.alpha),
    backgroundImage: `linear-gradient(${background.direction}, ${toRgbaString(background.from.hex, background.from.alpha)} 0%, ${toRgbaString(background.to.hex, background.to.alpha)} 100%)`,
  };
};

const getBackgroundSwatchStyle = (value) => {
  if (!value || value === "transparent") {
    return {
      backgroundColor: "transparent",
      backgroundImage:
        "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
      backgroundSize: "8px 8px",
      backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
    };
  }

  return {
    ...getBackgroundCanvasStyle(value),
    backgroundSize: "100% 100%",
    backgroundPosition: "0 0",
  };
};

const drawBackgroundToCanvas = (ctx, width, height, value) => {
  const background = resolveBackground(value);
  if (background.type === "transparent") return;

  if (background.type === "solid") {
    ctx.fillStyle = toRgbaString(background.color.hex, background.color.alpha);
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const [x0, y0, x1, y1] = getGradientVector(background.direction, width, height);
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  gradient.addColorStop(0, toRgbaString(background.from.hex, background.from.alpha));
  gradient.addColorStop(1, toRgbaString(background.to.hex, background.to.alpha));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const isDarkBackground = (value) => {
  const background = resolveBackground(value);
  if (background.type === "transparent") return false;

  const source = background.type === "solid" ? background.color : background.from;
  const { r, g, b } = parseHexColor(source.hex);
  const alpha = clamp((source.alpha || 0) / 100, 0, 1);
  const blended = {
    r: r * alpha + 255 * (1 - alpha),
    g: g * alpha + 255 * (1 - alpha),
    b: b * alpha + 255 * (1 - alpha),
  };
  const luminance = (0.299 * blended.r + 0.587 * blended.g + 0.114 * blended.b) / 255;
  return luminance < 0.55;
};

export {
  ID_PHOTO_BG,
  CUSTOM_BG_PREFIX,
  DEFAULT_CUSTOM_BACKGROUND,
  normalizeCustomBackground,
  encodeCustomBackground,
  decodeCustomBackground,
  isCustomBackground,
  getBackgroundCanvasStyle,
  getBackgroundSwatchStyle,
  drawBackgroundToCanvas,
  isDarkBackground,
};
