'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompanyLogo } from "@/components/CompanyLogo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  bgUrl?: string | null;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  phone?: string | null;
  address?: string | null;
  district?: string | null;
  province?: string | null;
  isVerified?: boolean;
}

interface CompanyJob {
  id: string;
  title: string;
  jobType?: string;
  locationProvince?: string | null;
  locationDistrict?: string | null;
  companyAddress?: string | null;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  salaryVisible?: boolean;
}

const similarCompanies = [
  { abbr: "TC", name: "TechCorp" },
  { abbr: "AB", name: "AutoBlue" },
  { abbr: "EV", name: "EV Masters" },
  { abbr: "GR", name: "GearRun" },
];

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#22c55e" stroke="none">
    <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm4.95-1.5L9.41 13.06l-2.36-2.36-1.41 1.41 3.77 3.77 9-9L16.95.5z" />
    <circle cx="12" cy="12" r="10" fill="#22c55e" />
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

function salaryText(job: CompanyJob) {
  if (job.salaryVisible === false || (!job.salaryMin && !job.salaryMax)) return "ตามโครงสร้างบริษัท";

  const min = job.salaryMin ? Number(job.salaryMin).toLocaleString() : null;
  const max = job.salaryMax ? Number(job.salaryMax).toLocaleString() : null;

  if (min && max) return `${min} – ${max} ฿`;
  if (min) return `${min}+ ฿`;
  return `ถึง ${max} ฿`;
}

function locationText(job: CompanyJob) {
  if (job.companyAddress) return job.companyAddress;

  const province = job.locationProvince || "";
  const district = job.locationDistrict || "";

  if (!province && !district) return "ไม่ระบุสถานที่";

  return `${province}${district ? ` ${district}` : ""}`;
}

// Removed unused companyAbbr function

export default function CompanyProfile() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "hondy";

  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyJobs, setCompanyJobs] = useState<CompanyJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        setLoading(true);

        const [companyRes, jobsRes] = await Promise.all([
          fetch(`${API_URL}/companies/${slug}`),
          fetch(`${API_URL}/companies/${slug}/jobs`),
        ]);

        const companyData = await companyRes.json();
        const jobsData = await jobsRes.json();

        if (companyRes.ok) {
          setCompany(companyData);
        }

        if (jobsRes.ok && Array.isArray(jobsData)) {
          setCompanyJobs(jobsData);
        } else {
          setCompanyJobs([]);
        }
      } catch (error) {
        console.error(error);
        setCompany(null);
        setCompanyJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
  }, [slug]);

  const handleApply = (id: string) => {
    setAppliedJobs((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#f5f6f8", minHeight: "100vh", color: "#1a1a2e" }}>
      <Navbar />
      {/* Back */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "16px 20px 0" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#555", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back
        </a>
      </div>

      {/* Hero Banner */}
      <div style={{ maxWidth: 1060, margin: "12px auto 0", padding: "0 20px" }}>
        <div className="hero-banner" style={{
  borderRadius: 16,
  overflow: "hidden",
  position: "relative",
  minHeight: 200,
  background: company?.bgUrl
    ? `linear-gradient(rgba(26,42,58,0.45), rgba(26,42,58,0.45)), url(${company.bgUrl}) center/cover no-repeat`
    : "linear-gradient(135deg, #1a2a3a 0%, #2c4a5c 40%, #1e3a4a 100%)"
}}>
          {/* Car silhouette decoration */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 70% 50%, rgba(30,80,110,0.5) 0%, transparent 70%)",
            opacity: 0.8
          }} />
          <div style={{
            position: "absolute",
            bottom: 0, right: 0,
            width: "55%",
            height: "100%",
            background: "linear-gradient(135deg, transparent 30%, rgba(20,50,70,0.6) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 40,
            fontSize: 80,
            opacity: 0.15,
            userSelect: "none"
          }}></div>

          {/* Company Info Overlay */}
          <div style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            display: "flex",
            alignItems: "center",
            gap: 14
          }}>
            <div style={{
  background: "#fff",
  borderRadius: 10,
  width: 56,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: 15,
  color: "#1a1a2e",
  letterSpacing: "-0.5px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  overflow: "hidden"
}}>
  {company ? (
    <CompanyLogo company={company} size="lg" className="w-full h-full border-none rounded-none" />
  ) : (
    "-"
  )}
