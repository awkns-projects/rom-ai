import { CharacterInfo, CHARACTER_FEATURE } from "../definitions";
import { person_feature } from "./definitions";

import { randomStyle } from "../functions";

export const generater = (characterInfo: CharacterInfo) => {
  randomStyle(characterInfo, CHARACTER_FEATURE.PERSON, person_feature, {});
};
