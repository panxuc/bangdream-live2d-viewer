export const onCharacters = [
  {
    id: "001",
    name: "001 高松灯",
    pathPrefixes: ["001_adv", "001_live"],
  },
  {
    id: "002",
    name: "002 千早爱音",
    pathPrefixes: ["002_adv", "002_live"],
  },
  {
    id: "003",
    name: "003 要乐奈",
    pathPrefixes: ["003_adv", "003_live"],
  },
  {
    id: "004",
    name: "004 长崎爽世",
    pathPrefixes: ["004_adv", "004_live"],
  },
  {
    id: "005",
    name: "005 椎名立希",
    pathPrefixes: ["005_adv", "005_live"],
  },
  {
    id: "006",
    name: "006 三角初华",
    pathPrefixes: ["006_adv", "006_live"],
  },
  {
    id: "007",
    name: "007 若叶睦",
    pathPrefixes: ["007_adv", "007_live"],
  },
  {
    id: "008",
    name: "008 八幡海铃",
    pathPrefixes: ["008_adv", "008_live"],
  },
  {
    id: "009",
    name: "009 祐天寺若麦",
    pathPrefixes: ["009_adv", "009_live"],
  },
  {
    id: "010",
    name: "010 丰川祥子",
    pathPrefixes: ["010_adv", "010_live"],
  },
  // {
  //   id: "012",
  //   name: "012 宫永野乃花",
  //   pathPrefixes: ["012_adv", "012_live"],
  // },
  {
    id: "sub-mana",
    name: "sub 纯田真奈",
    pathPrefixes: ["sub_mana"],
  },
  {
    id: "sub-kiyotsugu",
    name: "sub 丰川清告",
    pathPrefixes: ["sub_kiyotsugu"],
  },
  {
    id: "sub-sadaharu",
    name: "sub 丰川定治",
    pathPrefixes: ["sub_sadaharu"],
  },
  {
    id: "sub-minami",
    name: "sub 森美奈美",
    pathPrefixes: ["sub_minami"],
  },
];

export const onCharacterById = new Map(onCharacters.map((character) => [character.id, character]));
