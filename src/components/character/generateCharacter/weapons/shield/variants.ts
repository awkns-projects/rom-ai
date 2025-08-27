import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_SHIELD_TYPE,
  CHARACTER_SHIELD_PAINT_TYPE,
  CHARACTER_SHIELD_PATTERN_TYPE,
  CHARACTER_SHIELD_TRIM_TYPE,
} from "./types";

export const shield_variant: CharacterVariant = {
  [CHARACTER_SHIELD_TYPE.SHIELD]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/male/",
      },
    },
  ],
  [CHARACTER_SHIELD_TYPE.SPARTAN]: [
    {
      zPosition: 2,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/spartan/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/spartan/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/spartan/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/spartan/bg/",
      },
    },
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/spartan/fg/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/spartan/fg/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/spartan/fg/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/spartan/fg/male/",
      },
    },
  ],
  [CHARACTER_SHIELD_TYPE.TWO_ENGRAILED]: [
    {
      zPosition: 2,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/two_engrailed/paint/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/two_engrailed/paint/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/two_engrailed/paint/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/two_engrailed/paint/bg/",
      },
    },
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/two_engrailed/paint/fg/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/two_engrailed/paint/fg/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/two_engrailed/paint/fg/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/two_engrailed/paint/fg/male/",
      },
    },
  ],
  [CHARACTER_SHIELD_TYPE.CRUSADER]: [
    {
      zPosition: 2,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/crusader/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/crusader/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/crusader/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/crusader/bg/",
      },
    },
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/crusader/fg/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/crusader/fg/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/crusader/fg/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/crusader/fg/male/",
      },
    },
  ],
  [CHARACTER_SHIELD_TYPE.PLUS]: [
    {
      zPosition: 2,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/plus/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/plus/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/plus/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/plus/bg/",
      },
    },
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/plus/fg/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/plus/fg/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/plus/fg/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/plus/fg/male/",
      },
    },
  ],
  [CHARACTER_SHIELD_TYPE.SCUTUM]: [
    {
      zPosition: 2,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/scutum/paint/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/scutum/paint/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/scutum/paint/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/scutum/paint/bg/",
      },
    },
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/scutum/paint/fg/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/scutum/paint/fg/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/scutum/paint/fg/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/scutum/paint/fg/male/",
      },
    },
  ],
  [CHARACTER_SHIELD_TYPE.HEATER]: [
    {
      zPosition: 110,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/wood/universal/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/heater/wood/universal/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/heater/wood/universal/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/heater/wood/universal/",
      },
    },
  ],
};

export const shield_trim_variant: CharacterVariant = {
  [CHARACTER_SHIELD_TRIM_TYPE.TWO_ENGRAILED]: [
    {
      zPosition: 3,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/two_engrailed/trim/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/two_engrailed/trim/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/two_engrailed/trim/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/two_engrailed/trim/bg/",
      },
    },
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/two_engrailed/trim/fg/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/two_engrailed/trim/fg/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/two_engrailed/trim/fg/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/two_engrailed/trim/fg/male/",
      },
    },
  ],
  [CHARACTER_SHIELD_TRIM_TYPE.SCUTUM]: [
    {
      zPosition: 3,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/scutum_trim/bg/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/scutum_trim/bg/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/scutum_trim/bg/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/scutum_trim/bg/",
      },
    },
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/scutum_trim/fg/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/scutum_trim/fg/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/scutum_trim/fg/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/scutum_trim/fg/male/",
      },
    },
  ],
  [CHARACTER_SHIELD_TRIM_TYPE.HEATER]: [
    {
      zPosition: 115,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/trim/universal/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/heater/trim/universal/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/heater/trim/universal/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/heater/trim/universal/",
      },
    },
  ],
};

export const shield_paint_variant: CharacterVariant = {
  [CHARACTER_SHIELD_PAINT_TYPE.HEATER]: [
    {
      zPosition: 111,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/paint/universal/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/heater/paint/universal/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "shield/heater/paint/universal/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "shield/heater/paint/universal/",
      },
    },
  ],
};

export const shield_pattern_variant: CharacterVariant = {
  [CHARACTER_SHIELD_PATTERN_TYPE.BARRY]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/pattern/universal/barry/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/barry/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/barry/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/barry/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.BEND_SINISTER]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/bend_sinister/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/bend_sinister/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/bend_sinister/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/bend_sinister/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.BEND]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/pattern/universal/bend/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/heater/pattern/universal/bend/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/bend/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/bend/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.BENDY_SINISTER]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/bendy_sinister/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/bendy_sinister/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/bendy_sinister/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/bendy_sinister/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.BENDY]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/pattern/universal/bendy/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/bendy/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/bendy/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/bendy/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.BORDURE]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/bordure/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/bordure/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/bordure/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/bordure/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.CHEVRON_INVERTED]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/chevron_inverted/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/chevron_inverted/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/chevron_inverted/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/chevron_inverted/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.CHEVRON]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/chevron/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/chevron/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/chevron/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/chevron/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.CHIEF]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/pattern/universal/chief/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/chief/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/chief/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/chief/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.CROSS]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/pattern/universal/cross/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/cross/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/cross/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/cross/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.FESS]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/pattern/universal/fess/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/heater/pattern/universal/fess/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/fess/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/fess/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.LOZENGY]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/lozengy/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/lozengy/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/lozengy/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/lozengy/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PALE]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/pattern/universal/pale/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/heater/pattern/universal/pale/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/pale/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/pale/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PALL]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/pattern/universal/pall/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/heater/pattern/universal/pall/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/pall/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/pall/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PALY]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "shield/heater/pattern/universal/paly/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "shield/heater/pattern/universal/paly/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/paly/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/paly/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PER_BEND_SINISTER]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/per_bend_sinister/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/per_bend_sinister/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/per_bend_sinister/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/per_bend_sinister/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PER_BEND]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/per_bend/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/per_bend/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/per_bend/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/per_bend/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PER_CHEVRON_INVERTED]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/per_chevron_inverted/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/per_chevron_inverted/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/per_chevron_inverted/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/per_chevron_inverted/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PER_CHEVRON]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/per_chevron/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/per_chevron/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/per_chevron/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/per_chevron/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PER_FESS]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/per_fess/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/per_fess/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/per_fess/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/per_fess/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PER_PALE]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/per_pale/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/per_pale/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/per_pale/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/per_pale/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.PER_SALTIRE]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/per_saltire/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/per_saltire/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/per_saltire/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/per_saltire/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.QUARTERLY]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/quarterly/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/quarterly/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/quarterly/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/quarterly/",
      },
    },
  ],
  [CHARACTER_SHIELD_PATTERN_TYPE.SALTIRE]: [
    {
      zPosition: 112,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "shield/heater/pattern/universal/saltire/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "shield/heater/pattern/universal/saltire/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "shield/heater/pattern/universal/saltire/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "shield/heater/pattern/universal/saltire/",
      },
    },
  ],
};
