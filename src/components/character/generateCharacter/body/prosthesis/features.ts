import {
  CHARACTER_STYLE,
  CHARACTER_FEATURE,
  CharacterFeature,
} from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_PROSTHESIS_TYPE } from "./types";

export const prosthesis_hand_stylemap = [CHARACTER_STYLE.HOOK];

export const prosthesis_hand_feature: CharacterFeature = {
  [CHARACTER_PROSTHESIS_TYPE.NONE]: {
    variant: CHARACTER_PROSTHESIS_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_PROSTHESIS_TYPE.PROSTHESIS]: {
    variant: CHARACTER_PROSTHESIS_TYPE.PROSTHESIS,
    stylemap: prosthesis_hand_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [CHARACTER_PERSON_TYPE.MALE],
    },
  },
};

export const prosthesis_leg_stylemap = [CHARACTER_STYLE.PEG_LEG];

export const prosthesis_leg_feature: CharacterFeature = {
  [CHARACTER_PROSTHESIS_TYPE.NONE]: {
    variant: CHARACTER_PROSTHESIS_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_PROSTHESIS_TYPE.PROSTHESIS]: {
    variant: CHARACTER_PROSTHESIS_TYPE.PROSTHESIS,
    stylemap: prosthesis_leg_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [CHARACTER_PERSON_TYPE.MALE],
    },
  },
};
