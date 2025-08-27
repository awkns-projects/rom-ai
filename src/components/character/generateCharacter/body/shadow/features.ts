import { CHARACTER_STYLE, CharacterFeature } from "../../definitions";

import { CHARACTER_SHADOW_TYPE } from "./types";

export const shadow_stylemap = [CHARACTER_STYLE.SHADOW];

export const shadow_feature: CharacterFeature = {
  [CHARACTER_SHADOW_TYPE.NONE]: {
    variant: CHARACTER_SHADOW_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_SHADOW_TYPE.SHADOW]: {
    variant: CHARACTER_SHADOW_TYPE.SHADOW,
    stylemap: shadow_stylemap,
    required: {},
  },
};
