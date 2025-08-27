import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_GLOVES_TYPE } from "./types";

export const gloves_variant: CharacterVariant = {
  [CHARACTER_GLOVES_TYPE.GLOVES]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "gloves/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "gloves/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "gloves/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "gloves/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "gloves/male/",
      },
    },
  ],
};