</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                {loading ? "กำลังโหลด..." : company?.name || "ไม่พบข้อมูลบริษัท"}
              </h1>
              {company?.isVerified && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                  <CheckCircleIcon />
                  <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>Verified Employer</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-grid" style={{ maxWidth: 1060, margin: "24px auto", padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* About */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#1a1a2e", letterSpacing: "-0.3px" }}>About the Company</h2>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: "#4a5568" }}>
              {company?.description || "ยังไม่มีรายละเอียดบริษัท"}
            </p>
          </div>

          {/* Open Positions */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a2e", letterSpacing: "-0.3px" }}>
                Open Positions{" "}
                <span style={{ color: "#e63946", fontWeight: 700 }}>({companyJobs.length})</span>
              </h2>
              <button style={{
                background: "none",
                border: "1px solid #e8eaed",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "#666",
                fontSize: 13
              }}>
                <FilterIcon />
                Filter
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {companyJobs.map((job, i) => (
                <div key={job.id} style={{
                  border: "1px solid #e8eaed",
                  borderRadius: 12,
                  padding: "18px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                  animation: `fadeInUp 0.3s ease ${i * 0.05}s both`
                }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(230,57,70,0.1)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#f9c0c4";
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#e8eaed";
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 8 }}>{job.title}</div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#666", fontSize: 13 }}>
                        <LocationIcon />{locationText(job)}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#666", fontSize: 13 }}>
                        <ClockIcon />{job.jobType || "-"}
                      </span>
                      <span style={{
                        background: "#fef3f4",
                        color: "#e63946",
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: 6,
                        padding: "3px 9px"
                      }}>{salaryText(job)}</span>
                    </div>
                  </div>
                  <button
                    className="apply-btn"
                    onClick={() => handleApply(job.id)}
                    style={{
                      background: appliedJobs.includes(job.id) ? "#22c55e" : "#1a1a2e",
                      color: "#fff",
                      border: "none",
                      borderRadius: 9,
                      padding: "10px 20px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "background 0.2s, transform 0.1s",
                      marginLeft: 20,
                    }}
                    onMouseOver={e => {
                      if (!appliedJobs.includes(job.id)) (e.currentTarget as HTMLButtonElement).style.background = "#e63946";
                    }}
                    onMouseOut={e => {
                      if (!appliedJobs.includes(job.id)) (e.currentTarget as HTMLButtonElement).style.background = "#1a1a2e";
                    }}
                  >
                    {appliedJobs.includes(job.id) ? "✓ Applied" : "Apply Now"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="sidebar-column" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Company at a Glance */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>Company at a Glance</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: <UsersIcon />, label: "COMPANY SIZE", value: company?.size || "-" },
                { icon: <BriefcaseIcon />, label: "INDUSTRY", value: company?.industry || "-" },
                {
                  icon: <BuildingIcon />,
                  label: "HQ",
                  value:
                    company?.province || company?.district
                      ? `${company?.district ? `${company.district}, ` : ""}${company?.province || ""}`
                      : "-",
                },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ color: "#9ca3af", marginTop: 1 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div style={{ background: "#1a1a2e", borderRadius: 14, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: "#fff" }}>Contact Information</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ color: "#60a5fa" }}><PhoneIcon /></div>
                <span style={{ color: "#e2e8f0", fontSize: 13.5 }}>{company?.phone || "-"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ color: "#60a5fa" }}><GlobeIcon /></div>
                <a href={company?.website || "#"} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", fontSize: 13.5, textDecoration: "none" }}>
                  {company?.website || "-"}
                </a>
              </div>
            </div>
            <button style={{
              width: "100%",
              marginTop: 18,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: 10,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.2s"
            }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
              onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            >
              <MailIcon />
              Message Recruiter
            </button>
          </div>

          {/* Similar Companies */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>Similar Companies</h3>
            <div className="similar-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {similarCompanies.map((co) => (
                <a key={co.abbr} href="#" style={{ textDecoration: "none" }}>
                  <div style={{
                    border: "1px solid #e8eaed",
                    borderRadius: 10,
                    padding: "12px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s"
                  }}
                    onMouseOver={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#e63946";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(230,57,70,0.12)";
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#e8eaed";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      background: "#f5f6f8",
                      borderRadius: 8,
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px",
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#1a1a2e"
                    }}>{co.abbr}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}>{co.name}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
  .main-grid {
    grid-template-columns: 1fr !important;
    padding: 0 14px !important;
    gap: 16px !important;
  }

  .similar-grid {
    grid-template-columns: 1fr !important;
  }

  nav {
    padding: 0 16px !important;
  }
}
      `}</style>
    </div>
  );
}