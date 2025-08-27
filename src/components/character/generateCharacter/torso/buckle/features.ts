import {
  CHARACTER_STYLE,
  CHARACTER_FEATURE,
  CharacterFeature,
} from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BUCKLE_TYPE } from "./types";

export const buckle_stylemap = [
  CHARACTER_STYLE.BRONZE,
  CHARACTER_STYLE.GOLD,
  CHARACTER_STYLE.IRON,
  CHARACTER_STYLE.SILVER,
];

export const buckle_feature: CharacterFeature = {
  [CHARACTER_BUCKLE_TYPE.NONE]: {
    variant: CHARACTER_BUCKLE_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_BUCKLE_TYPE.BUCKLE]: {
    variant: CHARACTER_BUCKLE_TYPE.BUCKLE,
    stylemap: buckle_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [CHARACTER_PERSON_TYPE.FEMALE],
    },
  },
};
