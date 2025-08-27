import { CHARACTER_STYLE, CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BAULDRON_TYPE } from "./types";

export const bauldron_variant: CharacterVariant = {
  [CHARACTER_BAULDRON_TYPE.BAULDRON]:[
    {
      zPosition: 65,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "bauldron/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:  "bauldron/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:  "bauldron/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:  "bauldron/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "bauldron/male/",
      },
    },
  ],
}