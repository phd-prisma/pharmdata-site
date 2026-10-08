import { createImageUrlBuilder } from "@sanity/image-url";
import { sanityClient } from "./client";
import type { SanityImage } from "./types";

const builder = sanityClient ? createImageUrlBuilder(sanityClient) : null;

export function urlForImage(source?: SanityImage): string | undefined {
  if (!builder || !source?.asset) return undefined;
  return builder.image(source).width(240).height(240).fit("crop").url();
}

export function urlForOgImage(source?: SanityImage): string | undefined {
  if (!builder || !source?.asset) return undefined;
  return builder.image(source).width(1200).height(630).fit("crop").url();
}

export function urlForLogo(source?: SanityImage): string | undefined {
  if (!builder || !source?.asset) return undefined;
  return builder.image(source).height(150).fit("max").url();
}
