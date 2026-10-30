import { homePage } from "./homePage";
import { link } from "./link";
import { partner } from "./partner";
import { post } from "./post";
import { siteSettings } from "./siteSettings";
import { teamMember } from "./teamMember";

export const schemaTypes = [homePage, siteSettings, teamMember, partner, post, link];

export const singletonTypes = new Set(["homePage", "siteSettings"]);
