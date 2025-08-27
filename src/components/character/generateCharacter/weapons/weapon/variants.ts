import { CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import {
  CHARACTER_WEAPON_TYPE,
  CHARACTER_WEAPON_MAGIC_CRYSTAL_TYPE,
} from "./types";

export const weapon_variant: CharacterVariant = {
  [CHARACTER_WEAPON_TYPE.SMASH]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "tools/smash/universal/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "tools/smash/universal/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "tools/smash/universal/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "tools/smash/universal/male/",
      },
    },
    {
      zPosition: 9,
      customAnimation: "slash_128",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "tools/smash/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "tools/smash/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "tools/smash/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "tools/smash/background/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_128",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "tools/smash/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "tools/smash/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "tools/smash/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "tools/smash/foreground/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.THRUST]: [
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "tools/thrust/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "tools/thrust/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "tools/thrust/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "tools/thrust/background/",
      },
    },
    {
      zPosition: 150,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "tools/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "tools/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "tools/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "tools/thrust/foreground/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.CROSSBOW]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/ranged/crossbow/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/ranged/crossbow/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/ranged/crossbow/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/ranged/crossbow/background/",
      },
    },
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/ranged/crossbow/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/ranged/crossbow/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/ranged/crossbow/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/ranged/crossbow/foreground/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.SLINGSHOT]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/ranged/slingshot/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/ranged/slingshot/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/ranged/slingshot/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/ranged/slingshot/foreground/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/ranged/slingshot/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/ranged/slingshot/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/ranged/slingshot/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/ranged/slingshot/background/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.DAGGER]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/dagger/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/dagger/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/sword/dagger/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/sword/dagger/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/dagger/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/dagger/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/sword/dagger/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/sword/dagger/behind/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.GLOWSWORD]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/glowsword/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/glowsword/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/sword/glowsword/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/sword/glowsword/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/sword/glowsword/universal_behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/sword/glowsword/universal_behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/glowsword/universal_behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/glowsword/universal_behind/",
      },
    },
    {
      zPosition: 8,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/sword/glowsword/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/sword/glowsword/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/glowsword/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/glowsword/attack_slash/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/glowsword/attack_slash/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/glowsword/attack_slash/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/glowsword/attack_slash/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/glowsword/attack_slash/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.LONGSWORD]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/longsword/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/longsword/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/sword/longsword/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/sword/longsword/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/sword/longsword/universal_behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/sword/longsword/universal_behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/longsword/universal_behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/longsword/universal_behind/",
      },
    },
    {
      zPosition: -1,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/sword/longsword/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/sword/longsword/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/longsword/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/longsword/attack_slash/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/longsword/attack_slash/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/longsword/attack_slash/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/longsword/attack_slash/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/longsword/attack_slash/",
      },
    },
    {
      zPosition: -1,
      customAnimation: "slash_reverse_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/sword/longsword/attack_slash_reverse/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/sword/longsword/attack_slash_reverse/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/longsword/attack_slash_reverse/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/longsword/attack_slash_reverse/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_reverse_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/sword/longsword/attack_slash_reverse/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/sword/longsword/attack_slash_reverse/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/longsword/attack_slash_reverse/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/longsword/attack_slash_reverse/",
      },
    },
    {
      zPosition: -1,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/sword/longsword/attack_thrust/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/sword/longsword/attack_thrust/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/longsword/attack_thrust/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/longsword/attack_thrust/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/longsword/attack_thrust/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/longsword/attack_thrust/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/longsword/attack_thrust/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/longsword/attack_thrust/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.RAPIER]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/rapier/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/rapier/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/sword/rapier/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/sword/rapier/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/rapier/universal_behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/rapier/universal_behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/rapier/universal_behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/rapier/universal_behind/",
      },
    },
    {
      zPosition: 8,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/sword/rapier/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/sword/rapier/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/rapier/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/rapier/attack_slash/behind/",
      },
    },
    {
      zPosition: 9,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/rapier/attack_slash/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/rapier/attack_slash/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/sword/rapier/attack_slash/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/sword/rapier/attack_slash/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.SABER]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/saber/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/saber/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/sword/saber/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/sword/saber/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/saber/universal_behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/saber/universal_behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/saber/universal_behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/saber/universal_behind/",
      },
    },
    {
      zPosition: 8,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/saber/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/sword/saber/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/sword/saber/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/sword/saber/attack_slash/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/sword/saber/attack_slash/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/sword/saber/attack_slash/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/sword/saber/attack_slash/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/sword/saber/attack_slash/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.FLAIL]: [
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/flail/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/blunt/flail/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/blunt/flail/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/blunt/flail/behind/",
      },
    },
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/flail/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/blunt/flail/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/blunt/flail/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/blunt/flail/",
      },
    },
    {
      zPosition: 8,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/flail/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/blunt/flail/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/blunt/flail/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/blunt/flail/attack_slash/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/flail/attack_slash/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/blunt/flail/attack_slash/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/blunt/flail/attack_slash/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/blunt/flail/attack_slash/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.MACE]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/mace/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/blunt/mace/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/blunt/mace/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/blunt/mace/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/mace/universal_behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/blunt/mace/universal_behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/blunt/mace/universal_behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/blunt/mace/universal_behind/",
      },
    },
    {
      zPosition: 9,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/mace/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/blunt/mace/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/blunt/mace/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/blunt/mace/attack_slash/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/mace/attack_slash/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/blunt/mace/attack_slash/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/blunt/mace/attack_slash/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/blunt/mace/attack_slash/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.WARAXE]: [
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/waraxe/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/blunt/waraxe/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/blunt/waraxe/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/blunt/waraxe/behind/",
      },
    },
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/waraxe/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/blunt/waraxe/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/blunt/waraxe/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/blunt/waraxe/",
      },
    },
    {
      zPosition: 8,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/blunt/waraxe/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/blunt/waraxe/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/blunt/waraxe/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/blunt/waraxe/attack_slash/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/blunt/waraxe/attack_slash/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/blunt/waraxe/attack_slash/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/blunt/waraxe/attack_slash/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/blunt/waraxe/attack_slash/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.CANE]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/cane/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/polearm/cane/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/polearm/cane/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/polearm/cane/male/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.SPEAR]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/spear/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/polearm/spear/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/polearm/spear/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/polearm/spear/foreground/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/spear/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/polearm/spear/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/polearm/spear/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/polearm/spear/background/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.SCYTHE]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/scythe/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/polearm/scythe/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/polearm/scythe/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/polearm/scythe/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/scythe/universal_behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/polearm/scythe/universal_behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/polearm/scythe/universal_behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/polearm/scythe/universal_behind/",
      },
    },
    {
      zPosition: 8,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/polearm/scythe/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/polearm/scythe/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/polearm/scythe/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/polearm/scythe/attack_slash/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/scythe/attack_slash/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/polearm/scythe/attack_slash/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/polearm/scythe/attack_slash/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/polearm/scythe/attack_slash/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.HALBERD]: [
    {
      zPosition: 8,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/halberd/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/polearm/halberd/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/polearm/halberd/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/polearm/halberd/behind/",
      },
    },
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/halberd/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/polearm/halberd/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/polearm/halberd/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/polearm/halberd/",
      },
    },
    {
      zPosition: 9,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/polearm/halberd/attack_thrust/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/polearm/halberd/attack_thrust/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/polearm/halberd/attack_thrust/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/polearm/halberd/attack_thrust/behind/",
      },
    },
    {
      zPosition: 105,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/halberd/attack_thrust/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/polearm/halberd/attack_thrust/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/polearm/halberd/attack_thrust/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/polearm/halberd/attack_thrust/",
      },
    },
    {
      zPosition: 8,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/polearm/halberd/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/polearm/halberd/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/polearm/halberd/attack_slash/behind/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/polearm/halberd/attack_slash/behind/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "slash_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/polearm/halberd/attack_slash/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/polearm/halberd/attack_slash/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/polearm/halberd/attack_slash/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/polearm/halberd/attack_slash/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.SIMPLE_STAFF]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/simple/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/magic/simple/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/simple/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/magic/simple/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/magic/simple/foreground/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/simple/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/magic/simple/background/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/simple/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/magic/simple/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/magic/simple/background/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.LOOP_STAFF]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/loop/universal/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/loop/universal/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/loop/universal/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/loop/universal/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/loop/universal/foreground/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/loop/universal/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/loop/universal/background/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/loop/universal/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/loop/universal/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/loop/universal/background/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/loop/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/magic/loop/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/loop/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/loop/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/loop/thrust/foreground/",
      },
    },
    {
      zPosition: -1,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/loop/thrust/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/magic/loop/thrust/background/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/loop/thrust/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/loop/thrust/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/loop/thrust/background/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.DIAMOND_STAFF]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/magic/diamond/universal/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/diamond/universal/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "weapon/magic/diamond/universal/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/diamond/universal/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/diamond/universal/foreground/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/magic/diamond/universal/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/diamond/universal/background/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "weapon/magic/diamond/universal/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/diamond/universal/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/diamond/universal/background/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/diamond/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/diamond/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/diamond/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/diamond/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/diamond/thrust/foreground/",
      },
    },
    {
      zPosition: -1,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/diamond/thrust/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/diamond/thrust/background/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/diamond/thrust/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/diamond/thrust/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/diamond/thrust/background/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.GNARLED_STAFF]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/magic/gnarled/universal/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/gnarled/universal/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "weapon/magic/gnarled/universal/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/gnarled/universal/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/gnarled/universal/foreground/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/magic/gnarled/universal/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/gnarled/universal/background/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "weapon/magic/gnarled/universal/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/gnarled/universal/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/gnarled/universal/background/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/gnarled/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/gnarled/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/gnarled/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/gnarled/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/gnarled/thrust/foreground/",
      },
    },
    {
      zPosition: -1,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/gnarled/thrust/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/gnarled/thrust/background/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/gnarled/thrust/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/gnarled/thrust/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/gnarled/thrust/background/",
      },
    },
  ],
  [CHARACTER_WEAPON_TYPE.S_STAFF]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/s/universal/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/magic/s/universal/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/s/universal/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/s/universal/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/s/universal/foreground/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/s/universal/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/magic/s/universal/background/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/s/universal/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/s/universal/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/s/universal/background/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/s/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/magic/s/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/s/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/magic/s/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/magic/s/thrust/foreground/",
      },
    },
    {
      zPosition: -1,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/s/thrust/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "weapon/magic/s/thrust/background/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/s/thrust/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "weapon/magic/s/thrust/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "weapon/magic/s/thrust/background/",
      },
    },
  ],
};

