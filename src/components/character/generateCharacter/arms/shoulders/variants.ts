import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_SHOULDERS_TYPE } from "./types";

export const shoulders_variant: CharacterVariant = {
  [CHARACTER_SHOULDERS_TYPE.LEGION]: [
    {
      zPosition: 60,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shoulders/legion/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shoulders/legion/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shoulders/legion/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shoulders/legion/male/",
      },
    },
  ],
  [CHARACTER_SHOULDERS_TYPE.PLATE]: [
    {
      zPosition: 65,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shoulders/plate/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shoulders/plate/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shoulders/plate/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shoulders/plate/male/",
      },
    },
  ],
  [CHARACTER_SHOULDERS_TYPE.LEATHER]: [
    {
      zPosition: 60,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shoulders/leather/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shoulders/leather/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shoulders/leather/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shoulders/leather/male/",
      },
    },
  ],
  [CHARACTER_SHOULDERS_TYPE.EPAULETS]: [
    {
      zPosition: 60,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shoulders/epaulets/male/",
      },
    },
  ],
  [CHARACTER_SHOULDERS_TYPE.MANTAL]: [
    {
      zPosition: 75,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shoulders/mantal/male/",
      },
    },
  ],
};
