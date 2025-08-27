import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_HAIR_TYPE,
  CHARACTER_HAIR_EXTENSION_TYPE,
  CHARACTER_HORNS_TYPE,
  CHARACTER_FINS_TYPE,
} from "./types";

export const hair_variant: CharacterVariant = {
  [CHARACTER_HAIR_TYPE.AFRO]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/afro/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/afro/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/afro/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/afro/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/afro/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.AFRO_NATURAL]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/natural/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/natural/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/natural/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/natural/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/natural/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.AFRO_DREADLOCKS_SHORT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/dreadlocks_short/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/dreadlocks_short/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/dreadlocks_short/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/dreadlocks_short/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/dreadlocks_short/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.AFRO_DREADLOCKS_LONG]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/dreadlocks_long/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/dreadlocks_long/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/dreadlocks_long/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/dreadlocks_long/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/dreadlocks_long/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.AFRO_TWISTS_FADE]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/twists_fade/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/twists_fade/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/twists_fade/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/twists_fade/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/twists_fade/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.AFRO_TWISTS_STRAIGHT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/twists_straight/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/twists_straight/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/twists_straight/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/twists_straight/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/twists_straight/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.AFRO_FLAT_TOP_FADE]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/flat_top_fade/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/flat_top_fade/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/flat_top_fade/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/flat_top_fade/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/flat_top_fade/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.AFRO_FLAT_TOP_STRAIGHT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/flat_top_straight/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/flat_top_straight/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/flat_top_straight/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/flat_top_straight/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/flat_top_straight/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.AFRO_CORNROWS]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/cornrows/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/cornrows/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/cornrows/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/cornrows/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/cornrows/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.CURLY_JEWFRO]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/jewfro/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/jewfro/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/jewfro/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/jewfro/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/jewfro/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.CURLY_SHROT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/curly_short/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/curly_short/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/curly_short/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/curly_short/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/curly_short/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.CURLY_LONG]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/curly_long/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/curly_long/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/curly_long/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/curly_long/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/curly_long/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BALD_SHAVED_BALDING]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/balding/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/balding/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/balding/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/balding/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/balding/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BALD_SHAVED_LONGHAWK]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/longhawk/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/longhawk/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/longhawk/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/longhawk/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/longhawk/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BALD_SHAVED_SHORTHAWK]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/shorthawk/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/shorthawk/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/shorthawk/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/shorthawk/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/shorthawk/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BALD_SHAVED_HIGH_TIGHT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/high_and_tight/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/high_and_tight/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/high_and_tight/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/high_and_tight/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/high_and_tight/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BALD_SHAVED_BUZZCUT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/buzzcut/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/buzzcut/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/buzzcut/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/buzzcut/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/buzzcut/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_PLAIN]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/plain/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/plain/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/plain/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/plain/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/plain/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_PIXIE]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/pixie/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/pixie/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/pixie/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/pixie/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/pixie/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_PAGE]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/page/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/page/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/page/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/page/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/page/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_PAGE2]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/page2/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/page2/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/page2/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/page2/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/page2/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_IDOL]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/idol/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/idol/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/idol/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/idol/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/idol/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_MOP]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/mop/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/mop/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/mop/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/mop/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/mop/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_PARTED]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/parted/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/parted/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/parted/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/parted/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/parted/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_PART2]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/part2/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/part2/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/part2/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/part2/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/part2/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_MESSY1]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/messy1/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/messy1/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/messy1/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/messy1/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/messy1/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_MESSY2]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/messy2/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/messy2/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/messy2/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/messy2/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/messy2/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_MESSY3]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/messy3/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/messy3/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/messy3/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/messy3/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/messy3/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_BEDHEAD]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/bedhead/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/bedhead/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/bedhead/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/bedhead/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/bedhead/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_UNKEMPT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/unkempt/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/unkempt/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/unkempt/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/unkempt/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/unkempt/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_BANGSSHORT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/bangsshort/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/bangsshort/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/bangsshort/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/bangsshort/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/bangsshort/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_SWOOP]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/swoop/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/swoop/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/swoop/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/swoop/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/swoop/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_SIDE_SWOOP]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/sideswoop/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/sideswoop/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/sideswoop/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/sideswoop/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/sideswoop/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/sideswoop/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_CURTAINS]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/curtains/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/curtains/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/curtains/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/curtains/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/curtains/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_BANGS]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/bangs/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/bangs/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/bangs/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/bangs/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/bangs/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_SINGLE]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/single/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/single/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/single/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/single/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/single/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_COWLICK]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/cowlick/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/cowlick/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/cowlick/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/cowlick/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/cowlick/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_COWLICK_TALL]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/cowlick_tall/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/cowlick_tall/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/cowlick_tall/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/cowlick_tall/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/cowlick_tall/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SHORT_TIED_BACK]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/tied_back/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/tied_back/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/tied_back/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/tied_back/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/tied_back/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/tied_back/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SPIKY_SPIKED_PORCUPINE]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/spiked_porcupine/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/spiked_porcupine/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/spiked_porcupine/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/spiked_porcupine/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/spiked_porcupine/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SPIKY_SPIKED_LIBERTY]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/spiked_liberty/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/spiked_liberty/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/spiked_liberty/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/spiked_liberty/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/spiked_liberty/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SPIKY_SPIKED_LIBERTY2]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/spiked_liberty2/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/spiked_liberty2/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/spiked_liberty2/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/spiked_liberty2/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/spiked_liberty2/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SPIKY_SPIKED_BEEHIVE]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/spiked_beehive/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/spiked_beehive/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/spiked_beehive/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/spiked_beehive/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/spiked_beehive/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SPIKY_SPIKED]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/spiked/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/spiked/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/spiked/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/spiked/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/spiked/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SPIKY_SPIKED2]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/spiked2/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/spiked2/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/spiked2/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/spiked2/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/spiked2/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.SPIKY_HALFMESSY]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/halfmessy/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/halfmessy/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/halfmessy/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/halfmessy/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/halfmessy/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.PIGTAILS]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/pigtails/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/pigtails/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/pigtails/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/pigtails/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/pigtails/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.PIGTAILS_BUNCHES]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/bunches/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/bunches/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/bunches/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/bunches/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/bunches/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.PIGTAILS_BANGS]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/pigtails_bangs/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/pigtails_bangs/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/pigtails_bangs/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/pigtails_bangs/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/pigtails_bangs/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BOB]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/bob/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/bob/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/bob/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/bob/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/bob/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BOB_LOB]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/lob/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/lob/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/lob/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/lob/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/lob/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BOB_SIDE_PART]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/bob_side_part/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/bob_side_part/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/bob_side_part/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/bob_side_part/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/bob_side_part/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_HALF_UP]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/half_up/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/half_up/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/half_up/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/half_up/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/half_up/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_BANGS_BUN]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/bangs_bun/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/bangs_bun/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/bangs_bun/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/bangs_bun/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/bangs_bun/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_SHORTKNOT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/shortknot/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/shortknot/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/shortknot/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/shortknot/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/shortknot/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_LONGKNOT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/longknot/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/longknot/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/longknot/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/longknot/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/longknot/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_PONYTAIL]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/ponytail/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:"hair/ponytail/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/ponytail/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/ponytail/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/ponytail/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_PONYTAIL2]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/ponytail2/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/ponytail2/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/ponytail2/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/ponytail2/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/ponytail2/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_HIGH_PONY_TAIL]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/high_ponytail/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/high_ponytail/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/high_ponytail/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/high_ponytail/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/high_ponytail/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_BRAID]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/braid/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/braid/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/braid/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/braid/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/braid/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_BRAID2]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/braid2/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/braid2/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/braid2/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/braid2/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/braid2/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_SHOULDER_LEFT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/shoulderl/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/shoulderl/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/shoulderl/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/shoulderl/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/shoulderl/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_SHOUDLER_RIGHT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/shoulderr/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/shoulderr/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/shoulderr/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/shoulderr/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/shoulderr/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_LONG_TIED]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/long_tied/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/long_tied/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/long_tied/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/long_tied/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/long_tied/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.BRAIDS_PONYTAILS_UPDOS_XLONG_PONYTAIL]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/xlong_ponytail/adult/mg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/xlong_ponytail/adult/mg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/xlong_ponytail/adult/mg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/xlong_ponytail/child/mg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/xlong_ponytail/adult/mg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/xlong_ponytail/adult/mg/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/xlong_ponytail/adult/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/xlong_ponytail/adult/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/xlong_ponytail/adult/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/xlong_ponytail/child/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/xlong_ponytail/adult/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/xlong_ponytail/adult/bg/",
      },
    },
    {
      zPosition: 145,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/xlong_ponytail/adult/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/xlong_ponytail/adult/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/xlong_ponytail/adult/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/xlong_ponytail/child/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/xlong_ponytail/adult/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/xlong_ponytail/adult/fg/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/long/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/long/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/long/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/long/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/long/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG_LOOSE]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/loose/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/loose/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/loose/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/loose/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/loose/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG_BANGSLONG]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/bangslong/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/bangslong/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/bangslong/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/bangslong/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/bangslong/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG_BANGSLONG2]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/bangslong2/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/bangslong2/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/bangslong2/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/bangslong2/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/bangslong2/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG_MESSY]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/long_messy/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/long_messy/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/long_messy/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/long_messy/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/long_messy/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG_MESSY2]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/long_messy2/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/long_messy2/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/long_messy2/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/long_messy2/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/long_messy2/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG_CURTAINS_LONG]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/curtains_long/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/curtains_long/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/curtains_long/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/curtains_long/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/curtains_long/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG_WAVY]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/wavy/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/wavy/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/wavy/male/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/wavy/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/wavy/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/wavy/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG_LONG_CENTER_PART]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/long_center_part/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/long_center_part/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/long_center_part/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/long_center_part/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/long_center_part/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.LONG_STRAIGHT]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/long_straight/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/long_straight/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/long_straight/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/long_straight/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/long_straight/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.VERY_LONG_PRINESS]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/princess/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/princess/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/princess/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/princess/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/princess/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.VERY_LONG_SARA]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/sara/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/sara/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/sara/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/sara/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/sara/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.VERY_LONG_BAND]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/long_band/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/long_band/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/long_band/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/long_band/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/long_band/male/",
      },
    },
  ],
  [CHARACTER_HAIR_TYPE.VERY_LONG_XLONG]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/xlong/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/xlong/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/xlong/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/xlong/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/xlong/male/",
      },
    },
  ],
};

