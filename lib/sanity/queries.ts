export const HOME_CONTENT_QUERY = `{
  "settings": *[_id == "siteSettings"][0] {
    ...,
    "privacyPolicyFileUrl": privacyPolicyFile.asset->url,
    "termsFileUrl": termsFile.asset->url
  },
  "home": *[_id == "homePage"][0],
  "team": *[_type == "teamMember"] | order(coalesce(order, 999) asc, _createdAt asc) {
    _id,
    name,
    role,
    linkedinUrl,
    photo {
      asset,
      alt
    }
  },
  "partners": *[_type == "partner"] | order(coalesce(order, 999) asc, _createdAt asc) {
    _id,
    name,
    logo {
      asset,
      alt
    }
  }
}`;
