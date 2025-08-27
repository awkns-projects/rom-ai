import {
  CHARACTER_STYLE,
  CHARACTER_FEATURE,
  CharacterFeature,
} from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BANDAGE_TYPE } from "./types";

export const bandage_stylemap = [CHARACTER_STYLE.WHITE];

export const bandage_feature: CharacterFeature = {
  [CHARACTER_BANDAGE_TYPE.NONE]: {
    variant: CHARACTER_BANDAGE_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_BANDAGE_TYPE.BANDAGE]: {
    variant: CHARACTER_BANDAGE_TYPE.BANDAGE,
    stylemap: bandage_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.TEEN,
      ],
    },
  },
};