export const hair_extension_left_variant: CharacterVariant = {
  [CHARACTER_HAIR_EXTENSION_TYPE.BRAID]: [
    {
      zPosition: 121,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/extensions/braidl/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/extensions/braidl/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/extensions/braidl/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/extensions/braidl/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/extensions/braidl/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/extensions/braidl/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_EXTENSION_TYPE.XLONG_BANG]: [
    {
      zPosition: 128,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/extensions/xlong_bangl/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/extensions/xlong_bangl/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/extensions/xlong_bangl/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/extensions/xlong_bangl/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/extensions/xlong_bangl/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/extensions/xlong_bangl/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_EXTENSION_TYPE.XLONG_BRAID]: [
    {
      zPosition: 128,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/extensions/xlong_braidl/adult_front/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/extensions/xlong_braidl/adult_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/extensions/xlong_braidl/adult_front/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/extensions/xlong_braidl/child_front/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/extensions/xlong_braidl/adult_front/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/extensions/xlong_braidl/adult_front/",
      },
    },
    {
      zPosition: 8.9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/extensions/xlong_braidl/adult_back/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/extensions/xlong_braidl/adult_back/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/extensions/xlong_braidl/adult_back/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/extensions/xlong_braidl/child_back/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/extensions/xlong_braidl/adult_back/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/extensions/xlong_braidl/adult_back/",
      },
    },
  ]
}

