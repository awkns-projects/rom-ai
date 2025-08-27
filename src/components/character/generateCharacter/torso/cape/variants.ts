import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_CAPE_TYPE,CHARACTER_CAPE_TRIM_TYPE } from "./types";

export const cape_variant: CharacterVariant = {
  [CHARACTER_CAPE_TYPE.SOLID]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "cape/solid/female/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "cape/solid/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "cape/solid/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "cape/solid/female/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "cape/solid_behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "cape/solid_behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "cape/solid_behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "cape/solid_behind/",
      },
    },
  ],
  [CHARACTER_CAPE_TYPE.TATTERED]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "cape/tattered/female/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "cape/tattered/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "cape/tattered/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "cape/tattered/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "cape/tattered/female/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "cape/tattered_behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "cape/tattered_behind/",
        [CHARACTER_PERSON_TYPE.TEEN]: "cape/tattered_behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "cape/tattered_behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "cape/tattered_behind/",
      },
    },
  ],
};

export const cape_trim_variant: CharacterVariant = {
  [CHARACTER_CAPE_TRIM_TYPE.TRIM]: [
    {
      zPosition: 90,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "cape/trim/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "cape/trim/female/",
      },
    },
  ],
};
