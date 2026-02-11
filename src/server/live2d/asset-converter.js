export class Asset2JsonConverter {
  static IGNORED_KEYS = new Set([
    "m_GameObject",
    "m_Enabled",
    "m_Script",
    "m_Name",
    "transition",
    "praramGeneralA",
    "paramLoop",
  ]);

  static processBundleFile(bundle, currentPath) {
    if (!bundle?.bundleName || !bundle?.fileName) return null;

    const { bundleName, fileName } = bundle;
    let finalFileName = fileName.replace(/\.bytes$/, "");

    if (bundleName.startsWith("live2d/chara/")) {
      const bundleBaseName = bundleName.substring(bundleName.lastIndexOf("/") + 1);
      const cleanBaseName = bundleBaseName.replace("_rip", "");

      if (cleanBaseName.endsWith("_general")) {
        finalFileName = `../../chara/${bundleBaseName}/${finalFileName}`;
      } else if (cleanBaseName !== currentPath) {
        finalFileName = `../${bundleBaseName}/${finalFileName}`;
      }
    }

    return finalFileName;
  }

  static processCommonItems(items, currentPath, suffix = "") {
    if (Array.isArray(items)) {
      return items
        .map((item) => {
          if (typeof item === "object") {
            const path = this.processBundleFile(item, currentPath);
            if (path && suffix && !path.endsWith(suffix)) {
              return path + suffix;
            }
            return path;
          }
          return item;
        })
        .filter(Boolean);
    }

    if (typeof items === "object") {
      return this.processBundleFile(items, currentPath);
    }

    return items;
  }

  static processMotions(motions, currentPath) {
    if (!Array.isArray(motions)) return {};

    const entries = motions.reduce((acc, item) => {
      if (typeof item === "object") {
        const path = this.processBundleFile(item, currentPath);
        if (path) {
          const name = path.substring(path.lastIndexOf("/") + 1).replace(".mtn", "");
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
      if (typeof item === "object") {
        const file = this.processBundleFile(item, currentPath);
        if (file) {
          const name = file.substring(file.lastIndexOf("/") + 1).replace(".exp.json", "");
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
