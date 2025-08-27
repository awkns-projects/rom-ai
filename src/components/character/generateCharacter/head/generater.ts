import { CharacterInfo, CHARACTER_FEATURE } from "../definitions";
import {
  head_feature,
  head_variant,
  ears_feature,
  ears_variant,
  ears_inner_feature,
  ears_inner_variant,
  furry_ears_feature,
  furry_ears_variant,
  furry_ears_skin_feature,
  furry_ears_skin_variant,
  nose_feature,
  nose_variant,
  eyes_feature,
  eyes_variant,
  eyebrows_feature,
  eyebrows_variant,
  wrinkles_feature,
  wrinkles_variant,
  beard_feature,
  beard_variant,
  mustache_feature,
  mustache_variant,
  hair_feature,
  hair_variant,
  hair_extension_left_feature,
  hair_extension_left_variant,
  hair_extension_right_feature,
  hair_extension_right_variant,
  horns_feature,
  horns_variant,
  fins_feature,
  fins_variant,
  headcover_feature,
  headcover_variant,
  headcover_rune_feature,
  headcover_rune_variant,
  hairtie_feature,
  hairtie_variant,
  hairtie_rune_feature,
  hairtie_rune_variant,
  bandana_feature,
  bandana_variant,
  hat_feature,
  hat_variant,
  visor_feature,
  visor_variant,
  accessory_feature,
  accessory_variant,
  facial_eyes_feature,
  facial_eyes_variant,
  facial_left_feature,
  facial_left_variant,
  facial_left_trim_feature,
  facial_left_trim_variant,
  facial_right_feature,
  facial_right_variant,
  facial_right_trim_feature,
  facial_right_trim_variant,
  facial_mask_feature,
  facial_mask_variant,
  earring_left_feature,
  earring_left_variant,
  earring_right_feature,
  earring_right_variant,
  neck_feature,
  neck_variant,
  necklace_feature,
  necklace_variant,
} from "./definitions";

import { randomStyle } from "../functions";

export const generater = (characterInfo: CharacterInfo) => {
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.HEAD,
    head_feature,
    head_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.EARS,
    ears_feature,
    ears_variant
  );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.EARS_INNER,
  //   ears_inner_feature,
  //   ears_inner_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.FURRY_EARS,
  //   furry_ears_feature,
  //   furry_ears_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.FURRY_EARS_SKIN,
  //   furry_ears_skin_feature,
  //   furry_ears_skin_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.NOSE,
  //   nose_feature,
  //   nose_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.EYES,
  //   eyes_feature,
  //   eyes_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.EYEBROWS,
  //   eyebrows_feature,
  //   eyebrows_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.WRINKLES,
  //   wrinkles_feature,
  //   wrinkles_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.BEARD,
  //   beard_feature,
  //   beard_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.MUSTACHE,
  //   mustache_feature,
  //   mustache_variant
  // );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.HAIR,
    hair_feature,
    hair_variant
  );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.HAIR_EXTENSION_LEFT,
  //   hair_extension_left_feature,
  //   hair_extension_left_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.HAIR_EXTENSION_RIGHT,
  //   hair_extension_right_feature,
  //   hair_extension_right_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.HORNS,
  //   horns_feature,
  //   horns_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.FINS,
  //   fins_feature,
  //   fins_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.HEADCOVER,
  //   headcover_feature,
  //   headcover_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.HEADCOVER_RUNE,
  //   headcover_rune_feature,
  //   headcover_rune_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.HAIRTIE,
  //   hairtie_feature,
  //   hairtie_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.HAIRTIE_RUNE,
  //   hairtie_rune_feature,
  //   hairtie_rune_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.BANDANA,
  //   bandana_feature,
  //   bandana_variant
  // );
  // randomStyle(characterInfo, CHARACTER_FEATURE.HAT, hat_feature, hat_variant);
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.VISOR,
  //   visor_feature,
  //   visor_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.ACCESSORY,
  //   accessory_feature,
  //   accessory_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.FACIAL_EYES,
  //   facial_eyes_feature,
  //   facial_eyes_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.FACIAL_LEFT,
  //   facial_left_feature,
  //   facial_left_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.FACIAL_LEFT_TRIM,
  //   facial_left_trim_feature,
  //   facial_left_trim_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.FACIAL_RIGHT,
  //   facial_right_feature,
  //   facial_right_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.FACIAL_RIGHT_TRIM,
  //   facial_right_trim_feature,
  //   facial_right_trim_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.FACIAL_MASK,
  //   facial_mask_feature,
  //   facial_mask_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.EARRING_LEFT,
  //   earring_left_feature,
  //   earring_left_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.EARRING_RIGHT,
  //   earring_right_feature,
  //   earring_right_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.NECK,
  //   neck_feature,
  //   neck_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.NECKLACE,
  //   necklace_feature,
  //   necklace_variant
  // );
};
