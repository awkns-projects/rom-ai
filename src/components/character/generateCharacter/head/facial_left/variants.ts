import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_FACIAL_LEFT_TYPE,CHARACTER_FACIAL_LEFT_TRIM_TYPE } from "./types";

export const facial_left_variant: CharacterVariant = {
  [CHARACTER_FACIAL_LEFT_TYPE.MONOCLE]: [
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "facial/monocle/left/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "facial/monocle/left/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "facial/monocle/left/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "facial/monocle/left/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "facial/monocle/left/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "facial/monocle/left/adult/",
      },
    },
  ]
}

export const facial_left_trim_variant: CharacterVariant = {
  [CHARACTER_FACIAL_LEFT_TRIM_TYPE.MONOCLE]: [
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "facial/monocle/left/frame/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "facial/monocle/left/frame/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "facial/monocle/left/frame/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "facial/monocle/left/frame/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "facial/monocle/left/frame/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "facial/monocle/left/frame/adult/",
      },
    },
  ]
}