import {
  CharacterInfo,
  CharacterFeature,
  CharacterVariant,
  CHARACTER_FEATURE,
} from "./definitions";

export const randomStyle = (
  characterInfo: CharacterInfo,
  part: CHARACTER_FEATURE,
  features: CharacterFeature,
  variants: CharacterVariant
) => {
  // variant
  const featureKey = Object.keys(features).filter((key) => {
    const requiredKeys = Object.keys(features[key].required);
    const isAvaile = requiredKeys.length
      ? requiredKeys.find((requiredKey) => {
          return features[key].required[requiredKey].includes(
            characterInfo[requiredKey].variant
          );
        })
      : true;
    return isAvaile;
  });
  let variant;
  if (featureKey) {
    variant = randomFromArray(featureKey);
  }

  // style
  let style: Record<string, any> = {
    variant: "",
    materials: [] as string[],
  };
  if (variant) {
    if (features[variant].stylemap.length) {
      style.variant = randomFromArray(features[variant].stylemap);
      if (style.variant) {
        style.materials = variants[variant].map(
          (materialItem: Record<string, any>) => {
            const sourceKey =
              Object.keys(materialItem.source).find((sourceItem) => {
                return (sourceItem = characterInfo[CHARACTER_FEATURE.PERSON]);
              }) || "";
            return {
              zPosition: materialItem.zPosition,
              source: materialItem.source[sourceKey],
            };
          }
        );
      }
    }
  }

  characterInfo[part] = {
    variant,
    style,
  };
};

export const randomFromArray = (source: any[]) => {
  const total = source.length;
  const randomIndex = Math.round(Math.random() * total) % total;
  const result = (source as any[])[randomIndex];

  return result;
};
