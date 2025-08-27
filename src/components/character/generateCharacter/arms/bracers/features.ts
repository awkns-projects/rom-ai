import {
  CHARACTER_STYLE,
  CHARACTER_FEATURE,
  CharacterFeature,
} from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BRACERS_TYPE } from "./types";

export const bracers_stylemap = [
  CHARACTER_STYLE.STEEL,
  CHARACTER_STYLE.IRON,
  CHARACTER_STYLE.CERAMIC,
  CHARACTER_STYLE.BRASS,
  CHARACTER_STYLE.COPPER,
  CHARACTER_STYLE.BRONZE,
  CHARACTER_STYLE.SILVER,
  CHARACTER_STYLE.GOLD,
];

export const bracers_feature: CharacterFeature = {
  [CHARACTER_BRACERS_TYPE.NONE]: {
    variant: CHARACTER_BRACERS_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_BRACERS_TYPE.BRACERS]: {
    variant: CHARACTER_BRACERS_TYPE.BRACERS,
    stylemap: bracers_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
};
