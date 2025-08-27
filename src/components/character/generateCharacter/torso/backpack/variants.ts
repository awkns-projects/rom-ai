import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_BACKPACK_TYPE,
  CHARACTER_BACKPACK_STRAP_TYPE,
  CHARACTER_CARGO_TYPE,
  CHARACTER_QUIVER_TYPE,
} from "./types";

export const backpack_variant: CharacterVariant = {
  [CHARACTER_BACKPACK_TYPE.BACKPACK]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/backpack/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/backpack/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/backpack/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/backpack/male/",
      },
    },
  ],
  [CHARACTER_BACKPACK_TYPE.SQUARE_PACK]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/squarepack/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/squarepack/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/squarepack/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/squarepack/male/",
      },
    },
  ],
  [CHARACTER_BACKPACK_TYPE.JETPACK]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/jetpack/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/jetpack/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/jetpack/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/jetpack/male/",
      },
    },
  ],
  [CHARACTER_BACKPACK_TYPE.BASKET]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/basket/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/basket/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/basket/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/basket/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/basket/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/basket/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/basket/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/basket/bg/",
      },
    },
  ],
};

export const backpack_strap_variant: CharacterVariant = {
  [CHARACTER_BACKPACK_STRAP_TYPE.STRAP]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/straps/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/straps/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/straps/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/straps/male/",
      },
    },
  ],
};

export const cargo_variant: CharacterVariant = {
  [CHARACTER_CARGO_TYPE.JETPACK]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/jetpack_fins/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/jetpack_fins/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/jetpack_fins/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/jetpack_fins/male/",
      },
    },
  ],
  [CHARACTER_CARGO_TYPE.BASKET_WOOD]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/basket_contents/wood/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/basket_contents/wood/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/basket_contents/wood/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/basket_contents/wood/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/basket_contents/wood/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/basket_contents/wood/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/basket_contents/wood/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/basket_contents/wood/bg/",
      },
    },
  ],
  [CHARACTER_CARGO_TYPE.BASKET_ORE]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/basket_contents/ore/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/basket_contents/ore/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/basket_contents/ore/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/basket_contents/ore/fg/",
      },
    },
    {
      zPosition: 5,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "backpack/basket_contents/ore/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "backpack/basket_contents/ore/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "backpack/basket_contents/ore/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "backpack/basket_contents/ore/bg/",
      },
    },
  ],
};

export const quiver_variant: CharacterVariant = {
  [CHARACTER_QUIVER_TYPE.QUIVER]: [
    {
      zPosition: 8,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "quiver/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "quiver/",
        [CHARACTER_PERSON_TYPE.TEEN]: "quiver/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "quiver/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "quiver/",
      },
    },
  ],
};
