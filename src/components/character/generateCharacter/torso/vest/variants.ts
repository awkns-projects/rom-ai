import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_VEST_TYPE } from "./types";

export const vest_variant: CharacterVariant = {
  [CHARACTER_VEST_TYPE.BODICE]: [
    {
      zPosition: 45,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/bodice/female/",
      },
    },
  ],
  [CHARACTER_VEST_TYPE.CORSET]: [
    {
      zPosition: 45,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/clothes/corset/female/",
      },
    },
  ],
  [CHARACTER_VEST_TYPE.VEST]: [
    {
      zPosition: 45,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/clothes/vest/male/",
      },
    },
  ],
  [CHARACTER_VEST_TYPE.VEST_OPEN]: [
    {
      zPosition: 45,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/clothes/vest_open/male/",
      },
    },
  ],
};
