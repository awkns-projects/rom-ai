import { CHARACTER_STYLE, CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BRACERS_TYPE } from "./types";

export const bracers_variant: CharacterVariant = {
  [CHARACTER_BRACERS_TYPE.BRACERS]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "arms/bracers/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "arms/bracers/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "arms/bracers/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "arms/bracers/male/",
      },
    },
  ],
}