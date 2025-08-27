import { CharacterInfo } from "./definitions";

import { generater as generatePeople } from "./person/generater";

import { generater as generateBody } from "./body/generater";
import { generater as generateHead } from "./head/generater";
import { generater as generateArms } from "./arms/generater";
import { generater as generateTorso } from "./torso/generater";
import { generater as generateLegs } from "./legs/generater";
import { generater as generateWeapons } from "./weapons/generater";

export const generateCharacter = () => {
  const characterInfo: CharacterInfo = {};

  generatePeople(characterInfo);

  generateBody(characterInfo);
  generateHead(characterInfo);
  // generateArms(characterInfo);
  generateTorso(characterInfo);
  generateLegs(characterInfo);
  // generateWeapons(characterInfo);

  return characterInfo;
};
