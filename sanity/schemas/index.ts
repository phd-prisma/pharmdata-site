import { homePage } from "./homePage";
import { link } from "./link";
import { partner } from "./partner";
import { siteSettings } from "./siteSettings";
import { teamMember } from "./teamMember";

export const schemaTypes = [homePage, siteSettings, teamMember, partner, link];

export const singletonTypes = new Set(["homePage", "siteSettings"]);
