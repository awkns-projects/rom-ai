import { CHARACTER_STYLE, CharacterVariant } from "../../definitions";
import { CHARACTER_PERSON_TYPE } from "../../person/definitions";

import { CHARACTER_HEAD_TYPE } from "./types";

export const head_variant: CharacterVariant = {
  [CHARACTER_HEAD_TYPE.HUMAN_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/human/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.BOAR_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/boarman/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.PIG_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/pig/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.SHEEP_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/sheep/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.MINOTAUR_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/minotaur/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.WOLF_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/wolf/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.RABBIT_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/rabbit/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.RAT_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/rat/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.MOUSE_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/mouse/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.LIZARD_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/lizard/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.ORC_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/orc/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.GOBLIN_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/goblin/child/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.TROLL_CHILD]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.CHILD]: "head/heads/troll/child/",
      },
    },
  ],

  [CHARACTER_HEAD_TYPE.HUMAN_FEMALE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/human/female/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/human/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/human/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/human/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/human/female/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.HUMAN_FEMALE_ELDERLY]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/human/female_elderly/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/human/female_elderly/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/human/female_elderly/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/human/female_elderly/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/human/female_elderly/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.HUMAN_MALE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/human/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/human/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/human/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/human/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/human/male/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.HUMAN_MALE_ELDERLY]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/human/male_elderly/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/human/male_elderly/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/human/male_elderly/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/human/male_elderly/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/human/male_elderly/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.HUMAN_MALE_PLUMP]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/human/male_plump/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/human/male_plump/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/human/male_plump/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/human/male_plump/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/human/male_plump/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.HUMAN_MALE_GAUNT]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/human/male_gaunt/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/human/male_gaunt/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/human/male_gaunt/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/human/male_gaunt/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/human/male_gaunt/",
      },
    },
  ],

  [CHARACTER_HEAD_TYPE.BOAR]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/boarman/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/boarman/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/boarman/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/boarman/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/boarman/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.PIG]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/pig/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/pig/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/pig/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/pig/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/pig/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.SHEEP]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/sheep/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/sheep/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/sheep/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/sheep/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/sheep/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.MINOTAUR]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/minotaur/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/minotaur/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/minotaur/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/minotaur/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/minotaur/male/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.MINOTAUR_FEMALE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/minotaur/female/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/minotaur/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/minotaur/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/minotaur/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/minotaur/female/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.WARTOTAUR]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/wartotaur/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/wartotaur/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/wartotaur/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/wartotaur/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/wartotaur/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.WOLF_FEMALE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/wolf/female/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/wolf/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/wolf/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/wolf/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/wolf/female/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.WOLF_MALE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/wolf/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/wolf/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/wolf/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/wolf/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/wolf/male/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.RABBIT]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/rabbit/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/rabbit/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/rabbit/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/rabbit/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/rabbit/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.RAT]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/rat/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/rat/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/rat/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/rat/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/rat/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.MOUSE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/mouse/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/mouse/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/mouse/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/mouse/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/mouse/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.LIZARD_FEMALE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/lizard/female/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/lizard/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/lizard/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/lizard/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/lizard/female/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.LIZARD_MALE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/lizard/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/lizard/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/lizard/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/lizard/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/lizard/male/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.ORC_FEMALE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/orc/female/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/orc/female/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/orc/female/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/orc/female/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/orc/female/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.ORC_MALE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/orc/male/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/orc/male/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/orc/male/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/orc/male/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/orc/male/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.GOBLIN]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/goblin/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/goblin/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/goblin/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/goblin/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/goblin/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.ALIEN]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/alien/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/alien/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/alien/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/alien/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/alien/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.TROLL]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/troll/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/troll/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/troll/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/troll/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/troll/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.SKELETON]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/skeleton/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/skeleton/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/skeleton/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/skeleton/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/skeleton/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.ZOMBIE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/zombie/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/zombie/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/zombie/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/zombie/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/zombie/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.JACK_O_LANTERN]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/jack/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/jack/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/jack/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/jack/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/jack/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.VAMPIRE]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/vampire/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/vampire/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/vampire/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/vampire/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/vampire/adult/",
      },
    },
  ],
  [CHARACTER_HEAD_TYPE.FRANKENSTEIN]: [
    {
      zPosition: 100,
      source: {
        [CHARACTER_PERSON_TYPE.MALE]: "head/heads/frankenstein/adult/",
        [CHARACTER_PERSON_TYPE.FEMALE]: "head/heads/frankenstein/adult/",
        [CHARACTER_PERSON_TYPE.TEEN]: "head/heads/frankenstein/adult/",
        [CHARACTER_PERSON_TYPE.PREGNANT]: "head/heads/frankenstein/adult/",
        [CHARACTER_PERSON_TYPE.MUSCULAR]: "head/heads/frankenstein/adult/",
      },
    },
  ],
};
