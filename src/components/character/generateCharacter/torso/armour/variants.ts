import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_ARMOUR_TYPE } from "./types";

export const armour_variant: CharacterVariant = {
  [CHARACTER_ARMOUR_TYPE.PLATE]: [
    {
      zPosition: 60,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/armour/plate/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/armour/plate/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/armour/plate/male/",
      },
    },
  ],
  [CHARACTER_ARMOUR_TYPE.LEATHER]: [
    {
      zPosition: 60,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/armour/leather/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/armour/leather/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/armour/leather/male/",
      },
    },
  ],
  [CHARACTER_ARMOUR_TYPE.LEGION]: [
    {
      zPosition: 60,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/armour/legion/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/armour/legion/female/",
      },
    },
  ],
};
