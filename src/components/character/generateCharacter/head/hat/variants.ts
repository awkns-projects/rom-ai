import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_HAT_TYPE, CHARACTER_VISOR_TYPE } from "./types";

export const hat_variant: CharacterVariant = {
  [CHARACTER_HAT_TYPE.FORMAL]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/formal/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/formal/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/formal/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/formal/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/formal/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.REPTILE]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/reptile/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/reptile/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/reptile/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/reptile/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/reptile/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.MAGIC]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/magic/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/magic/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/magic/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/magic/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/magic/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.CLOTH]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/cloth/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/cloth/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/cloth/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/cloth/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/cloth/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_ARMET]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/armet/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/armet/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/armet/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/armet/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/armet/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_SIMPLE_ARMET]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/armet_simple/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/armet_simple/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/armet_simple/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/armet_simple/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/armet_simple/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_BARBARIAN]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/barbarian/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/barbarian/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/barbarian/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/barbarian/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/barbarian/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_BARBARIAN_NASAL]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/barbarian_nasal/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/barbarian_nasal/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/barbarian_nasal/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/barbarian_nasal/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/barbarian_nasal/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_BARBARIAN_VIKING]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/barbarian_viking/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/barbarian_viking/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/barbarian_viking/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/barbarian_viking/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/barbarian_viking/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_BARBUTA]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/barbuta/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/barbuta/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/barbuta/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/barbuta/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/barbuta/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_SIMPLE_BARBUTA]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/barbuta_simple/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/barbuta_simple/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/barbuta_simple/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/barbuta_simple/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/barbuta_simple/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_BASCINET]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/bascinet/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/bascinet/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/bascinet/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/bascinet/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/bascinet/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_PIGFACE_BASCINET]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/bascinet_pigface/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/bascinet_pigface/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/bascinet_pigface/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/bascinet_pigface/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/bascinet_pigface/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_PIGFACE_BASCINET_RAISED]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "hat/helmet/bascinet_pigface_raised/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/helmet/bascinet_pigface_raised/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "hat/helmet/bascinet_pigface_raised/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "hat/helmet/bascinet_pigface_raised/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "hat/helmet/bascinet_pigface_raised/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_ROUND_BASCINET]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/bascinet_round/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/bascinet_round/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/bascinet_round/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/bascinet_round/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/bascinet_round/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_ROUND_BASCINET_RAISED]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/bascinet_round_raised/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/helmet/bascinet_round_raised/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/bascinet_round_raised/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "hat/helmet/bascinet_round_raised/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "hat/helmet/bascinet_round_raised/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_CLOSE_HELM]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/close/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/close/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/close/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/close/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/close/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_FLATTOP]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/flattop/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/flattop/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/flattop/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/flattop/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/flattop/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_GREATHELM]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/greathelm/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/greathelm/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/greathelm/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/greathelm/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/greathelm/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_HORNED_HELMET]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/horned/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/horned/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/horned/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/horned/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/horned/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_KETTLE_HELM]: [
    {
      zPosition: 135,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/kettle/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/kettle/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/kettle/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/kettle/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/kettle/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_LEGION]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/legion/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/legion/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/legion/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/legion/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/legion/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_MAXIMUS]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/maximus/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/maximus/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/maximus/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/maximus/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/maximus/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_MORION]: [
    {
      zPosition: 135,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/morion/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/morion/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/morion/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/morion/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/morion/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_NASAL_HELM]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/nasal/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/nasal/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/nasal/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/nasal/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/nasal/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_NORMAN_HELM]: [
    {
      zPosition: 135,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/norman/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/norman/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/norman/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/norman/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/norman/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_POINTED_HELM]: [
    {
      zPosition: 135,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/pointed/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/pointed/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/pointed/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/pointed/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/pointed/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_SPANGENHELM]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/spangenhelm/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/spangenhelm/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/spangenhelm/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/spangenhelm/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/spangenhelm/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_VIKING_SPANGENHELM]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/spangenhelm_viking/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/spangenhelm_viking/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/spangenhelm_viking/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "hat/helmet/spangenhelm_viking/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "hat/helmet/spangenhelm_viking/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_SUGARLOAF_GREATHELM]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/sugarloaf/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/sugarloaf/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/sugarloaf/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/sugarloaf/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/sugarloaf/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_SIMPLE_SUGARLOAF_GREATHELM]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/sugarloaf_simple/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/sugarloaf_simple/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/sugarloaf_simple/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/sugarloaf_simple/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/sugarloaf_simple/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.HELMETS_XEON_HELMET]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/helmet/xeon/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/helmet/xeon/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/helmet/xeon/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/helmet/xeon/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/helmet/xeon/adult/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_BONNIE]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/bonnie/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/bonnie/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/bonnie/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_BONNIE_FEATHER]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/bonnie_feather/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/bonnie_feather/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/bonnie_feather/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_CAVALIER]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/cavalier/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/cavalier/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/cavalier/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_CAVALIER_FEATHER]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/cavalier_feather/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/cavalier_feather/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/cavalier_feather/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_TRICORNE]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/tricorne/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/tricorne/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/tricorne/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_TRICORNE_STITCHED]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/tricorne_stitched/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/tricorne_stitched/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/tricorne_stitched/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_TRICORNE_THATCH]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/tricorne_thatch/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/tricorne_thatch/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/tricorne_thatch/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_TRICORNE_PIRATE_CAPTAIN]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "hat/pirate/tricorne_captain_pirate_skull/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/pirate/tricorne_captain_pirate_skull/male/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "hat/pirate/tricorne_captain_pirate_skull/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_TRICORNE_LIEUTENANT]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/tricorne_lieutenant/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/tricorne_lieutenant/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/tricorne_lieutenant/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_TRICORNE_CAPTAIN]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/tricorne_captain/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/tricorne_captain/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/tricorne_captain/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_BICORNE_ATHWART]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/bicorne_athwart/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/bicorne_athwart/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/bicorne_athwart/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_BICORNE_ATHWART_PIRATE]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/bicorne_athwart_pirate/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/pirate/bicorne_athwart_pirate/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/bicorne_athwart_pirate/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_BICORNE_ATHWART_ADMIRAL]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "hat/pirate/bicorne_athwart_admiral/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/pirate/bicorne_athwart_admiral/male/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "hat/pirate/bicorne_athwart_admiral/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_BICORNE_ATHWART_ADMIRAL_COCKADE]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "hat/pirate/bicorne_athwart_admiral_cockade/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/pirate/bicorne_athwart_admiral_cockade/male/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "hat/pirate/bicorne_athwart_admiral_cockade/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_BICORNE_ATHWART_COMMODORE]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "hat/pirate/bicorne_athwart_commodore/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/pirate/bicorne_athwart_commodore/male/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "hat/pirate/bicorne_athwart_commodore/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_BICORNE_FOREAFT]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/pirate/bicorne_foreaft/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/pirate/bicorne_foreaft/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/pirate/bicorne_foreaft/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.PIRATE_BICORNE_FOREAFT_COMMODORE]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "hat/pirate/bicorne_foreaft_commodore/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "hat/pirate/bicorne_foreaft_commodore/male/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "hat/pirate/bicorne_foreaft_commodore/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.CROWN]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/crown/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/crown/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/crown/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/crown/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/crown/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.CROWN_TIARA]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/tiara/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/tiara/female/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.SPECIAL_SANTA]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/santa/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/santa/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/santa/male/",
      },
    },
  ],
  [CHARACTER_HAT_TYPE.SPECIAL_ELF]: [
    {
      zPosition: 130,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/elf/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/elf/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/elf/male/",
      },
    },
  ],
};

