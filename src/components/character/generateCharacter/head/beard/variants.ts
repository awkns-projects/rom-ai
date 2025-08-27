import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BEARD_TYPE } from "./types";

export const beard_variant: CharacterVariant = {
  [CHARACTER_BEARD_TYPE.BASIC]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "beards/beard/basic/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "beards/beard/basic/",
        [CHARACTER_PERSON_TYPE.TEEN]: "beards/beard/basic/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "beards/beard/basic/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "beards/beard/basic/",
      },
    },
  ],
  [CHARACTER_BEARD_TYPE.WINTER]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "beards/beard/winter/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "beards/beard/winter/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "beards/beard/winter/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "beards/beard/winter/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "beards/beard/winter/male/",
      },
    },
  ],
  [CHARACTER_BEARD_TYPE.FIVE_OCLOCK]: [
    {
      zPosition: 111,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "beards/beard/5oclock_shadow/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "beards/beard/5oclock_shadow/",
        [CHARACTER_PERSON_TYPE.TEEN]: "beards/beard/5oclock_shadow/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "beards/beard/5oclock_shadow/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "beards/beard/5oclock_shadow/",
      },
    },
  ],
  [CHARACTER_BEARD_TYPE.TRIMMED]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "beards/beard/trimmed/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "beards/beard/trimmed/",
        [CHARACTER_PERSON_TYPE.TEEN]: "beards/beard/trimmed/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "beards/beard/trimmed/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "beards/beard/trimmed/",
      },
    },
  ],
  [CHARACTER_BEARD_TYPE.MEDIUM]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "beards/beard/medium/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "beards/beard/medium/",
        [CHARACTER_PERSON_TYPE.TEEN]: "beards/beard/medium/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "beards/beard/medium/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "beards/beard/medium/",
      },
    },
  ]
}