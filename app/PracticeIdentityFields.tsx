"use client";

import { classNames, formatStudentNumber, refractionQuizClassNames, studentNumbers } from "@/lib/classes";
import type { PracticeKey } from "@/lib/practice-attempt-types";

export default function PracticeIdentityFields({ practiceKey, className, studentNumber, onClassChange, onStudentNumberChange }: {
  practiceKey: PracticeKey;
  className: string;
  studentNumber: string;
  onClassChange: (value: string) => void;
  onStudentNumberChange: (value: string) => void;
}) {
  const availableClasses = practiceKey === "refraction-application" ? [...refractionQuizClassNames] : classNames;
  return (
    <div className="quiz-student-row practice-student-row">
      <label>Lớp<select required value={className} onChange={(event) => onClassChange(event.target.value)}><option value="">Chọn lớp</option>{availableClasses.map((name) => <option key={name}>{name}</option>)}</select></label>
      <label>STT (01–33)<select required value={studentNumber} onChange={(event) => onStudentNumberChange(event.target.value)}><option value="">Chọn STT</option>{studentNumbers.map((number) => <option key={number} value={number}>{formatStudentNumber(number)}</option>)}</select></label>
    </div>
  );
}
