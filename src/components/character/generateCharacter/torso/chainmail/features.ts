import {
  CHARACTER_STYLE,
  CHARACTER_FEATURE,
  CharacterFeature,
} from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_CHAINMAIL_TYPE } from "./types";

export const chainmail_stylemap = [CHARACTER_STYLE.GRAY];

export const chainmail_feature: CharacterFeature = {
  [CHARACTER_CHAINMAIL_TYPE.NONE]: {
    variant: CHARACTER_CHAINMAIL_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_CHAINMAIL_TYPE.CHAINMAIL]: {
    variant: CHARACTER_CHAINMAIL_TYPE.CHAINMAIL,
    stylemap: chainmail_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.TEEN,
      ],
    },
  },
};
