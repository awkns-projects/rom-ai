import {
  CHARACTER_STYLE,
  CHARACTER_FEATURE,
  CharacterFeature,
} from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BAULDRON_TYPE } from "./types";

export const bauldron_stylemap = [
  CHARACTER_STYLE.BROWN,
  CHARACTER_STYLE.CHARCOAL,
  CHARACTER_STYLE.LEATHER,
  CHARACTER_STYLE.SLATE,
  CHARACTER_STYLE.TAN,
  CHARACTER_STYLE.WALNUT,
  CHARACTER_STYLE.WHITE
];

export const bauldron_feature: CharacterFeature = {
  [CHARACTER_BAULDRON_TYPE.NONE]: {
    variant: CHARACTER_BAULDRON_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_BAULDRON_TYPE.BAULDRON]: {
    variant: CHARACTER_BAULDRON_TYPE.BAULDRON,
    stylemap: bauldron_stylemap,
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
