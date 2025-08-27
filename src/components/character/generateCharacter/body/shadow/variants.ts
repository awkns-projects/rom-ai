import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_SHADOW_TYPE } from "./types";

export const shadow_variant: CharacterVariant = {
  [CHARACTER_SHADOW_TYPE.SHADOW]: [
    {
      zPosition: 0,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shadow/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shadow/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "shadow/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "shadow/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shadow/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shadow/adult/",
      },
    },
  ],
};
