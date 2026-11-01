"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Building2,
  Search,
  Plus,
  ExternalLink,
  MapPin,
  Briefcase,
  Archive,
  RotateCcw,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
} from "lucide-react";

interface CompanyItem {
  id: string;
  name: string;
  description: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  companySize?: string | null;
  isArchived: boolean;
  createdAt: string;
  _count?: {
    drives: number;
  };
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    industry: "",
    location: "",
    logoUrl: "",
    companySize: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, [search, statusFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        q: search,
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/companies?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies || []);
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to fetch companies." });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (comp?: CompanyItem) => {
    if (comp) {
      setEditingCompany(comp);
      setFormData({
        name: comp.name,
        description: comp.description,
        website: comp.website || "",
        industry: comp.industry || "",
        location: comp.location || "",
        logoUrl: comp.logoUrl || "",
        companySize: comp.companySize || "",
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: "",
        description: "",
        website: "",
        industry: "",
        location: "",
        logoUrl: "",
        companySize: "",
      });
    }
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFeedback(null);

    try {
      const url = editingCompany
        ? `/api/admin/companies/${editingCompany.id}`
        : "/api/admin/companies";
      const method = editingCompany ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.error || "Failed to save company." });
        setFormLoading(false);
        return;
      }

      setIsModalOpen(false);
      setFeedback({
        type: "success",
        text: editingCompany ? "Company profile updated." : "Company record created successfully.",
      });
      fetchCompanies();
    } catch {
      setFeedback({ type: "error", text: "Network error occurred." });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleArchive = async (company: CompanyItem) => {
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: data.message });
        fetchCompanies();
      } else {
        setFeedback({ type: "error", text: data.error || "Action failed" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error while toggling archive status." });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visiting Companies"
        description="Maintain corporate profiles, contact details, and view recruitment drive histories."
        actions={
          <Button onClick={() => handleOpenModal()} variant="primary" size="md">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Company
          </Button>
        }
      />

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company, industry, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(["active", "archived", "all"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === filter
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-white p-5 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          title="No companies found"
          description={search ? "No company records match your search criteria." : "No companies added yet in this view."}
          actionLabel="Add Company"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card
              key={company.id}
              className={`flex flex-col justify-between card-interactive ${
                company.isArchived ? "opacity-75 bg-slate-50/70" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="h-10 w-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                          const fallback = (e.target as HTMLElement).parentElement?.querySelector(".logo-fallback");
                          if (fallback) fallback.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`logo-fallback flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100 shrink-0 ${
                        company.logoUrl ? "hidden" : ""
                      }`}
                    >
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 leading-tight">
                        {company.name}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        {company.industry && <span>{company.industry}</span>}
                        {company.industry && company.companySize && <span>•</span>}
                        {company.companySize && (
                          <span className="text-slate-600 font-medium">{company.companySize}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {company.isArchived && <Badge variant="neutral">Archived</Badge>}
                </div>
              </CardHeader>

              <CardContent className="py-2 space-y-3 flex-1">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {company.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  {company.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{company.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    <span>{company._count?.drives || 0} Drives</span>
                  </div>
                </div>

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                  >
                    <span>Visit website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>

              <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/admin/companies/${company.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View Details & Drives
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(company)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                    title="Edit company"
                    aria-label={`Edit ${company.name}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleArchive(company)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50"
                    title={company.isArchived ? "Restore company" : "Archive company"}
                    aria-label={company.isArchived ? "Restore company" : "Archive company"}
                  >
                    {company.isArchived ? (
                      <RotateCcw className="h-3.5 w-3.5" />
                    ) : (
                      <Archive className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingCompany ? "Edit Company Profile" : "Register Visiting Company"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4">
              <Input
                label="Company Name *"
                placeholder="e.g. Acme Cloud Solutions"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Company Overview *</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 min-h-20"
                  placeholder="Short description of the company, product portfolio, and tech domain..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Industry / Domain"
                  placeholder="e.g. Fintech, SaaS, Embedded"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />

                <Input
                  label="Headquarters / Location"
                  placeholder="e.g. Bangalore, India"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Official Website URL"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />

                <Input
                  label="Company Logo URL (Optional)"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  helperText="Direct image URL for company badge"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Company Size (Optional)</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 bg-white"
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                >
                  <option value="">Select company size...</option>
                  <option value="1-50 employees">1-50 employees (Startup)</option>
                  <option value="51-200 employees">51-200 employees (Early Stage)</option>
                  <option value="201-500 employees">201-500 employees (Mid-sized)</option>
                  <option value="501-1,000 employees">501-1,000 employees (Growth)</option>
                  <option value="1,001-5,000 employees">1,001-5,000 employees (Large Enterprise)</option>
                  <option value="5,000+ employees">5,000+ employees (Global MNC)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={formLoading}>
                  {editingCompany ? "Save Changes" : "Create Company"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
