import { CharacterInfo, CHARACTER_FEATURE } from "../definitions";
import {
  shoulders_feature,
  shoulders_variant,
  arms_feature,
  arms_variant,
  bauldron_feature,
  bauldron_variant,
  bracers_feature,
  bracers_variant,
  wrists_feature,
  wrists_variant,
  gloves_feature,
  gloves_variant,
} from "./definitions";

import { randomStyle } from "../functions";

export const generater = (characterInfo: CharacterInfo) => {
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.SHOULDERS,
    shoulders_feature,
    shoulders_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.ARMS,
    arms_feature,
    arms_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.BAULDRON,
    bauldron_feature,
    bauldron_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.BRACERS,
    bracers_feature,
    bracers_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.WRISTS,
    wrists_feature,
    wrists_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.GLOVES,
    gloves_feature,
    gloves_variant
  );
};
