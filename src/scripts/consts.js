// I'm assuming this is safe b/c ferium does the same thing ¯\_(ツ)_/¯
// https://github.com/gorilla-devs/ferium/blob/f9bf7906fde4938255bd4e9d95a680ac5646c0b4/src/main.rs#L95
export const API_KEY = "$2a$10$3kFa9lBWciEK.lsp7NyCSupZ3XmlAYixZQ9fTczqsz1/.W9QDnLUy";
export const GAME_ID = 432;
// omitted Cauldron = 2 and LiteLoader = 3, as there are exactly 0 mods tagged as such
// see https://discord.com/channels/900128427150028811/900188519081848865/994479752410832946 (Curseforge Dev Discord)
export const MODLOADERS = [
	["Any", 0],
	["Forge", 1],
	["Fabric", 4],
	["Quilt", 5],
	["NeoForge", 6],
];
// omitted "Category", "Game Version", "Early Access"
// These 3 don't seem useful at all and I dunno what the last two do
export const SORT_FIELDS = [
	"Featured",
	"Popularity",
	"Last Updated",
	"Name",
	"Author",
	"Total Downloads",
].map((v, i) => [v, i + 1]);
export const SORT_ORDERS = ["asc", "desc"].map((v) => [v, v]);

export const DEFAULT_PARAMS = {
	classId: "6", // "Mods"
	modLoaderType: "0", // "Any"
	sortField: "6", // "Total Downloads"
	sortOrder: "desc",
	pageSize: "50",
	page: "1",
};
