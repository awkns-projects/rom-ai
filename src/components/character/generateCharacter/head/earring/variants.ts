import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_EARRING_TYPE } from "./types";

export const earring_left_variant: CharacterVariant = {
  [CHARACTER_EARRING_TYPE.EARRING]: [
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "facial/earrings/simple/left/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "facial/earrings/simple/left/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "facial/earrings/simple/left/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "facial/earrings/simple/left/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "facial/earrings/simple/left/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "facial/earrings/simple/left/adult/",
      },
    },
  ],
};

export const earring_right_variant: CharacterVariant = {
  [CHARACTER_EARRING_TYPE.EARRING]: [
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "facial/earrings/simple/right/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "facial/earrings/simple/right/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "facial/earrings/simple/right/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "facial/earrings/simple/right/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "facial/earrings/simple/right/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "facial/earrings/simple/right/adult/",
      },
    },
  ],
};
