import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_BELT_TYPE,
  CHARACTER_SASH_TYPE,
  CHARACTER_SASH_TIE_TYPE,
  CHARACTER_SASH_OBI_TYPE,
} from "./types";

export const belt_variant: CharacterVariant = {
  [CHARACTER_BELT_TYPE.LEATHER]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/belt_leather/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/belt_leather/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/belt_leather/male/",
      },
    },
  ],
  [CHARACTER_BELT_TYPE.DOUBLE]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/belt_double/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/belt_double/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/belt_double/male/",
      },
    },
  ],
  [CHARACTER_BELT_TYPE.LOOSE]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/belt_loose/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/belt_loose/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/belt_loose/male/",
      },
    },
  ],
  [CHARACTER_BELT_TYPE.BELLY]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/belt_belly/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/belt_belly/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/belt_belly/male/",
      },
    },
  ],
  [CHARACTER_BELT_TYPE.OTHER_FEMALE]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/belt_other/female/",
      },
    },
  ],
  [CHARACTER_BELT_TYPE.OTHER_MALE]: [
    {
      zPosition: 70,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/belt_other/male/",
      },
    },
  ],
};

export const sash_variant: CharacterVariant = {
  [CHARACTER_SASH_TYPE.SASH]: [
    {
      zPosition: 65,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/sash/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/sash/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/sash/male/",
      },
    },
  ],
  [CHARACTER_SASH_TYPE.NARROW]: [
    {
      zPosition: 65,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/sash_narrow/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/sash_narrow/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/sash_narrow/male/",
      },
    },
  ],
  [CHARACTER_SASH_TYPE.WAISTBAND]: [
    {
      zPosition: 65,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/waistband/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/sash/male/",
      },
    },
  ],
  [CHARACTER_SASH_TYPE.OBI]: [
    {
      zPosition: 65,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/obi/universal/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/obi/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/obi/universal/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "torso/waist/obi/universal/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "torso/waist/obi/universal/male/",
      },
    },
  ],
};

export const sash_tie_variant: CharacterVariant = {
  [CHARACTER_SASH_TIE_TYPE.OBI]: [
    {
      zPosition: 66,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/obi_knot/universal/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/waist/obi_knot/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/obi_knot/universal/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "torso/waist/obi_knot/universal/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "torso/waist/obi_knot/universal/male/",
      },
    },
  ],
};

export const sash_obi_variant: CharacterVariant = {
  [CHARACTER_SASH_OBI_TYPE.OBI]: [
    {
      zPosition: 65,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/waist/sash/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/waist/sash/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/waist/sash/male/",
      },
    },
  ],
};
