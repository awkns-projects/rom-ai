import { CHARACTER_STYLE, CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_TAIL_TYPE } from "./types";

export const tail_variant: CharacterVariant = {
  [CHARACTER_TAIL_TYPE.WOLF]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/wolf/adult/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/wolf/adult/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/wolf/adult/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/wolf/child/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/wolf/adult/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/wolf/adult/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/wolf/adult/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/wolf/adult/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/wolf/adult/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/wolf/child/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/wolf/adult/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/wolf/adult/bg/",
      },
    },
  ],
  [CHARACTER_TAIL_TYPE.FLUFFY]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/fluffy/adult/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/fluffy/adult/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/fluffy/adult/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/fluffy/child/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/fluffy/adult/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/fluffy/adult/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/fluffy/adult/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/fluffy/adult/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/fluffy/adult/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/fluffy/child/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/fluffy/adult/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/fluffy/adult/bg/",
      },
    },
  ],
  [CHARACTER_TAIL_TYPE.CAT]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/cat/adult/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/cat/adult/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/cat/adult/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/cat/child/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/cat/adult/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/cat/adult/fg/",
      },
    },
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/cat/adult/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/cat/adult/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/cat/adult/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/cat/child/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/cat/adult/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/cat/adult/bg/",
      },
    },
  ],
  [CHARACTER_TAIL_TYPE.LIZARD]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/lizard/alt/adult/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/lizard/alt/adult/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/lizard/alt/adult/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/lizard/alt/child/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/lizard/alt/adult/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/lizard/alt/adult/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/lizard/alt/adult/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/lizard/alt/adult/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/lizard/alt/adult/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/lizard/alt/child/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/lizard/alt/adult/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/lizard/alt/adult/bg/",
      },
    },
  ],
  [CHARACTER_TAIL_TYPE.LIZARD_BODY]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/lizard/adult/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/lizard/adult/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/lizard/adult/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/lizard/child/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/lizard/adult/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/lizard/adult/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/tail/lizard/adult/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/tail/lizard/adult/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/tail/lizard/adult/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/tail/lizard/child/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/tail/lizard/adult/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/tail/lizard/adult/bg/",
      },
    },
  ],
};