export const visor_variant: CharacterVariant = {
  [CHARACTER_VISOR_TYPE.GRATED_VISOR]: [
    {
      zPosition: 132,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/visor/grated/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/visor/grated/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/visor/grated/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/visor/grated/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/visor/grated/male/",
      },
    },
  ],
  [CHARACTER_VISOR_TYPE.NARROW_GRATED_VISOR]: [
    {
      zPosition: 132,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/visor/grated_narrow/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/visor/grated_narrow/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/visor/grated_narrow/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/visor/grated_narrow/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/visor/grated_narrow/male/",
      },
    },
  ],
  [CHARACTER_VISOR_TYPE.HORNED_VISOR]: [
    {
      zPosition: 132,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/visor/horned/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/visor/horned/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/visor/horned/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/visor/horned/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/visor/horned/male/",
      },
    },
  ],
  [CHARACTER_VISOR_TYPE.PIGFACE_VISOR]: [
    {
      zPosition: 132,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/visor/pigface/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/visor/pigface/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/visor/pigface/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/visor/pigface/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/visor/pigface/male/",
      },
    },
  ],
  [CHARACTER_VISOR_TYPE.PIGFACE_VISOR_RAISED]: [
    {
      zPosition: 132,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/visor/pigface_raised/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/visor/pigface_raised/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/visor/pigface_raised/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/visor/pigface_raised/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/visor/pigface_raised/male/",
      },
    },
  ],
  [CHARACTER_VISOR_TYPE.ROUND_VISOR]: [
    {
      zPosition: 132,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/visor/round/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/visor/round/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/visor/round/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/visor/round/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/visor/round/male/",
      },
    },
  ],
  [CHARACTER_VISOR_TYPE.ROUND_VISOR_RAISED]: [
    {
      zPosition: 132,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/visor/round_raised/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/visor/round_raised/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/visor/round_raised/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/visor/round_raised/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/visor/round_raised/male/",
      },
    },
  ],
  [CHARACTER_VISOR_TYPE.SLIT_VISOR]: [
    {
      zPosition: 132,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/visor/slit/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/visor/slit/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/visor/slit/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/visor/slit/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/visor/slit/male/",
      },
    },
  ],
  [CHARACTER_VISOR_TYPE.NARROW_SLIT_VISOR]: [
    {
      zPosition: 132,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "hat/visor/slit_narrow/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "hat/visor/slit_narrow/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "hat/visor/slit_narrow/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "hat/visor/slit_narrow/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "hat/visor/slit_narrow/male/",
      },
    },
  ],
};
