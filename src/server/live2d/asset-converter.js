export class Asset2JsonConverter {
  static BYTES_EXTENSION = /\.bytes$/;

  static LIVE2D_CHARA_PREFIX = "live2d/chara/";

  static GENERAL_SUFFIX = "_general";

  static IGNORED_KEYS = new Set([
    "m_GameObject",
    "m_Enabled",
    "m_Script",
    "m_Name",
    "transition",
    "praramGeneralA",
    "paramLoop",
  ]);

  static isObject(value) {
    return value !== null && typeof value === "object";
  }

  static getBundleBaseName(bundleName) {
    return bundleName.substring(bundleName.lastIndexOf("/") + 1);
  }

  static getFileName(path) {
    return path.substring(path.lastIndexOf("/") + 1);
  }

  static normalizeFileName(fileName) {
    return fileName.replace(this.BYTES_EXTENSION, "");
  }

  static resolveBundledPath(bundleName, currentPath, fileName) {
    if (!bundleName.startsWith(this.LIVE2D_CHARA_PREFIX)) {
      return fileName;
    }

    const bundleBaseName = this.getBundleBaseName(bundleName);
    const cleanBaseName = bundleBaseName.replace("_rip", "");

    if (cleanBaseName.endsWith(this.GENERAL_SUFFIX)) {
      return `../../chara/${bundleBaseName}/${fileName}`;
    }

    if (cleanBaseName !== currentPath) {
      return `../${bundleBaseName}/${fileName}`;
    }

    return fileName;
  }

  static ensureSuffix(path, suffix) {
    if (!suffix || path.endsWith(suffix)) {
      return path;
    }

    return path + suffix;
  }

  static processBundleFile(bundle, currentPath) {
    if (!bundle?.bundleName || !bundle?.fileName) return null;

    const { bundleName, fileName } = bundle;
    const normalizedFile = this.normalizeFileName(fileName);
    return this.resolveBundledPath(bundleName, currentPath, normalizedFile);
  }

  static processBundleObject(item, currentPath, suffix = "") {
    if (!this.isObject(item)) {
      return item;
    }

    const path = this.processBundleFile(item, currentPath);
    return path ? this.ensureSuffix(path, suffix) : null;
  }

  static processCommonItems(items, currentPath, suffix = "") {
    if (Array.isArray(items)) {
      return items
        .map((item) => this.processBundleObject(item, currentPath, suffix))
        .filter(Boolean);
    }

    if (this.isObject(items)) {
      return this.processBundleObject(items, currentPath, suffix);
    }

    return items;
  }

  static processMotions(motions, currentPath) {
    if (!Array.isArray(motions)) return {};

    const entries = motions.reduce((acc, item) => {
      if (this.isObject(item)) {
        const path = this.processBundleFile(item, currentPath);
        if (path) {
          const name = this.getFileName(path).replace(".mtn", "");
          acc.push([name, [{ file: path }]]);
        }
      }
      return acc;
    }, []);

    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return Object.fromEntries(entries);
  }

  static processExpressions(expressions, currentPath) {
    if (!Array.isArray(expressions)) return [];

    const processed = expressions.reduce((acc, item) => {
      if (this.isObject(item)) {
        const file = this.processBundleFile(item, currentPath);
        if (file) {
          const name = this.getFileName(file).replace(".exp.json", "");
          acc.push({ name, file });
        }
      }
      return acc;
    }, []);

    return processed.sort((a, b) => a.name.localeCompare(b.name));
  }

  static processFile(data, currentPath) {
    let baseData = {};

    if (!data?.Base) {
      baseData = { ...data };
    } else {
      baseData = { ...data.Base };

      if (baseData.model) {
        baseData.model = this.processCommonItems(baseData.model, currentPath);
      }
      if (baseData.physics) {
        baseData.physics = this.processCommonItems(baseData.physics, currentPath);
      }
      if (baseData.textures) {
        baseData.textures = this.processCommonItems(baseData.textures, currentPath, ".png");
      }
      if (baseData.motions) {
        baseData.motions = this.processMotions(baseData.motions, currentPath);
      }
      if (baseData.expressions) {
        baseData.expressions = this.processExpressions(baseData.expressions, currentPath);
      }
    }

    Object.keys(baseData).forEach((key) => {
      if (this.IGNORED_KEYS.has(key)) {
        delete baseData[key];
      }
    });

    return baseData;
  }
}
