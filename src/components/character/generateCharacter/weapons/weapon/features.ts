import {
  CHARACTER_STYLE,
  CHARACTER_FEATURE,
  CharacterFeature,
} from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_WEAPON_TYPE,
  CHARACTER_WEAPON_MAGIC_CRYSTAL_TYPE
} from "./types";

export const weapon_smash_stylemap = [
  CHARACTER_STYLE.AXE,
  CHARACTER_STYLE.PICKAXE,
];

export const weapon_thrust_stylemap = [
  CHARACTER_STYLE.HOE,
  CHARACTER_STYLE.SHOVEL,
  CHARACTER_STYLE.WATERING,
];

export const weapon_crossbow_stylemap = [CHARACTER_STYLE.CROSSBOW];

export const weapon_slingshot_stylemap = [CHARACTER_STYLE.SLINGSHOT];

export const weapon_dagger_stylemap = [CHARACTER_STYLE.DAGGER];

export const weapon_glowsword_stylemap = [
  CHARACTER_STYLE.BLUE,
  CHARACTER_STYLE.RED,
];

export const weapon_longsword_stylemap = [CHARACTER_STYLE.LONGSWORD];

export const weapon_rapier_stylemap = [CHARACTER_STYLE.RAPIER];

export const weapon_saber_stylemap = [CHARACTER_STYLE.SABER];

export const weapon_flail_stylemap = [CHARACTER_STYLE.FLAIL];

export const weapon_mace_stylemap = [CHARACTER_STYLE.MACE];

export const weapon_waraxe_stylemap = [CHARACTER_STYLE.WARAXE];

export const weapon_cane_stylemap = [CHARACTER_STYLE.CANE];

export const weapon_spear_stylemap = [
  CHARACTER_STYLE.MEDIUM,
  CHARACTER_STYLE.LIGHT,
  CHARACTER_STYLE.RED,
  CHARACTER_STYLE.DARK,
  CHARACTER_STYLE.BRASS,
  CHARACTER_STYLE.BRONZE,
  CHARACTER_STYLE.CERAMIC,
  CHARACTER_STYLE.COPPER,
  CHARACTER_STYLE.GOLD,
  CHARACTER_STYLE.IRON,
  CHARACTER_STYLE.SILVER,
  CHARACTER_STYLE.STEEL,
];

export const weapon_scythe_stylemap = [CHARACTER_STYLE.SCYTHE];

export const weapon_halberd_stylemap = [CHARACTER_STYLE.HALBERD];

export const weapon_simple_staff_stylemap = [CHARACTER_STYLE.SIMPLE];

export const weapon_staff_stylemap = [
  CHARACTER_STYLE.MEDIUM,
  CHARACTER_STYLE.LIGHT,
  CHARACTER_STYLE.RED,
  CHARACTER_STYLE.DARK,
  CHARACTER_STYLE.BRASS,
  CHARACTER_STYLE.BRONZE,
  CHARACTER_STYLE.CERAMIC,
  CHARACTER_STYLE.COPPER,
  CHARACTER_STYLE.GOLD,
  CHARACTER_STYLE.IRON,
  CHARACTER_STYLE.SILVER,
  CHARACTER_STYLE.STEEL,
];

