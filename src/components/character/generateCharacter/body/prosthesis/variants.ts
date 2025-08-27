import { CHARACTER_STYLE, CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_PROSTHESIS_TYPE } from "./types";

export const prosthesis_hand_variant: CharacterVariant = {
  [CHARACTER_PROSTHESIS_TYPE.PROSTHESIS]: [
    {
      zPosition: 100,
      isMask: true,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/prosthesis/hook/male/mask/",
      },
    },
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/prosthesis/hook/male/",
      },
    },
  ],
};

export const prosthesis_leg_variant: CharacterVariant = {
  [CHARACTER_PROSTHESIS_TYPE.PROSTHESIS]: [
    {
      zPosition: 100,
      isMask: true,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/prosthesis/peg_leg/male/mask/",
      },
    },
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "body/prosthesis/peg_leg/male/",
      },
    },
  ],
};
