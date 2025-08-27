import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_NOSE_TYPE } from "./types";

export const nose_variant: CharacterVariant = {
  [CHARACTER_NOSE_TYPE.BIG]: [
    {
      zPosition: 105,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/nose/big/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/nose/big/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/nose/big/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/nose/big/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/nose/big/adult/",
      },
    },
  ],
  [CHARACTER_NOSE_TYPE.BUTTON]: [
    {
      zPosition: 105,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/nose/button/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/nose/button/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/nose/button/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/nose/button/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/nose/button/adult/",
      },
    },
  ],
  [CHARACTER_NOSE_TYPE.STRAIHT]: [
    {
      zPosition: 105,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/nose/straight/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/nose/straight/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/nose/straight/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/nose/straight/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/nose/straight/adult/",
      },
    },
  ],
  [CHARACTER_NOSE_TYPE.ELDERLY]: [
    {
      zPosition: 105,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/nose/elderly/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/nose/elderly/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/nose/elderly/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/nose/elderly/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/nose/elderly/adult/",
      },
    },
  ],
  [CHARACTER_NOSE_TYPE.LARGE]: [
    {
      zPosition: 105,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/nose/large/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/nose/large/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/nose/large/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/nose/large/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/nose/large/adult/",
      },
    },
  ],
};
