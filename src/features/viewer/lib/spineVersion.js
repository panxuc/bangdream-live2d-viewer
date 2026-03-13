import { BinaryInput } from "pixi-spine";

const KNOWN_SPINE_VERSION_KEYS = ["3.7", "3.8", "4.0", "4.1"];

export const toKnownSpineVersionKey = (value = "") => {
  const normalizedValue = String(value || "").trim();
  return KNOWN_SPINE_VERSION_KEYS.find((prefix) => normalizedValue.startsWith(prefix)) || null;
};

export const normalizeSpineVersionKey = (value = "") => toKnownSpineVersionKey(value) || "4.1";

export const pickSpineBinaryVersionKey = (oldFormatVersion = "", newFormatVersion = "") => {
  const oldKey = toKnownSpineVersionKey(oldFormatVersion);
  if (oldKey === "3.7" || oldKey === "3.8") {
    return oldKey;
  }

  const newKey = toKnownSpineVersionKey(newFormatVersion);
  if (newKey) {
    return newKey;
  }

  return oldKey || "4.1";
};

export const detectSpineBinaryVersion = (bytes) => {
  const readOldFormatVersion = () => {
    try {
      const input = new BinaryInput(bytes);
      input.readString();
      return input.readString() || "";
    } catch {
      return "";
    }
  };

  const readNewFormatVersion = () => {
    try {
      const input = new BinaryInput(bytes);
      input.readInt32();
      input.readInt32();
      return input.readString() || "";
    } catch {
      return "";
    }
  };

  return pickSpineBinaryVersionKey(readOldFormatVersion(), readNewFormatVersion());
};
