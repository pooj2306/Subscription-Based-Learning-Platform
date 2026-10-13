import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyCertificates } from '../../api/certificateApi';
import { getCourses } from '../../api/courseApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';
import ProjectCertificateModal from '../../components/ProjectCertificateModal';

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalCourseId, setModalCourseId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [certRes, coursesRes] = await Promise.all([
        getMyCertificates(),
        getCourses().catch(() => ({ data: [] })),
      ]);
      setCertificates(certRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCertModal = (cId) => {
    setModalCourseId(cId);
    setIsModalOpen(true);
  };

  const handleClaimSuccess = () => {
    loadData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 font-medium text-sm">Verifying credential vault...</p>
        </div>
      </DashboardLayout>
    );
  }

  const certifiedCourseTitles = new Set(certificates.map((c) => c.course_title));
  const uncertifiedCourses = courses.filter((c) => !certifiedCourseTitles.has(c.title));

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-16">
        <BackLink to="/student" label="Back to Dashboard" />

        {/* ── Hero Banner ── */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-7 md:p-8 shadow-xl mb-10 relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-3 border border-indigo-400/30">
                <span className="text-sm">🛡️</span> Project-Based Certification
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                Verified Academic & Portfolio Credentials
              </h2>
              <p className="text-indigo-200/90 text-xs md:text-sm max-w-xl leading-relaxed">
                Unlike simple completion badges, our certificates are backed by verified capstone code repositories and rigorous quiz examinations, demonstrating authentic mastery.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 shrink-0 text-center md:w-56">
              <span className="text-3xl block mb-1">🎓</span>
              <p className="text-2xl font-black text-white">{certificates.length}</p>
              <p className="text-[10px] uppercase font-bold text-indigo-200">Earned Credentials</p>
            </div>
          </div>
        </div>

        {/* ── Section 1: Earned Certificates ── */}
        <div className="mb-12">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🏆</span> My Earned Certificates ({certificates.length})
          </h3>

          {certificates.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-card-border dark:border-slate-800 p-10 text-center">
              <span className="text-4xl block mb-2">📜</span>
              <h4 className="font-bold text-gray-800 dark:text-white text-base mb-1">No Certificates Earned Yet</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                Finish all lectures, pass the assessment quiz, and submit your capstone mini-project on any course below to unlock your verified credential.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="card-hover bg-white dark:bg-slate-900 rounded-3xl border border-card-border dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between relative overflow-hidden group"
                >
                  {/* Decorative Gold Header Bar */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-brand-500 to-amber-300" />

                  <div>
                    {/* Header: Verified Seal & Cert ID */}
                    <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                      <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        #{cert.certificate_number}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-amber-500">✦</span> Verified
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-gray-900 dark:text-white mb-1 group-hover:text-brand-500 transition">
                      {cert.course_title}
                    </h4>

                    {/* Capstone Proof Box */}
                    <div className="bg-gray-50/70 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl p-3.5 my-3 text-xs space-y-1">
                      <p className="text-gray-700 dark:text-slate-300">
                        <span className="text-gray-500 dark:text-slate-400 font-semibold">Capstone Project:</span>{' '}
                        <span className="font-bold text-gray-900 dark:text-white">{cert.verified_project_title || 'Verified Implementation'}</span>
                      </p>
                      {cert.quiz_score > 0 && (
                        <p className="text-gray-700 dark:text-slate-300">
                          <span className="text-gray-500 dark:text-slate-400 font-semibold">Assessment Score:</span>{' '}
                          <span className="font-bold text-brand-600 dark:text-indigo-400">{cert.quiz_score}%</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-slate-400 text-[11px]">
                      Issued {new Date(cert.issued_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    {cert.pdf_url && (
                      <a
                        href={cert.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer text-xs"
                      >
                        <span>📥</span> Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2: In-Progress Courses & Certificate Claim Status ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>🚀</span> Ready to Certify? Active Courses
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Submit capstone mini-projects and verify requirements to claim certificates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uncertifiedCourses.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-card-border dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-brand-500 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      {c.level}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{c.stream}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-2">
                    {c.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {c.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                    <span>📖 3 Pillars required</span>
                  </div>
                  <button
                    onClick={() => openCertModal(c.id)}
                    className="px-4 py-2 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 text-brand-700 dark:text-indigo-300 border border-brand-200 dark:border-brand-800 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Check Requirements & Submit ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Project Certificate Modal ── */}
      <ProjectCertificateModal
        courseId={modalCourseId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCertificateClaimed={handleClaimSuccess}
      />
    </DashboardLayout>
  );
}