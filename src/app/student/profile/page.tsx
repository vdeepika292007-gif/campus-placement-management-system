"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  X,
  Info,
} from "lucide-react";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Data Science & AI",
];

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [graduationYear, setGraduationYear] = useState(2026);
  const [cgpa, setCgpa] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeReference, setResumeReference] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const [completeness, setCompleteness] = useState({ percentage: 0, missingFields: [] as string[] });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/profile");
      const data = await res.json();

      if (data.success && data.user) {
        setUserName(data.user.name || "");
        setUserEmail(data.user.email || "");

        const profile = data.user.profile || {};
        if (profile.department) setDepartment(profile.department);
        if (profile.graduationYear) setGraduationYear(profile.graduationYear);
        if (profile.cgpa !== null && profile.cgpa !== undefined) setCgpa(String(profile.cgpa));
        if (profile.studentNumber) setStudentNumber(profile.studentNumber);
        if (profile.phone) setPhone(profile.phone);
        if (profile.resumeReference) setResumeReference(profile.resumeReference);
        if (Array.isArray(profile.skills)) setSkills(profile.skills);

        if (data.user.completeness) {
          setCompleteness(data.user.completeness);
        }
      }
    } catch {
      setStatusMessage({ type: "error", text: "Failed to load profile details." });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department,
          graduationYear: Number(graduationYear),
          cgpa: cgpa ? parseFloat(cgpa) : null,
          skills,
          phone: phone || null,
          studentNumber: studentNumber || null,
          resumeReference: resumeReference || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusMessage({ type: "error", text: data.error || "Failed to update profile." });
      } else {
        setStatusMessage({ type: "success", text: "Profile updated successfully! Placement drive eligibility will reflect these values." });
        if (data.completeness) {
          setCompleteness(data.completeness);
        }
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error while saving profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Academic Profile" description="Loading profile data..." />
        <div className="rounded-xl bg-white p-8 border border-slate-200 animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Student Profile"
        description="Maintain your verified academic details, skills, and portfolio reference for recruitment drive matching."
      />

      {/* Profile Completeness Card */}
      <Card className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border-blue-200/80">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Profile Completeness: {completeness.percentage}%
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                A completed profile enables the system to evaluate drive criteria (branch, graduation year, CGPA) automatically.
                <span className="font-semibold text-slate-700"> Note: Profile completion does not guarantee job placement or interview selection.</span>
              </p>
            </div>

            <div className="w-full sm:w-44">
              <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {completeness.missingFields.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Incomplete fields:</span>
              {completeness.missingFields.map((field) => (
                <span key={field} className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 font-medium">
                  {field}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <CardTitle>Basic Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={userName} disabled helperText="Contact placement cell to correct registered name" />
              <Input label="Email Address" value={userEmail} disabled helperText="Institutional email cannot be modified" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Student ID / Roll Number"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="e.g. CS22B1042"
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic Details Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <CardTitle>Academic Records</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Select
                  label="Department / Engineering Branch *"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Select>
              </div>

              <Select
                label="Graduation Batch *"
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                required
              >
                {[2024, 2025, 2026, 2027, 2028].map((year) => (
                  <option key={year} value={year}>
                    Class of {year}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Input
                  label="Current CGPA (Scale of 10.0)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 8.75"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  helperText="Leave blank if first-semester or pending official grade card"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  CGPA is cross-referenced with minimum requirements stated by companies during placement drive applications.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Skills Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <CardTitle>Technical Competencies & Skills</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a skill (e.g. React, Python, Docker) and press Enter"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleAddSkill}
              />
              <Button type="button" variant="secondary" onClick={handleAddSkill}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 min-h-12 items-center">
              {skills.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No skills added yet. Add relevant programming languages, tools, or frameworks.</p>
              ) : (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-blue-500 hover:text-blue-800 rounded-full hover:bg-blue-100 p-0.5"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resume & Portfolio Reference */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />
              <CardTitle>Resume & Portfolio Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Resume / Portfolio Cloud URL (Optional)"
              type="url"
              placeholder="https://drive.google.com/... or https://github.com/..."
              value={resumeReference}
              onChange={(e) => setResumeReference(e.target.value)}
              helperText="Provide a viewable link to your resume or portfolio. Uploading files directly will be enabled in a future release."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" isLoading={saving} className="font-semibold px-8">
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
