import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_CLOTH_TYPE } from "./types";

export const cloth_variant: CharacterVariant = {
  [CHARACTER_CLOTH_TYPE.CHILD_TSHIRT]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "torso/clothes/shirt/child/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.LONGSLEEVE_SHIRT]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "torso/clothes/longsleeve/longsleeve/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/longsleeve/longsleeve/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "torso/clothes/longsleeve/longsleeve/teen/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "torso/clothes/longsleeve/longsleeve/pregnant/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SCOOP]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/longsleeve/scoop/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "torso/clothes/longsleeve/scoop/pregnant/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.COLORED_FORMAL_LONGSLEEVE]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/clothes/longsleeve/formal/male/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.STRIPED_FORMAL_LONGSLEEVE]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "torso/clothes/longsleeve/formal_striped/male/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.LONGSLEEVE_LACED]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/clothes/longsleeve/laced/male/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SHORTSLEEVE_SHIRT]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "torso/clothes/shortsleeve/shortsleeve/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/shortsleeve/shortsleeve/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "torso/clothes/shortsleeve/shortsleeve/teen/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "torso/clothes/shortsleeve/shortsleeve/pregnant/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.TSHIRT]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/shortsleeve/tshirt/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "torso/clothes/shortsleeve/tshirt/teen/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.TSHIRT_VNECK]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/shortsleeve/tshirt_vneck/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "torso/clothes/shortsleeve/tshirt_vneck/teen/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.TSHIRT_SCOOP]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/shortsleeve/tshirt_scoop/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "torso/clothes/shortsleeve/tshirt_scoop/teen/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.TSHIRT_BUTTONED]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/shortsleeve/tshirt_buttoned/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "torso/clothes/shortsleeve/tshirt_buttoned/teen/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SLEEVELESS_SHIRT]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "torso/clothes/sleeveless/sleeveless/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/sleeveless/sleeveless/female/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SLEEVELESS_LACED]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/clothes/sleeveless/laced/male/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SLEEVELESS_STRIPED]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "torso/clothes/sleeveless/striped/male/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.TANKTOP]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/sleeveless/tanktop/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "torso/clothes/sleeveless/tanktop/pregnant/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SLEEVELESS2]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/sleeveless/sleeveless2/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "torso/clothes/sleeveless/sleeveless2/teen/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SLEEVELESS2_VNECK]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/sleeveless/sleeveless2_vneck/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "torso/clothes/sleeveless/sleeveless2_vneck/teen/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SLEEVELESS2_SCOOP]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/sleeveless/sleeveless2_scoop/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "torso/clothes/sleeveless/sleeveless2_scoop/teen/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SLEEVELESS2_BUTTONED]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "torso/clothes/sleeveless/sleeveless2_buttoned/female/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "torso/clothes/sleeveless/sleeveless2_buttoned/teen/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.BLOUSE]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/clothes/blouse/female/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.LONGSLEEVE_BLOUSE]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/clothes/blouse_longsleeve/female/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.TUNIC]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/clothes/tunic/female/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.SARA_TUNIC]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/clothes/tunic_sara/female/",
      },
    },
  ],
  [CHARACTER_CLOTH_TYPE.ROBE]: [
    {
      zPosition: 35,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "torso/clothes/robe/female/",
      },
    },
  ],
};
