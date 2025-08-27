import { CharacterInfo, CHARACTER_FEATURE } from "../definitions";
import {
  legs_feature,
  legs_variant,
  shoes_feature,
  shoes_variant,
  socks_feature,
  socks_variant,
} from "./definitions";

import { randomStyle } from "../functions";

export const generater = (characterInfo: CharacterInfo) => {
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.LEGS,
    legs_feature,
    legs_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.SHOES,
    shoes_feature,
    shoes_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.SOCKS,
    socks_feature,
    socks_variant
  );
};
