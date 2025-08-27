import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_FACIAL_RIGHT_TYPE,
  CHARACTER_FACIAL_RIGHT_TRIM_TYPE,
} from "./types";

export const facial_right_variant: CharacterVariant = {
  [CHARACTER_FACIAL_RIGHT_TYPE.MONOCLE]: [
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "facial/monocle/right/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "facial/monocle/right/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "facial/monocle/right/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "facial/monocle/right/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "facial/monocle/right/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "facial/monocle/right/adult/",
      },
    },
  ],
};

export const facial_right_trim_variant: CharacterVariant = {
  [CHARACTER_FACIAL_RIGHT_TRIM_TYPE.MONOCLE]: [
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "facial/monocle/right/frame/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "facial/monocle/right/frame/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "facial/monocle/right/frame/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "facial/monocle/right/frame/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "facial/monocle/right/frame/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "facial/monocle/right/frame/adult/",
      },
    },
  ],
};
