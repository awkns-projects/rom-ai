import { CharacterInfo, CHARACTER_FEATURE } from "../definitions";
import {
  dress_feature,
  dress_variant,
  dress_trim_feature,
  dress_trim_variant,
  dress_sleeves_feature,
  dress_sleeves_variant,
  dress_sleeves_trim_feature,
  dress_sleeves_trim_variant,
  cloth_feature,
  cloth_variant,
  overall_feature,
  overall_variant,
  apron_feature,
  apron_variant,
  bandage_feature,
  bandage_variant,
  chainmail_feature,
  chainmail_variant,
  jacket_feature,
  jacket_variant,
  jacket_collar_feature,
  jacket_collar_variant,
  jacket_trim_feature,
  jacket_trim_variant,
  jacket_pockets_feature,
  jacket_pockets_variant,
  vest_feature,
  vest_variant,
  armour_feature,
  armour_variant,
  cape_feature,
  cape_variant,
  cape_trim_feature,
  cape_trim_variant,
  backpack_feature,
  backpack_variant,
  backpack_strap_feature,
  backpack_strap_variant,
  cargo_feature,
  cargo_variant,
  quiver_feature,
  quiver_variant,
  belt_feature,
  belt_variant,
  sash_feature,
  sash_variant,
  sash_tie_feature,
  sash_tie_variant,
  sash_obi_feature,
  sash_obi_variant,
  buckle_feature,
  buckle_variant,
} from "./definitions";

import { randomStyle } from "../functions";

export const generater = (characterInfo: CharacterInfo) => {
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.DRESS,
    dress_feature,
    dress_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.DRESS_TRIM,
    dress_trim_feature,
    dress_trim_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.DRESS_SLEEVES,
    dress_sleeves_feature,
    dress_sleeves_variant
  );
  randomStyle(
    characterInfo,
    CHARACTER_FEATURE.DRESS_SLEEVES_TRIM,
    dress_sleeves_trim_feature,
    dress_sleeves_trim_variant
  );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.CLOTH,
  //   cloth_feature,
  //   cloth_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.OVERALL,
  //   overall_feature,
  //   overall_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.APRON,
  //   apron_feature,
  //   apron_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.BANDAGE,
  //   bandage_feature,
  //   bandage_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.CHAINMAIL,
  //   chainmail_feature,
  //   chainmail_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.JACKET,
  //   jacket_feature,
  //   jacket_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.JACKET_COLLAR,
  //   jacket_collar_feature,
  //   jacket_collar_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.JACKET_TRIM,
  //   jacket_trim_feature,
  //   jacket_trim_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.JACKET_POCKETS,
  //   jacket_pockets_feature,
  //   jacket_pockets_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.VEST,
  //   vest_feature,
  //   vest_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.ARMOUR,
  //   armour_feature,
  //   armour_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.CAPE,
  //   cape_feature,
  //   cape_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.CAPE_TRIM,
  //   cape_trim_feature,
  //   cape_trim_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.BACKPACK,
  //   backpack_feature,
  //   backpack_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.BACKPACK_STRAP,
  //   backpack_strap_feature,
  //   backpack_strap_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.CARGO,
  //   cargo_feature,
  //   cargo_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.QUIVER,
  //   quiver_feature,
  //   quiver_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.BELT,
  //   belt_feature,
  //   belt_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.SASH,
  //   sash_feature,
  //   sash_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.SASH_TIE,
  //   sash_tie_feature,
  //   sash_tie_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.SASH_OBI,
  //   sash_obi_feature,
  //   sash_obi_variant
  // );
  // randomStyle(
  //   characterInfo,
  //   CHARACTER_FEATURE.BUCKLE,
  //   buckle_feature,
  //   buckle_variant
  // );
};
