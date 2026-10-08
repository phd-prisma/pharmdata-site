import type { HomePage, Partner } from "@/lib/sanity/types";

export function Clients({
  content,
  partners,
}: {
  content: HomePage["clients"];
  partners: Partner[];
}) {
  return (
    <section className="wrap clients">
      <span>{content.label}</span>
      <div>
        {partners.map((partner) =>
          partner.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={partner._id}
              src={partner.logoUrl}
              alt={partner.logo?.alt ?? partner.name}
              title={partner.name}
              loading="lazy"
            />
          ) : (
            <span key={partner._id}>{partner.name}</span>
          ),
        )}
      </div>
    </section>
  );
}
