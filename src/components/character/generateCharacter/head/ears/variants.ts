import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_EARS_TYPE } from "./types";

export const ears_variant: CharacterVariant = {
  [CHARACTER_EARS_TYPE.BIG]: [
    {
      zPosition: 105,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/big/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/big/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/big/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/big/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/big/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/big/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.ELVEN]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/elven/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/elven/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/elven/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/elven/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/elven/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/elven/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.LONG]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/long/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/long/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/long/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/long/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/long/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/long/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.MEDIUM_ELVEN]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/medium/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/medium/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/medium/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/medium/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/medium/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/medium/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.HANGING_ELVEN]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/hang/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/hang/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/hang/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/hang/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/hang/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/hang/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.DOWNWARD_ELVEN]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/down/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/down/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/down/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/down/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/down/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/down/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.DRAGEN]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/dragon/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/dragon/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/dragon/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/dragon/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/dragon/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/dragon/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.WOLF]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/lykon/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/lykon/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/lykon/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/lykon/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/lykon/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/lykon/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.CAT]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/zabos/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/zabos/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/zabos/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/zabos/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/zabos/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/zabos/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.FEATHER]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/avyon/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/avyon/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/avyon/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/avyon/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/avyon/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/avyon/adult/",
      },
    },
  ],
}

export const ears_inner_variant: CharacterVariant = {
  [CHARACTER_EARS_TYPE.WOLF]: [
    {
      zPosition: 131,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/lykon/skin/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/lykon/skin/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/lykon/skin/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/lykon/skin/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/lykon/skin/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/lykon/skin/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.CAT]: [
    {
      zPosition: 131,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/zabos/skin/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/zabos/skin/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/zabos/skin/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/zabos/skin/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/zabos/skin/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/zabos/skin/adult/",
      },
    },
  ],
  [CHARACTER_EARS_TYPE.FEATHER]: [
    {
      zPosition: 131,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/avyon/skin/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/avyon/skin/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/avyon/skin/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/avyon/skin/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/avyon/skin/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/avyon/skin/adult/",
      },
    },
  ],
}