export const weapon_magic_crystal_variant: CharacterVariant = {
  [CHARACTER_WEAPON_MAGIC_CRYSTAL_TYPE.CRYSTAL]: [
    {
      zPosition: 140,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/magic/crystal/universal/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/crystal/universal/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "weapon/magic/crystal/universal/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/crystal/universal/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/crystal/universal/foreground/",
      },
    },
    {
      zPosition: 9,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]:
          "weapon/magic/crystal/universal/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/crystal/universal/background/",
        [CHARACTER_PERSON_TYPE.TEEN]:
          "weapon/magic/crystal/universal/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/crystal/universal/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/crystal/universal/background/",
      },
    },
    {
      zPosition: 150,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/crystal/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/crystal/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/crystal/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/crystal/thrust/foreground/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/crystal/thrust/foreground/",
      },
    },
    {
      zPosition: -1,
      customAnimation: "thrust_oversize",
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "weapon/magic/crystal/thrust/background/",
        [CHARACTER_PERSON_TYPE.FEMALE]:
          "weapon/magic/crystal/thrust/background/",
        [CHARACTER_PERSON_TYPE.TEEN]: "weapon/magic/crystal/thrust/background/",
        [CHARACTER_PERSON_TYPE.PREGNANT]:
          "weapon/magic/crystal/thrust/background/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]:
          "weapon/magic/crystal/thrust/background/",
      },
    },
  ],
};
