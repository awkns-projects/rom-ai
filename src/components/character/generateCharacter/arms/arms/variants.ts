import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_ARMS_TYPE } from "./types";

export const arms_variant: CharacterVariant = {
  [CHARACTER_ARMS_TYPE.ARMOUR]: [
    {
      zPosition: 60,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "arms/armour/plate/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "arms/armour/plate/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "arms/armour/plate/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "arms/armour/plate/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "arms/armour/plate/male/",
      },
    },
  ],
};
