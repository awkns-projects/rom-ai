import { CHARACTER_STYLE, CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_WRISTS_TYPE } from "./types";

export const wrists_variant: CharacterVariant = {
  [CHARACTER_WRISTS_TYPE.WRISTS]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "wrists/cuffs/male/",
      },
    },
  ],
  [CHARACTER_WRISTS_TYPE.LACE]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "wrists/lace/male/",
      },
    },
  ],
};
