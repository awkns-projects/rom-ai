import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_LEGS_TYPE } from "./types";

export const legs_variant: CharacterVariant = {
  [CHARACTER_LEGS_TYPE.ARMOUR]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "legs/armour/plate/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "legs/armour/plate/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "legs/armour/plate/female/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.WIDE_PANTS]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "legs/pants/muscular/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.PANTS]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "legs/pants/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "legs/pants/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "legs/pants/teen/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "legs/pants/male/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.PANTALOONS]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "legs/pantaloons/male/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.LEGGINGS]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "legs/leggings/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "legs/leggings/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "legs/leggings/female/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.PREGNANCY_PANTS]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.PREGNANT]: "legs/pants/pregnant/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.CHILD_PANTS]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "legs/pants/child/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.CHILD_SKIRT]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "legs/skirts/child/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.PLAIN_SKIRT]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "legs/skirts/plain/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "legs/skirts/plain/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "legs/skirts/plain/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "legs/skirts/plain/female/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.SLIT_SKIRT]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "legs/skirts/slit/female/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "legs/skirts/slit/female/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.LEGION_SKIRT]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "legs/skirts/legion/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "legs/skirts/legion/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "legs/skirts/legion/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "legs/skirts/legion/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "legs/skirts/legion/male/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.STRAIGHT_SKIRT]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "legs/skirts/straight/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "legs/skirts/straight/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "legs/skirts/straight/female/",
      },
    },
  ],
  [CHARACTER_LEGS_TYPE.BELLE_SKIRT]: [
    {
      zPosition: 20,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "legs/skirts/belle/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "legs/skirts/belle/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "legs/skirts/belle/female/",
      },
    },
  ],
};
