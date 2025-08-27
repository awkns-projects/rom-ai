import { CharacterInfo, CHARACTER_FEATURE } from "../definitions";
import {
  body_feature,
  body_variant,
  shadow_feature,
  shadow_variant,
  wound_arm_feature,
  wound_arm_variant,
  wound_brain_feature,
  wound_brain_variant,
  wound_ribs_feature,
  wound_ribs_variant,
  wound_eye_feature,
  wound_eye_variant,
  wound_mouth_feature,
  wound_mouth_variant,
  prosthesis_hand_feature,
  prosthesis_hand_variant,
  prosthesis_leg_feature,
  prosthesis_leg_variant,
  tail_feature,
  tail_variant,
  wings_feature,
  wings_variant,
  wings_edge_feature,
  wings_edge_variant,
  wings_dots_feature,
  wings_dots_variant,
} from "./definitions";

import { randomStyle } from "../functions";

export const generater = (characterInfo: CharacterInfo) => {
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.BODY,
    body_feature,
    body_variant
  );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.SHADOW,
  //   shadow_feature,
  //   shadow_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.WOUND_ARM,
  //   wound_arm_feature,
  //   wound_arm_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.WOUND_BRAIN,
  //   wound_brain_feature,
  //   wound_brain_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.WOUND_RIBS,
  //   wound_ribs_feature,
  //   wound_ribs_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.WOUND_EYE,
  //   wound_eye_feature,
  //   wound_eye_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.WOUND_MOUTH,
  //   wound_mouth_feature,
  //   wound_mouth_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.PROSTHESIS_HAND,
  //   prosthesis_hand_feature,
  //   prosthesis_hand_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.PROSTHESIS_LEG,
  //   prosthesis_leg_feature,
  //   prosthesis_leg_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.TAIL,
  //   tail_feature,
  //   tail_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.WINGS,
  //   wings_feature,
  //   wings_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.WINGS_EDGE,
  //   wings_edge_feature,
  //   wings_edge_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.WINGS_DOTS,
  //   wings_dots_feature,
  //   wings_dots_variant
  // );
};
