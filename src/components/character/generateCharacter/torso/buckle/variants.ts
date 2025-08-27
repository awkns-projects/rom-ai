import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BUCKLE_TYPE } from "./types";

export const buckle_variant: CharacterVariant = {
  [CHARACTER_BUCKLE_TYPE.BUCKLE]: [
    {
      zPosition: 75,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/buckles/female/",
      },
    },
  ],
};
