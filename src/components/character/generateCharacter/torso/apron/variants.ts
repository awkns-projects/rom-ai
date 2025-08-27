import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_OVERALL_TYPE, CHARACTER_APRON_TYPE } from "./types";

export const overall_variant: CharacterVariant = {
  [CHARACTER_OVERALL_TYPE.OVERALL]: [
    {
      zPosition: 38,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/aprons/overalls/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/aprons/overalls/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/aprons/overalls/male/",
      },
    },
  ],
};

export const apron_variant: CharacterVariant = {
  [CHARACTER_APRON_TYPE.APRON]: [
    {
      zPosition: 40,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/aprons/apron/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/aprons/apron/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/aprons/apron/male/",
      },
    },
  ],
  [CHARACTER_APRON_TYPE.APRON_HALF]: [
    {
      zPosition: 40,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/aprons/apron_half/female/",
      },
    },
  ],
  [CHARACTER_APRON_TYPE.APRON_FULL]: [
    {
      zPosition: 40,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/aprons/apron_full/female/",
      },
    },
  ],
  [CHARACTER_APRON_TYPE.OVERSKIRT]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "legs/skirts/overskirt/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "legs/skirts/overskirt/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "legs/skirts/overskirt/female/",
      },
    },
  ],
};
