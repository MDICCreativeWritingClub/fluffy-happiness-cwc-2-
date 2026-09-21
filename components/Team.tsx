"use client";

import { colors } from "@/lib/theme";

import { GraduationCap, Users, UserSquare2, Palette } from "lucide-react";
import type { StaffMember } from "@/data/articles";
import { useTeamMembers } from "@/hooks/useTeamMembers";

function StaffCard({ member }: { member: StaffMember }) {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{
        backgroundColor: member.isTeacher ? colors.badgeBg : colors.surface,
        borderColor: member.isTeacher ? colors.badgeBorder : colors.gray200,
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white"
        style={{ backgroundColor: member.isTeacher ? colors.green900 : colors.gray500 }}
      >
        {member.isTeacher ? <GraduationCap size={18} /> : member.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>{member.name}</p>
          {member.isTeacher && (
            <span
              className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium"
              style={{ backgroundColor: colors.green900, color: colors.white }}
            >
              Teacher
            </span>
          )}
        </div>
        <p style={{ color: colors.green600, fontSize: "0.8rem" }}>{member.role}</p>
        {member.grade && (
          <p style={{ color: colors.gray500, fontSize: "0.75rem" }}>{member.grade}</p>
        )}
        <p className="sm:hidden mt-1" style={{ color: colors.gray400, fontSize: "0.7rem" }}>
          {member.period}
        </p>
      </div>
      <span className="hidden sm:inline-block shrink-0" style={{ color: colors.gray400, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
        {member.period}
      </span>
    </div>
  );
}

export function Team() {
  const { executives, editorialTeam, classReps, mediaTeam } = useTeamMembers();

  return (
    <div className="max-w-5xl mx-auto px-5 pt-24 pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users size={22} style={{ color: colors.green600 }} />
          <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 600, fontSize: "1.9rem" }}>Our Team</h1>
        </div>
        <p style={{ color: colors.gray500, fontSize: "0.9rem" }}>
          The people who run, guide, and shape Manarat CWC.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap size={16} style={{ color: colors.green600 }} />
            <h2 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>
              Executives
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
          </div>
          <div className="flex flex-col gap-3">
            {executives.map((m) => (
              <StaffCard key={m.id ?? m.name + m.period} member={m} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <Users size={16} style={{ color: colors.green600 }} />
            <h2 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>
              Editorial Team
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {editorialTeam.map((m) => (
              <StaffCard key={m.id ?? m.name + m.period} member={m} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <UserSquare2 size={16} style={{ color: colors.green600 }} />
            <h2 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>
              Class Representatives
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {classReps.map((m) => (
              <StaffCard key={m.id ?? m.name + m.period} member={m} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <Palette size={16} style={{ color: colors.green600 }} />
            <h2 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>
              Media Team
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {mediaTeam.map((m) => (
              <StaffCard key={m.id ?? m.name + m.period} member={m} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
