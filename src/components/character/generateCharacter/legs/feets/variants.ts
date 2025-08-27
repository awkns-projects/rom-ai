import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_SHOES_TYPE, CHARACTER_SOCKS_TYPE } from "./types";

export const shoes_variant: CharacterVariant = {
  [CHARACTER_SHOES_TYPE.BOOTS]: [
    {
      zPosition: 25,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/boots/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/boots/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/boots/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/boots/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/boots/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.FOLD_BOOTS]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/boots_fold/universal/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/boots_fold/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/boots_fold/universal/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/boots_fold/universal/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/boots_fold/universal/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.RIM_BOOTS]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/boots_rim/universal/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/boots_rim/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/boots_rim/universal/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/boots_rim/universal/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/boots_rim/universal/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.BOOTS_METAL_PLATING]: [
    {
      zPosition: 16,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/boots_plating/universal/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/boots_plating/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/boots_plating/universal/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "feet/boots_plating/universal/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/boots_plating/universal/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.ARMOUR]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/armour/plate/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/armour/plate/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/armour/plate/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/armour/plate/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/armour/plate/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.SLIPPERS]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/slippers/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/slippers/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/slippers/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/slippers/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/slippers/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.SHOES]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/shoes/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/shoes/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/shoes/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/shoes/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/shoes/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.HOOFS]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/hoofs/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/hoofs/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/hoofs/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/hoofs/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/hoofs/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.SANDALS]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/sandals/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/sandals/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/sandals/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/sandals/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/sandals/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.GHILLIES]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/ghillies/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/ghillies/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/ghillies/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/ghillies/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/ghillies/male/",
      },
    },
  ],
  [CHARACTER_SHOES_TYPE.SARA]: [
    {
      zPosition: 15,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/shoes/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "feet/shoes/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "feet/shoes/female/",
      },
    },
  ],
};

export const socks_variant: CharacterVariant = {
  [CHARACTER_SOCKS_TYPE.TABI]: [
    {
      zPosition: 14,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "feet/socks/tabi/universal/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "feet/socks/tabi/universal/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:  "feet/socks/tabi/universal/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:  "feet/socks/tabi/universal/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "feet/socks/tabi/universal/male/",
      },
    },
  ],
};
