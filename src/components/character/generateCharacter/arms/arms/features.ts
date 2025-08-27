import {
  CHARACTER_STYLE,
  CHARACTER_FEATURE,
  CharacterFeature,
} from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_ARMS_TYPE } from "./types";

export const arms_stylemap = [
  CHARACTER_STYLE.STEEL,
  CHARACTER_STYLE.IRON,
  CHARACTER_STYLE.CERAMIC,
  CHARACTER_STYLE.BRASS,
  CHARACTER_STYLE.COPPER,
  CHARACTER_STYLE.BRONZE,
  CHARACTER_STYLE.SILVER,
  CHARACTER_STYLE.GOLD,
];

export const arms_feature: CharacterFeature = {
  [CHARACTER_ARMS_TYPE.NONE]: {
    variant: CHARACTER_ARMS_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_ARMS_TYPE.ARMOUR]: {
    variant: CHARACTER_ARMS_TYPE.ARMOUR,
    stylemap: arms_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.TEEN,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
};
