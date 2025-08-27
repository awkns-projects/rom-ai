import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_FURRY_EARS_TYPE,
  CHARACTER_FURRY_EARS_SKIN_TYPE
} from "./types";

export const furry_ears_variant: CharacterVariant = {
  [CHARACTER_FURRY_EARS_TYPE.CAT]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/cat/adult_front/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/cat/adult_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/cat/adult_front/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/cat/child_front/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/cat/adult_front/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/cat/adult_front/",
      },
    },
    {
      zPosition: 8.8,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/cat/adult_back/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/cat/adult_back/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/cat/adult_back/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/cat/child_back/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/cat/adult_back/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/cat/adult_back/",
      },
    },
  ],
  [CHARACTER_FURRY_EARS_TYPE.WOLF]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/wolf/adult_front/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/wolf/adult_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/wolf/adult_front/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/wolf/child_front/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/wolf/adult_front/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/wolf/adult_front/",
      },
    },
    {
      zPosition: 8.8,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/wolf/adult_back/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/wolf/adult_back/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/wolf/adult_back/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/wolf/child_back/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/wolf/adult_back/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/wolf/adult_back/",
      },
    },
  ],
};

export const furry_ears_skin_variant: CharacterVariant = {
  [CHARACTER_FURRY_EARS_SKIN_TYPE.CAT]: [
    {
      zPosition: 131,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/cat/skin/adult_front/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/cat/skin/adult_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/cat/skin/adult_front/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/cat/skin/child_front/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/cat/skin/adult_front/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/cat/skin/adult_front/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/cat/skin/adult_back/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/cat/skin/adult_back/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/cat/skin/adult_back/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/cat/skin/child_back/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/cat/skin/adult_back/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/cat/skin/adult_back/",
      },
    },
  ],
  [CHARACTER_FURRY_EARS_SKIN_TYPE.WOLF]: [
    {
      zPosition: 131,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/wolf/skin/adult_front/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/wolf/skin/adult_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/wolf/skin/adult_front/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/wolf/skin/child_front/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/wolf/skin/adult_front/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/wolf/skin/adult_front/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/ears/wolf/skin/adult_back/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/ears/wolf/skin/adult_back/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/ears/wolf/skin/adult_back/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/ears/wolf/skin/child_back/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/ears/wolf/skin/adult_back/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/ears/wolf/skin/adult_back/",
      },
    },
  ],
};
