import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_DRESS_TYPE,
  CHARACTER_DRESS_TRIM_TYPE,
  CHARACTER_DRESS_SLEEVES_TYPE,
  CHARACTER_DRESS_SLEEVES_TRIM_TYPE,
} from "./types";

export const  dress_variant: CharacterVariant = {
  [CHARACTER_DRESS_TYPE.SASH]: [
    {
      zPosition: 30,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/sash/female/",
      },
    },
  ],
  [CHARACTER_DRESS_TYPE.SLIT]: [
    {
      zPosition: 30,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/slit/female/",
      },
    },
  ],
  [CHARACTER_DRESS_TYPE.KIMONO]: [
    {
      zPosition: 30,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/normal/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/normal/universal/female/",
      },
    },
  ],
  [CHARACTER_DRESS_TYPE.SPLIT_KIMONO]: [
    {
      zPosition: 30,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/split/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/split/universal/female/",
      },
    },
  ],
};

export const dress_trim_variant: CharacterVariant = {
  [CHARACTER_DRESS_TRIM_TYPE.KIMONO]: [
    {
      zPosition: 31,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/normal/trim/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/normal/trim/universal/female/",
      },
    },
  ],
  [CHARACTER_DRESS_TRIM_TYPE.SPLIT_KIMONO]: [
    {
      zPosition: 31,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/split/trim/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/split/trim/universal/female/",
      },
    },
  ],
};


export const dress_sleeves_variant: CharacterVariant = {
  [CHARACTER_DRESS_SLEEVES_TYPE.KIMONO]: [
    {
      zPosition: 31,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/sleeves/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/sleeves/universal/female/",
      },
    },
    {
      zPosition: 145,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/sleeves/universal/female_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/sleeves/universal/female_front/",
      },
    },
  ],
  [CHARACTER_DRESS_SLEEVES_TYPE.KIMONO_OVERSIZED]: [
    {
      zPosition: 31,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/sleeves_oversize/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/sleeves_oversize/universal/female/",
      },
    },
    {
      zPosition: 145,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/sleeves_oversize/universal/female_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/sleeves_oversize/universal/female_front/",
      },
    },
  ],
};


export const dress_sleeves_trim_variant: CharacterVariant = {
  [CHARACTER_DRESS_SLEEVES_TRIM_TYPE.KIMONO]: [
    {
      zPosition: 32,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/sleeves/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/sleeves/universal/female/",
      },
    },
    {
      zPosition: 146,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/sleeves/universal/female_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/sleeves/universal/female_front/",
      },
    },
  ],
  [CHARACTER_DRESS_SLEEVES_TRIM_TYPE.KIMONO_OVERSIZED]: [
    {
      zPosition: 32,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/sleeves_oversize/trim/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/sleeves_oversize/trim/universal/female/",
      },
    },
    {
      zPosition: 146,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "dress/kimono/sleeves_oversize/trim/universal/female_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "dress/kimono/sleeves_oversize/trim/universal/female_front/",
      },
    },
  ],
};
