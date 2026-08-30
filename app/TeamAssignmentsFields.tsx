"use client";

import { teamTasks, type TeamAssignments, type TeamTaskKey } from "@/lib/team";

export default function TeamAssignmentsFields({
  value,
  onChange,
}: {
  value: TeamAssignments;
  onChange: (task: TeamTaskKey, memberName: string) => void;
}) {
  return (
    <fieldset className="team-assignments">
      <legend>Phân công nhiệm vụ</legend>
      <div className="team-assignment-grid">
        {teamTasks.map((task) => (
          <label key={task.key}>
            {task.label}
            <input
              required
              maxLength={120}
              value={value[task.key]}
              onChange={(event) => onChange(task.key, event.target.value)}
              placeholder="Tên thành viên"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
