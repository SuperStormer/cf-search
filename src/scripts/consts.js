// I'm assuming this is safe b/c ferium does the same thing ¯\_(ツ)_/¯
// https://github.com/gorilla-devs/ferium/blob/f9bf7906fde4938255bd4e9d95a680ac5646c0b4/src/main.rs#L95
export const API_KEY = "$2a$10$3kFa9lBWciEK.lsp7NyCSupZ3XmlAYixZQ9fTczqsz1/.W9QDnLUy";
export const GAME_ID = 432;
export const MODLOADERS = [["Any", 0], ["Forge", 1], ["Fabric", 4], ["Quilt", 5], ["NeoForge", 6]];
export const SORT_FIELDS = [
	"Featured",
	"Popularity",
	"Last Updated",
	"Name",
	"Author",
	"Total Downloads",
	"Category",
	"Game Version",
].map((v, i) => [v, i + 1]);
export const SORT_ORDERS = ["asc", "desc"].map((v) => [v, v]);
