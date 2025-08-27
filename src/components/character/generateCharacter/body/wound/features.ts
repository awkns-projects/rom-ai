import {
  CHARACTER_STYLE,
  CHARACTER_FEATURE,
  CharacterFeature,
} from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_WOUND_TYPE } from "./types";

export const wound_arm_stylemap = [CHARACTER_STYLE.ARM];

export const wound_arm_feature: CharacterFeature = {
  [CHARACTER_WOUND_TYPE.NONE]: {
    variant: CHARACTER_WOUND_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_WOUND_TYPE.WOUND]: {
    variant: CHARACTER_WOUND_TYPE.WOUND,
    stylemap: wound_arm_stylemap,
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

export const wound_brain_stylemap = [CHARACTER_STYLE.BRAIN];

export const wound_brain_feature: CharacterFeature = {
  [CHARACTER_WOUND_TYPE.NONE]: {
    variant: CHARACTER_WOUND_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_WOUND_TYPE.WOUND]: {
    variant: CHARACTER_WOUND_TYPE.WOUND,
    stylemap: wound_brain_stylemap,
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

export const wound_ribs_stylemap = [CHARACTER_STYLE.RIBS];

export const wound_ribs_feature: CharacterFeature = {
  [CHARACTER_WOUND_TYPE.NONE]: {
    variant: CHARACTER_WOUND_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_WOUND_TYPE.WOUND]: {
    variant: CHARACTER_WOUND_TYPE.WOUND,
    stylemap: wound_ribs_stylemap,
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

export const wound_eye_stylemap = [CHARACTER_STYLE.EYE];

export const wound_eye_feature: CharacterFeature = {
  [CHARACTER_WOUND_TYPE.NONE]: {
    variant: CHARACTER_WOUND_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_WOUND_TYPE.WOUND]: {
    variant: CHARACTER_WOUND_TYPE.WOUND,
    stylemap: wound_eye_stylemap,
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

export const wound_mouth_stylemap = [CHARACTER_STYLE.MOUTH];

export const wound_mouth_feature: CharacterFeature = {
  [CHARACTER_WOUND_TYPE.NONE]: {
    variant: CHARACTER_WOUND_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_WOUND_TYPE.WOUND]: {
    variant: CHARACTER_WOUND_TYPE.WOUND,
    stylemap: wound_mouth_stylemap,
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
