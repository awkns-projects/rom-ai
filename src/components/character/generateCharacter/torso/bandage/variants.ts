import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BANDAGE_TYPE } from "./types";

export const bandage_variant: CharacterVariant = {
  [CHARACTER_BANDAGE_TYPE.BANDAGE]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/bandage/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/bandage/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/bandage/male/",
      },
    },
  ],
};
