import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_HEADCOVER_TYPE,
  CHARACTER_HEADCOVER_RUNE_TYPE,
  CHARACTER_HAIRTIE_TYPE,
  CHARACTER_HAIRTIE_RUNE_TYPE,
  CHARACTER_BANDANA_TYPE,
} from "./types";

export const headcover_variant: CharacterVariant = {
  [CHARACTER_HEADCOVER_TYPE.KERCHIEF]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/kerchief/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/kerchief/female/",
      },
    },
  ],
  [CHARACTER_HEADCOVER_TYPE.TIED_HEADBAND]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/head_band_tied/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/head_band_tied/female/",
      },
    },
  ],
  [CHARACTER_HEADCOVER_TYPE.HEAD_COVERINGS_WOVERLAY_THICK_HEADBAND]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/head_band_thick/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/head_band_thick/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/head_band_thick/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hat/head_band_thick/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/head_band_thick/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/head_band_thick/adult/",
      },
    },
  ],
}

export const headcover_rune_variant: CharacterVariant = {
  [CHARACTER_HEADCOVER_RUNE_TYPE.HEAD_COVERINGS_WOVERLAY_THICK_HEADBAND_RUNE]: [
    {
      zPosition: 126,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/head_band_thick/rune/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/head_band_thick/rune/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/head_band_thick/rune/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hat/head_band_thick/rune/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/head_band_thick/rune/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/head_band_thick/rune/adult/",
      },
    },
  ],
}

export const hairtie_variant: CharacterVariant = {
  [CHARACTER_HAIRTIE_TYPE.HEAD_COVERINGS_WOVERLAY_HAIRTIE]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/hair_tie/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/hair_tie/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/hair_tie/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hat/hair_tie/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/hair_tie/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/hair_tie/adult/",
      },
    },
  ],
}

export const hairtie_rune_variant: CharacterVariant = {
  [CHARACTER_HAIRTIE_RUNE_TYPE.HEAD_COVERINGS_WOVERLAY_HAIRTIE_RUNE]: [
    {
      zPosition: 126,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/hair_tie/rune/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/hair_tie/rune/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/hair_tie/rune/adult/",
        [CHARACTER_PERSON_TYPE.CHILD]: "hat/hair_tie/rune/child/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/hair_tie/rune/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/hair_tie/rune/adult/",
      },
    },
  ],
}

export const bandana_variant: CharacterVariant = {
  [CHARACTER_BANDANA_TYPE.BANDANA]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/bandana/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/bandana/female/",
      },
    },
  ],
  [CHARACTER_BANDANA_TYPE.SKULL_BANDANA]: [
    {
      zPosition: 120,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/bandana_skull/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/bandana_skull/female/",
      },
    },
  ],
  [CHARACTER_BANDANA_TYPE.MAIL]: [
    {
      zPosition: 125,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/mail/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/mail/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/mail/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/mail/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/mail/adult/",
      },
    },
  ],
}