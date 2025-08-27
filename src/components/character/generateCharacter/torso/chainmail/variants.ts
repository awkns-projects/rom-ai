import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_CHAINMAIL_TYPE } from "./types";

export const chainmail_variant: CharacterVariant = {
  [CHARACTER_CHAINMAIL_TYPE.CHAINMAIL]: [
    {
      zPosition: 50,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/chainmail/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/chainmail/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/chainmail/female/",
      },
    },
  ],
};
