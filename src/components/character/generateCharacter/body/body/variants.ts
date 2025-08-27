import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_BODY_TYPE } from "./types";

export const body_variant: CharacterVariant = {
  [CHARACTER_BODY_TYPE.BASIC]: [
    {
      zPosition: 10,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/bodies/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/bodies/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/bodies/teen/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/bodies/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/bodies/pregnant/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/bodies/muscular/",
      },
    },
  ],
  [CHARACTER_BODY_TYPE.ZOMBIE]: [
    {
      zPosition: 10,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/bodies/zombie/universal/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/bodies/zombie/universal/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/bodies/zombie/universal/",
      },
    },
  ],
  [CHARACTER_BODY_TYPE.SKELETON]: [
    {
      zPosition: 10,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/bodies/skeleton/universal/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/bodies/skeleton/universal/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/bodies/skeleton/universal/",
      },
    },
  ],
};
