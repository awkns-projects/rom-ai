import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_WINGS_TYPE,
  CHARACTER_WINGS_EDGE_TYPE,
  CHARACTER_WINGS_DOTS_TYPE,
} from "./types";

export const wings_variant: CharacterVariant = {
  [CHARACTER_WINGS_TYPE.FEATHERED]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "body/wings/feathered/universal/adult_front/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "body/wings/feathered/universal/adult_front/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "body/wings/feathered/universal/adult_front/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "body/wings/feathered/universal/adult_front/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "body/wings/feathered/universal/adult_back/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "body/wings/feathered/universal/adult_back/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "body/wings/feathered/universal/adult_back/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "body/wings/feathered/universal/adult_back/",
      },
    },
  ],
  [CHARACTER_WINGS_TYPE.BAT]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/bat/universal/adult_front/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/bat/universal/adult_front/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "body/wings/bat/universal/adult_front/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "body/wings/bat/universal/adult_front/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/bat/universal/adult_back/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/bat/universal/adult_back/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "body/wings/bat/universal/adult_back/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "body/wings/bat/universal/adult_back/",
      },
    },
  ],
  [CHARACTER_WINGS_TYPE.MONARCH]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/monarch/base/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/monarch/base/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/monarch/base/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/monarch/base/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/monarch/base/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/monarch/base/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/monarch/base/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/monarch/base/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/monarch/base/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/monarch/base/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/monarch/base/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/monarch/base/bg/",
      },
    },
  ],
  [CHARACTER_WINGS_TYPE.PIXIE]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/pixie/solid/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/pixie/solid/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/pixie/solid/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/pixie/solid/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/pixie/solid/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/pixie/solid/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/pixie/solid/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/pixie/solid/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/pixie/solid/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/pixie/solid/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/pixie/solid/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/pixie/solid/bg/",
      },
    },
  ],
  [CHARACTER_WINGS_TYPE.TRANSPARENT_PIXIE]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/pixie/transparent/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/pixie/transparent/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/pixie/transparent/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/pixie/transparent/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/pixie/transparent/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/pixie/transparent/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/pixie/transparent/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/pixie/transparent/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/pixie/transparent/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/pixie/transparent/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/pixie/transparent/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/pixie/transparent/bg/",
      },
    },
  ],
  [CHARACTER_WINGS_TYPE.LUNAR]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/lunar/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/lunar/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/lunar/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/lunar/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/lunar/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/lunar/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/lunar/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/lunar/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/lunar/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/lunar/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/lunar/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/lunar/bg/",
      },
    },
  ],
  [CHARACTER_WINGS_TYPE.DRAGONFLY]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/dragonfly/solid/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/dragonfly/solid/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/dragonfly/solid/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/dragonfly/solid/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/dragonfly/solid/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/dragonfly/solid/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/dragonfly/solid/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/dragonfly/solid/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/dragonfly/solid/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/dragonfly/solid/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/dragonfly/solid/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/dragonfly/solid/bg/",
      },
    },
  ],
  [CHARACTER_WINGS_TYPE.TRANSPARENT_DRAGONFLY]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/dragonfly/transparent/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/dragonfly/transparent/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/dragonfly/transparent/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/dragonfly/transparent/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "body/wings/dragonfly/transparent/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "body/wings/dragonfly/transparent/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/dragonfly/transparent/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/dragonfly/transparent/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/dragonfly/transparent/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/dragonfly/transparent/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "body/wings/dragonfly/transparent/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "body/wings/dragonfly/transparent/bg/",
      },
    },
  ],
  [CHARACTER_WINGS_TYPE.LIZARD]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/lizard/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/lizard/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/lizard/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/lizard/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/lizard/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/lizard/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/lizard/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/lizard/bg/",
      },
    },
  ],
  [CHARACTER_WINGS_TYPE.BATLIKE_LIZARD]: [
    {
      zPosition: 85,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "body/wings/bat/lizard/universal/adult_front/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "body/wings/bat/lizard/universal/adult_front/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "body/wings/bat/lizard/universal/adult_front/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "body/wings/bat/lizard/universal/adult_front/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "body/wings/bat/lizard/universal/adult_back/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "body/wings/bat/lizard/universal/adult_back/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "body/wings/bat/lizard/universal/adult_back/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "body/wings/bat/lizard/universal/adult_back/",
      },
    },
  ],
};

export const wings_edge_variant: CharacterVariant = {
  [CHARACTER_WINGS_EDGE_TYPE.MONARCH]: [
    {
      zPosition: 86,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/monarch/edge/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/monarch/edge/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/monarch/edge/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/monarch/edge/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/monarch/edge/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/monarch/edge/fg/",
      },
    },
    {
      zPosition: 6,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/monarch/edge/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/monarch/edge/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/monarch/edge/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/monarch/edge/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/monarch/edge/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/monarch/edge/bg/",
      },
    },
  ],
};

export const wings_dots_variant: CharacterVariant = {
  [CHARACTER_WINGS_DOTS_TYPE.MONARCH]: [
    {
      zPosition: 86,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/monarch/dots/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/monarch/dots/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/monarch/dots/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/monarch/dots/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/monarch/dots/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/monarch/dots/fg/",
      },
    },
    {
      zPosition: 6,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/wings/monarch/dots/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "body/wings/monarch/dots/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "body/wings/monarch/dots/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "body/wings/monarch/dots/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "body/wings/monarch/dots/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "body/wings/monarch/dots/bg/",
      },
    },
  ],
};
