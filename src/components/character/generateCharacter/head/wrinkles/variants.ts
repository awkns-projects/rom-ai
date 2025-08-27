import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_WRINKLES_TYPE } from "./types";

export const wrinkles_variant: CharacterVariant = {
  [CHARACTER_WRINKLES_TYPE.WRINKLES]: [
    {
      zPosition: 102,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/wrinkles/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/wrinkles/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/wrinkles/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/wrinkles/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/wrinkles/",
      },
    },
  ]
}