import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_ACCESSORY_TYPE } from "./types";

export const accessory_variant: CharacterVariant = {
  [CHARACTER_ACCESSORY_TYPE.CREST]: [
    {
      zPosition: 139,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/crest/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/crest/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/accessory/crest/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/accessory/crest/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/accessory/crest/adult/",
      },
    },
  ],
  [CHARACTER_ACCESSORY_TYPE.CENTURION_CREST]: [
    {
      zPosition: 139,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/crest_centurion/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/crest_centurion/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/accessory/crest_centurion/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "hat/accessory/crest_centurion/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "hat/accessory/crest_centurion/adult/",
      },
    },
  ],
  [CHARACTER_ACCESSORY_TYPE.HELMET_WINGS]: [
    {
      zPosition: 139,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/wings/fg/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/wings/fg/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/accessory/wings/fg/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/accessory/wings/fg/adult/",
      },
    },
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/wings/bg/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/wings/bg/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/accessory/wings/bg/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/accessory/wings/bg/adult/",
      },
    },
  ],
  [CHARACTER_ACCESSORY_TYPE.SHORT_HORNS]: [
    {
      zPosition: 139,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/horns_short/fg/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/horns_short/fg/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/accessory/horns_short/fg/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/accessory/horns_short/fg/adult/",
      },
    },
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/horns_short/bg/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/horns_short/bg/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/accessory/horns_short/bg/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/accessory/horns_short/bg/adult/",
      },
    },
  ],
  [CHARACTER_ACCESSORY_TYPE.UPWARD_HORNS]: [
    {
      zPosition: 139,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/horns_upward/fg/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/horns_upward/fg/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "hat/accessory/horns_upward/fg/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "hat/accessory/horns_upward/fg/adult/",
      },
    },
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/horns_upward/bg/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/horns_upward/bg/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "hat/accessory/horns_upward/bg/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "hat/accessory/horns_upward/bg/adult/",
      },
    },
  ],
  [CHARACTER_ACCESSORY_TYPE.DOWNWARD_HORNS]: [
    {
      zPosition: 139,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/horns_downward/fg/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/accessory/horns_downward/fg/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "hat/accessory/horns_downward/fg/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "hat/accessory/horns_downward/fg/adult/",
      },
    },
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/horns_downward/bg/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/accessory/horns_downward/bg/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "hat/accessory/horns_downward/bg/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "hat/accessory/horns_downward/bg/adult/",
      },
    },
  ],
  [CHARACTER_ACCESSORY_TYPE.PLUMAGE]: [
    {
      zPosition: 139,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/plumage/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/plumage/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/accessory/plumage/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/accessory/plumage/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/accessory/plumage/adult/",
      },
    },
  ],
  [CHARACTER_ACCESSORY_TYPE.CENTURION_PLUMAGE]: [
    {
      zPosition: 139,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/plumage_centurion/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/accessory/plumage_centurion/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/accessory/plumage_centurion/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "hat/accessory/plumage_centurion/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "hat/accessory/plumage_centurion/adult/",
      },
    },
  ],
  [CHARACTER_ACCESSORY_TYPE.LEGION_PLUMAGE]: [
    {
      zPosition: 139,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/accessory/plumage_legion/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/accessory/plumage_legion/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/accessory/plumage_legion/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/accessory/plumage_legion/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/accessory/plumage_legion/adult/",
      },
    },
  ],
};
