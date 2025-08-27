import { CHARACTER_STYLE, CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_WOUND_TYPE } from "./types";

export const wound_arm_variant: CharacterVariant = {
  [CHARACTER_WOUND_TYPE.WOUND]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wound/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wound/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wound/",
      },
    },
  ],
};

export const wound_brain_variant: CharacterVariant = {
  [CHARACTER_WOUND_TYPE.WOUND]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wound/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wound/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wound/",
      },
    },
  ],
};

export const wound_ribs_variant: CharacterVariant = {
  [CHARACTER_WOUND_TYPE.WOUND]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wound/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wound/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wound/",
      },
    },
  ],
};

export const wound_eye_variant: CharacterVariant = {
  [CHARACTER_WOUND_TYPE.WOUND]: [
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wound/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wound/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wound/",
      },
    },
  ],
};

export const wound_mouth_variant: CharacterVariant = {
  [CHARACTER_WOUND_TYPE.WOUND]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wound/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wound/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wound/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wound/",
      },
    },
  ],
};
