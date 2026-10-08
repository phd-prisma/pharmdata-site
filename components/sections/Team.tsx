import type { HomePage, TeamMember } from "@/lib/sanity/types";

export function Team({
  content,
  members,
}: {
  content: HomePage["team"];
  members: TeamMember[];
}) {
  return (
    <section id="equipe" className="team-sec">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <div className="eyebrow">{content.eyebrow}</div>
            <h2 className="h2">{content.title}</h2>
          </div>
          <p className="lead">{content.lead}</p>
        </div>
        <div className="team">
          {members.map((member) => (
            <div key={member._id} className="person">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.photoUrl}
                alt={member.photo?.alt ?? member.name}
                loading="lazy"
              />
              <a href={member.linkedinUrl} target="_blank" rel="noopener">
                <span className="name">{member.name}</span>
                <span className="role">{member.role}</span>
                <span className="li">LinkedIn ↗</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
