import { CharacterInfo, CHARACTER_FEATURE } from "../definitions";
import {
  weapon_feature,
  weapon_variant,
  weapon_magic_crystal_feature,
  weapon_magic_crystal_variant,
  shield_feature,
  shield_variant,
  shield_trim_feature,
  shield_trim_variant,
  shield_paint_feature,
  shield_paint_variant,
  shield_pattern_feature,
  shield_pattern_variant,
} from "./definitions";

import { randomStyle } from "../functions";

export const generater = (characterInfo: CharacterInfo) => {
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.WEAPON,
    weapon_feature,
    weapon_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.WEAPON_MAGIC_CRYSTAL,
    weapon_magic_crystal_feature,
    weapon_magic_crystal_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.SHIELD,
    shield_feature,
    shield_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.SHIELD_TRIM,
    shield_trim_feature,
    shield_trim_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.SHIELD_PAIN,
    shield_paint_feature,
    shield_paint_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.SHIELD_PATTERN,
    shield_pattern_feature,
    shield_pattern_variant
  );
};