export const hair_extension_right_variant: CharacterVariant = {
  [CHARACTER_HAIR_EXTENSION_TYPE.BRAID]: [
    {
      zPosition: 121,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/extensions/braidr/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/extensions/braidr/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/extensions/braidr/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/extensions/braidr/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/extensions/braidr/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/extensions/braidr/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_EXTENSION_TYPE.XLONG_BANG]: [
    {
      zPosition: 128,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/extensions/xlong_bangr/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/extensions/xlong_bangr/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/extensions/xlong_bangr/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/extensions/xlong_bangr/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/extensions/xlong_bangr/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/extensions/xlong_bangr/adult/",
      },
    },
  ],
  [CHARACTER_HAIR_EXTENSION_TYPE.XLONG_BRAID]: [
    {
      zPosition: 128,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/extensions/xlong_braidr/adult_front/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/extensions/xlong_braidr/adult_front/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/extensions/xlong_braidr/adult_front/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/extensions/xlong_braidr/child_front/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/extensions/xlong_braidr/adult_front/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/extensions/xlong_braidr/adult_front/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hair/extensions/xlong_braidr/adult_back/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hair/extensions/xlong_braidr/adult_back/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hair/extensions/xlong_braidr/adult_back/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hair/extensions/xlong_braidr/child_back/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hair/extensions/xlong_braidr/adult_back/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hair/extensions/xlong_braidr/adult_back/",
      },
    },
  ],
}

export const horns_variant: CharacterVariant = {
  [CHARACTER_HORNS_TYPE.BACKWARDS_HORNS]: [
    {
      zPosition: 126,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/horns/backwards/adult/fg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/horns/backwards/adult/fg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/horns/backwards/adult/fg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/horns/backwards/child/fg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/horns/backwards/adult/fg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/horns/backwards/adult/fg/",
      },
    },
    {
      zPosition: 7,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/horns/backwards/adult/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/horns/backwards/adult/bg/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/horns/backwards/adult/bg/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/horns/backwards/child/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/horns/backwards/adult/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/horns/backwards/adult/bg/",
      },
    },
  ],
  [CHARACTER_HORNS_TYPE.CURLED_HORNS]: [
    {
      zPosition: 126,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/horns/curled/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/horns/curled/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/horns/curled/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/horns/curled/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/horns/curled/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/horns/curled/adult/",
      },
    },
  ],
}

export const fins_variant: CharacterVariant = {
  [CHARACTER_FINS_TYPE.FIN]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/fins/fin/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/fins/fin/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/fins/fin/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/fins/fin/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/fins/fin/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/fins/fin/adult/",
      },
    },
  ],
  [CHARACTER_FINS_TYPE.SHORT_FIN]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/fins/fin_short/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/fins/fin_short/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/fins/fin_short/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "head/fins/fin_short/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/fins/fin_short/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/fins/fin_short/adult/",
      },
    },
  ],
}