export const weapon_feature: CharacterFeature = {
  [CHARACTER_WEAPON_TYPE.NONE]: {
    variant: CHARACTER_WEAPON_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_WEAPON_TYPE.SMASH]: {
    variant: CHARACTER_WEAPON_TYPE.SMASH,
    stylemap: weapon_smash_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.THRUST]: {
    variant: CHARACTER_WEAPON_TYPE.THRUST,
    stylemap: weapon_thrust_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.CROSSBOW]: {
    variant: CHARACTER_WEAPON_TYPE.CROSSBOW,
    stylemap: weapon_crossbow_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.SLINGSHOT]: {
    variant: CHARACTER_WEAPON_TYPE.SLINGSHOT,
    stylemap: weapon_slingshot_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.DAGGER]: {
    variant: CHARACTER_WEAPON_TYPE.DAGGER,
    stylemap: weapon_dagger_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.GLOWSWORD]: {
    variant: CHARACTER_WEAPON_TYPE.GLOWSWORD,
    stylemap: weapon_glowsword_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.LONGSWORD]: {
    variant: CHARACTER_WEAPON_TYPE.LONGSWORD,
    stylemap: weapon_longsword_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.RAPIER]: {
    variant: CHARACTER_WEAPON_TYPE.RAPIER,
    stylemap: weapon_rapier_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.SABER]: {
    variant: CHARACTER_WEAPON_TYPE.SABER,
    stylemap: weapon_saber_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.FLAIL]: {
    variant: CHARACTER_WEAPON_TYPE.FLAIL,
    stylemap: weapon_flail_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.MACE]: {
    variant: CHARACTER_WEAPON_TYPE.MACE,
    stylemap: weapon_mace_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.WARAXE]: {
    variant: CHARACTER_WEAPON_TYPE.WARAXE,
    stylemap: weapon_waraxe_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.CANE]: {
    variant: CHARACTER_WEAPON_TYPE.CANE,
    stylemap: weapon_cane_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.SPEAR]: {
    variant: CHARACTER_WEAPON_TYPE.SPEAR,
    stylemap: weapon_spear_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.SCYTHE]: {
    variant: CHARACTER_WEAPON_TYPE.SCYTHE,
    stylemap: weapon_scythe_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.HALBERD]: {
    variant: CHARACTER_WEAPON_TYPE.HALBERD,
    stylemap: weapon_halberd_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.SIMPLE_STAFF]: {
    variant: CHARACTER_WEAPON_TYPE.SIMPLE_STAFF,
    stylemap: weapon_simple_staff_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.TEEN,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.LOOP_STAFF]: {
    variant: CHARACTER_WEAPON_TYPE.LOOP_STAFF,
    stylemap: weapon_staff_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.TEEN,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.DIAMOND_STAFF]: {
    variant: CHARACTER_WEAPON_TYPE.DIAMOND_STAFF,
    stylemap: weapon_staff_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.TEEN,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.GNARLED_STAFF]: {
    variant: CHARACTER_WEAPON_TYPE.GNARLED_STAFF,
    stylemap: weapon_staff_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.TEEN,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
  [CHARACTER_WEAPON_TYPE.S_STAFF]: {
    variant: CHARACTER_WEAPON_TYPE.S_STAFF,
    stylemap: weapon_staff_stylemap,
    required: {
      [CHARACTER_FEATURE.PERSON]: [
        CHARACTER_PERSON_TYPE.MALE,
        CHARACTER_PERSON_TYPE.FEMALE,
        CHARACTER_PERSON_TYPE.TEEN,
        CHARACTER_PERSON_TYPE.PREGNANT,
        CHARACTER_PERSON_TYPE.MUSCULAR,
      ],
    },
  },
};

export const weapon_magic_crystal_stylemap = [
  CHARACTER_STYLE.BLUE,
  CHARACTER_STYLE.ORANGE,
  CHARACTER_STYLE.GREEN,
  CHARACTER_STYLE.PURPLE,
  CHARACTER_STYLE.RED,
  CHARACTER_STYLE.YELLOW
]

export const weapon_magic_crystal_feature: CharacterFeature = {
  [CHARACTER_WEAPON_MAGIC_CRYSTAL_TYPE.NONE]: {
    variant: CHARACTER_WEAPON_MAGIC_CRYSTAL_TYPE.NONE,
    stylemap: [],
    required: {},
  },
  [CHARACTER_WEAPON_MAGIC_CRYSTAL_TYPE.CRYSTAL]: {
    variant: CHARACTER_WEAPON_MAGIC_CRYSTAL_TYPE.CRYSTAL,
    stylemap: weapon_magic_crystal_stylemap,
    required: {
      [CHARACTER_FEATURE.WEAPON]: [
        CHARACTER_WEAPON_TYPE.LOOP_STAFF,
        CHARACTER_WEAPON_TYPE.DIAMOND_STAFF,
        CHARACTER_WEAPON_TYPE.GNARLED_STAFF,
      ],
    },
  },
}