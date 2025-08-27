import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_EYEBROWS_TYPE, CHARACTER_EYES_TYPE } from "./types";

export const eyes_variant: CharacterVariant = {
  [CHARACTER_EYES_TYPE.HUMAN]: [
    {
      zPosition: 105,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "eyes/human/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "eyes/human/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "eyes/human/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "eyes/human/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "eyes/human/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "eyes/human/adult/",
      },
    },
  ],
  [CHARACTER_EYES_TYPE.CYCLOPS]: [
    {
      zPosition: 105,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "eyes/cyclops/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "eyes/cyclops/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "eyes/cyclops/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "eyes/cyclops/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "eyes/cyclops/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "eyes/cyclops/adult/",
      },
    },
  ],
};

export const eyebrows_variant: CharacterVariant = {
  [CHARACTER_EYEBROWS_TYPE.THICK]: [
    {
      zPosition: 106,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "eyes/eyebrows/thick/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "eyes/eyebrows/thick/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "eyes/eyebrows/thick/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "eyes/eyebrows/thick/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "eyes/eyebrows/thick/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "eyes/eyebrows/thick/adult/",
      },
    },
  ],
  [CHARACTER_EYEBROWS_TYPE.THIN]: [
    {
      zPosition: 106,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "eyes/eyebrows/thin/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "eyes/eyebrows/thin/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "eyes/eyebrows/thin/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "eyes/eyebrows/thin/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "eyes/eyebrows/thin/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "eyes/eyebrows/thin/adult/",
      },
    },
  ],
};
