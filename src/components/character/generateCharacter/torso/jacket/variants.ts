import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_JACKET_TYPE,
  CHARACTER_JACKET_COLLAR_TYPE,
  CHARACTER_JACKET_TRIM_TYPE,
  CHARACTER_JACKET_POCKETS_TYPE,
} from "./types";

export const jacket_variant: CharacterVariant = {
  [CHARACTER_JACKET_TYPE.COLLARED]: [
    {
      zPosition: 55,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/collared/male/",
      },
    },
  ],
  [CHARACTER_JACKET_TYPE.IVERNESS]: [
    {
      zPosition: 55,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/iverness/male/",
      },
    },
  ],
  [CHARACTER_JACKET_TYPE.TRENCH]: [
    {
      zPosition: 55,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/trench/male/",
      },
    },
  ],
  [CHARACTER_JACKET_TYPE.TABARD]: [
    {
      zPosition: 55,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/tabard/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/jacket/tabard/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/jacket/tabard/female/",
      },
    },
  ],
  [CHARACTER_JACKET_TYPE.FROCK]: [
    {
      zPosition: 55,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/frock/male/",
      },
    },
  ],
  [CHARACTER_JACKET_TYPE.SANTA]: [
    {
      zPosition: 55,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/santa/male/",
      },
    },
  ],
};

export const jacket_collar_variant: CharacterVariant = {
  [CHARACTER_JACKET_COLLAR_TYPE.FROCK]: [
    {
      zPosition: 57,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/trim/frock_collar/",
      },
    },
  ],
};

export const jacket_trim_variant: CharacterVariant = {
  [CHARACTER_JACKET_TRIM_TYPE.FROCK_LACE]: [
    {
      zPosition: 58,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/trim/frock_lace/",
      },
    },
  ],
  [CHARACTER_JACKET_TRIM_TYPE.FROCK_LAPEL]: [
    {
      zPosition: 58,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/trim/frock_lapel/",
      },
    },
  ],
  [CHARACTER_JACKET_TRIM_TYPE.FROCK_BUTTONS]: [
    {
      zPosition: 58,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/trim/frock_buttons/",
      },
    },
  ],
};

export const jacket_pockets_variant: CharacterVariant = {
  [CHARACTER_JACKET_POCKETS_TYPE.POCKETS]: [
    {
      zPosition: 59,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/jacket/trim/jacket_pockets/",
      },
    },
  ],
};
