const getBaseName = (path) => path.replace(/\\/g, "/").split("/").pop() || path;

export const toControlModelData = (data) => {
  if (!data) {
    return { motions: null, expressions: [] };
  }

  if (data.FileReferences) {
    const expressions = Array.isArray(data.FileReferences.Expressions)
      ? data.FileReferences.Expressions.map((item) => ({
          name: item?.Name || getBaseName(item?.File || ""),
          file: item?.File || "",
        }))
      : [];

    return {
      motions: data.FileReferences.Motions || null,
      expressions,
    };
  }

  return {
    motions: data.motions || null,
    expressions: data.expressions || [],
  };
};

export const toProcessedMotionGroups = (sourceJson, sourceBaseUrl) => {
  const sourceMotionData = sourceJson?.FileReferences?.Motions || sourceJson?.motions || {};
  const processedMotions = {};

  Object.keys(sourceMotionData).forEach((groupName) => {
    const motionList = sourceMotionData[groupName];
    if (!Array.isArray(motionList)) return;

    processedMotions[groupName] = motionList.map((motion) => {
      const nextMotion = { ...motion };

      if (nextMotion.file) {
        nextMotion.file = new URL(nextMotion.file, window.location.origin + sourceBaseUrl).href;
      }
      if (nextMotion.File) {
        nextMotion.File = new URL(nextMotion.File, window.location.origin + sourceBaseUrl).href;
      }
      if (nextMotion.sound) {
        nextMotion.sound = new URL(nextMotion.sound, window.location.origin + sourceBaseUrl).href;
      }
      if (nextMotion.Sound) {
        nextMotion.Sound = new URL(nextMotion.Sound, window.location.origin + sourceBaseUrl).href;
      }

      return nextMotion;
    });
  });

  return processedMotions;
};

export const toProcessedExpressions = (sourceJson, sourceBaseUrl) => {
  const sourceExpressions = sourceJson?.FileReferences?.Expressions || sourceJson?.expressions || [];
  if (!Array.isArray(sourceExpressions)) return [];

  return sourceExpressions
    .map((expression) => {
      const nextExpression = { ...expression };
      if (nextExpression.File) {
        nextExpression.File = new URL(nextExpression.File, window.location.origin + sourceBaseUrl).href;
      }
      if (nextExpression.file) {
        nextExpression.file = new URL(nextExpression.file, window.location.origin + sourceBaseUrl).href;
      }
      return nextExpression;
    })
    .filter((expression) => expression?.File || expression?.file);
};

export const applyProcessedMotions = (targetJson, targetBaseUrl, processedMotions) => {
  const hybridModelData = {
    ...targetJson,
    url: targetBaseUrl,
  };

  if (hybridModelData.FileReferences && hybridModelData.FileReferences.Motions !== undefined) {
    hybridModelData.FileReferences = {
      ...hybridModelData.FileReferences,
      Motions: processedMotions,
    };
  } else {
    hybridModelData.motions = processedMotions;
  }

  return hybridModelData;
};

export const applyProcessedExpressions = (targetJson, targetBaseUrl, processedExpressions) => {
  const hybridModelData = {
    ...targetJson,
    url: targetBaseUrl,
  };

  if (hybridModelData.FileReferences && hybridModelData.FileReferences.Expressions !== undefined) {
    hybridModelData.FileReferences = {
      ...hybridModelData.FileReferences,
      Expressions: processedExpressions.map((expression) => ({
        Name: expression.Name || expression.name || getBaseName(expression.File || expression.file || ""),
        File: expression.File || expression.file || "",
      })),
    };
  } else {
    hybridModelData.expressions = processedExpressions.map((expression) => ({
      name: expression.name || expression.Name || getBaseName(expression.file || expression.File || ""),
      file: expression.file || expression.File || "",
    }));
  }

  return hybridModelData;
};
