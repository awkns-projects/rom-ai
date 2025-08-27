import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_FACIAL_MASK_TYPE } from "./types";

export const facial_mask_variant: CharacterVariant = {
  [CHARACTER_FACIAL_MASK_TYPE.MASK]: [
    {
      zPosition: 114,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "facial/masks/plain/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "facial/masks/plain/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "facial/masks/plain/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "facial/masks/plain/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "facial/masks/plain/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "facial/masks/plain/adult/",
      },
    },
  ],
};
