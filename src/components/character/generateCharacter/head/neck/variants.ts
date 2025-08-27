import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_NECK_TYPE, CHARACTER_NECKLACE_TYPE } from "./types";

export const neck_variant: CharacterVariant = {
  [CHARACTER_NECK_TYPE.BOWTIE]: [
    {
      zPosition: 90,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "neck/tie/bowtie/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "neck/tie/bowtie/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "neck/tie/bowtie/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "neck/tie/bowtie/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "neck/tie/bowtie/adult/",
      },
    },
  ],
  [CHARACTER_NECK_TYPE.BOWTIE2]: [
    {
      zPosition: 90,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "neck/tie/bowtie2/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "neck/tie/bowtie2/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "neck/tie/bowtie2/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "neck/tie/bowtie2/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "neck/tie/bowtie2/adult/",
      },
    },
  ],
  [CHARACTER_NECK_TYPE.NECKTIE]: [
    {
      zPosition: 90,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "neck/tie/necktie/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "neck/tie/necktie/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "neck/tie/necktie/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "neck/tie/necktie/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "neck/tie/necktie/male/",
      },
    },
  ],
  [CHARACTER_NECK_TYPE.SCARF]: [
    {
      zPosition: 90,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "neck/scarf/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "neck/scarf/",
        [CHARACTER_PERSON_TYPE.TEEN]: "neck/scarf/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "neck/scarf/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "neck/scarf/",
      },
    },
  ],
  [CHARACTER_NECK_TYPE.CAPECLIP]: [
    {
      zPosition: 90,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "neck/capeclip/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "neck/capeclip/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "neck/capeclip/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "neck/capeclip/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "neck/capeclip/male/",
      },
    },
  ],
  [CHARACTER_NECK_TYPE.CAPETIE]: [
    {
      zPosition: 90,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "neck/capetie/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "neck/capetie/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "neck/capetie/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "neck/capetie/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "neck/capetie/male/",
      },
    },
  ],
  [CHARACTER_NECK_TYPE.JABOT]: [
    {
      zPosition: 90,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "neck/jabot/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "neck/jabot/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "neck/jabot/male/",
      },
    },
  ],
  [CHARACTER_NECK_TYPE.CRAVAT]: [
    {
      zPosition: 90,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "neck/cravat/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "neck/cravat/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "neck/cravat/male/",
      },
    },
  ],
};

export const necklace_variant: CharacterVariant = {
  [CHARACTER_NECKLACE_TYPE.NECKLACE]: [
    {
      zPosition: 80,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "neck/necklace/female/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "neck/necklace/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "neck/necklace/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "neck/necklace/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "neck/necklace/female/",
      },
    },
  ],
};
