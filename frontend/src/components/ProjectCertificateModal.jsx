import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getCourseCertStatus,
  submitCourseMiniProject,
  requestCertificate,
} from '../api/certificateApi';

export default function ProjectCertificateModal({ courseId, isOpen, onClose, onCertificateClaimed }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Project Submission Form
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [form, setForm] = useState({
    github_repo_url: '',
    live_demo_url: '',
    description: '',
  });
  const [submittingProject, setSubmittingProject] = useState(false);

  useEffect(() => {
    if (isOpen && courseId) {
      loadStatus();
    }
  }, [isOpen, courseId]);

  const loadStatus = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getCourseCertStatus(courseId);
      setData(res.data);
      if (res.data.submission_details) {
        setForm({
          github_repo_url: res.data.submission_details.github_repo_url || '',
          live_demo_url: res.data.submission_details.live_demo_url || '',
          description: res.data.submission_details.description || '',
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to check certificate qualification status.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!form.github_repo_url.trim()) {
      alert('GitHub repository URL is required.');
      return;
    }
    setSubmittingProject(true);
    setErrorMsg('');
    try {
      await submitCourseMiniProject(courseId, form);
      setShowSubmitForm(false);
      await loadStatus();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit capstone mini-project.');
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleClaimCertificate = async () => {
    setClaiming(true);
    setErrorMsg('');
    try {
      const res = await requestCertificate(courseId);
      setClaimSuccess(res.data);
      if (onCertificateClaimed) {
        onCertificateClaimed(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to claim certificate.');
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  const reqs = data?.requirements || {};
  const lessons = reqs.lessons || {};
  const quiz = reqs.quiz || {};
  const project = reqs.project || {};
  const canClaim = data?.can_claim;
  const projectDetails = data?.project_details;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-card-border dark:border-slate-800 overflow-hidden my-8 transform transition-all">
        {/* Header with animated gold banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 relative overflow-hidden border-b border-slate-800">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-400/30">
                <span className="animate-spin text-sm">✦</span> Verified Project-Based Credential
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {data?.course_title || 'Course Certificate'}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                To guarantee credential authenticity, certificates require completing lectures, passing the comprehensive exam, and submitting a verified mini-project.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Verifying academic requirements...</p>
            </div>
          ) : claimSuccess ? (
            /* Celebration Screen when Certificate Claimed */
            <div className="text-center py-6 animate-scaleUp">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-4xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-float">
                🎓
              </div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                Congratulations, Graduate! 🎉
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                Your verified project certificate has been generated and sealed.
              </p>

              {/* Certificate Snapshot Card */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 text-left border border-amber-400/40 shadow-xl mb-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Certificate Verification #{claimSuccess.certificate_number}
                  </span>
                  <span className="text-xs font-black text-emerald-400">✓ Project Verified</span>
                </div>
                <h5 className="text-lg font-black text-white mb-1">{claimSuccess.course_title}</h5>
                <p className="text-xs text-slate-300 mb-4">
                  Awarded to <span className="font-bold text-white">{claimSuccess.student_name}</span>
                </p>

                <div className="bg-white/5 rounded-xl p-3 text-xs space-y-1">
                  <p className="text-slate-300">
                    <span className="text-slate-400 font-semibold">Capstone Project:</span>{' '}
                    <span className="font-bold text-amber-300">{claimSuccess.verified_project_title || 'Verified Implementation'}</span>
                  </p>
                  <p className="text-slate-300">
                    <span className="text-slate-400 font-semibold">Exam Score:</span>{' '}
                    <span className="font-bold text-emerald-400">{claimSuccess.quiz_score}%</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {claimSuccess.pdf_url && (
                  <a
                    href={claimSuccess.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <span>📥</span> Download Official PDF Certificate
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="px-5 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* ── 3-Pillar Verification Checklist ── */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black uppercase text-gray-500 dark:text-slate-400 tracking-wider">
                  Verification Requirements (3 of 3 Required)
                </h4>

                {/* Pillar 1: Lessons */}
                <div className={`p-4 rounded-2xl border transition ${
                  lessons.completed ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        lessons.completed ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {lessons.completed ? '✓' : '1'}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-900 dark:text-white">
                          Complete Course Lessons & Modules
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          {lessons.completed ? 'All lectures completed' : `${lessons.progress_percent || 0}% completed`}
                        </p>
                      </div>
                    </div>
                    {!lessons.completed && (
                      <Link
                        to={`/student/courses/${courseId}`}
                        onClick={onClose}
                        className="text-xs font-bold text-brand-600 dark:text-indigo-400 hover:underline"
                      >
                        Resume ➔
                      </Link>
                    )}
                  </div>
                </div>

                {/* Pillar 2: Quiz Assessment */}
                <div className={`p-4 rounded-2xl border transition ${
                  quiz.passed ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        quiz.passed ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {quiz.passed ? '✓' : '2'}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-900 dark:text-white">
                          Pass Assessment Exam (≥60%)
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          {quiz.passed ? `Passed with score: ${quiz.score}%` : 'Take and pass the capstone quiz'}
                        </p>
                      </div>
                    </div>
                    {!quiz.passed && quiz.quiz_id && (
                      <Link
                        to={`/student/quizzes/${quiz.quiz_id}`}
                        onClick={onClose}
                        className="text-xs font-bold text-brand-600 dark:text-indigo-400 hover:underline"
                      >
                        Take Quiz ➔
                      </Link>
                    )}
                  </div>
                </div>

                {/* Pillar 3: Capstone Mini-Project */}
                <div className={`p-4 rounded-2xl border transition ${
                  project.submitted ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        project.submitted ? 'bg-emerald-600 text-white' : 'bg-brand-600 text-white animate-pulse'
                      }`}>
                        {project.submitted ? '✓' : '3'}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-900 dark:text-white">
                          Submit Capstone Mini-Project
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          {project.submitted
                            ? `Status: ${project.status} (${project.project_title})`
                            : projectDetails?.title || 'Mini-Project submission'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSubmitForm(!showSubmitForm)}
                      className="text-xs font-bold text-brand-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {project.submitted ? 'Edit Submission ✎' : 'Submit Code 🚀'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Mini-Project Briefing & Submission Form ── */}
              {showSubmitForm && projectDetails && (
                <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 animate-fadeIn space-y-4">
                  <div>
                    <h5 className="font-black text-sm text-gray-900 dark:text-white mb-1">
                      📁 Project Brief: {projectDetails.title}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-2">
                      {projectDetails.description}
                    </p>
                    {projectDetails.instructions && (
                      <div className="text-[11px] text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-line mb-3">
                        {projectDetails.instructions}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmitProject} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-slate-200 block mb-1">
                        GitHub Repository URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={form.github_repo_url}
                        onChange={(e) => setForm({ ...form, github_repo_url: e.target.value })}
                        placeholder="https://github.com/your-username/my-capstone-project"
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-slate-200 block mb-1">
                        Live Demo URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={form.live_demo_url}
                        onChange={(e) => setForm({ ...form, live_demo_url: e.target.value })}
                        placeholder="https://my-demo-app.vercel.app"
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-slate-200 block mb-1">
                        Architectural Overview & Implementation Notes *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe key data structures, API endpoints, design decisions, and how to execute your tests..."
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-600"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSubmitForm(false)}
                        className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white px-3 py-2 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingProject}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        {submittingProject ? 'Verifying...' : 'Submit & Verify 🚀'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Claim Certificate Action Button ── */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {canClaim ? (
                    <span className="font-extrabold text-brand-600 dark:text-indigo-400 flex items-center gap-1.5 animate-pulse">
                      🌟 All 3 Pillars Satisfied! Ready to Issue.
                    </span>
                  ) : (
                    <span>Complete all 3 requirements above to claim certificate.</span>
                  )}
                </div>

                <button
                  onClick={handleClaimCertificate}
                  disabled={!canClaim || claiming}
                  className={`px-6 py-3 rounded-2xl font-black text-xs md:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                    canClaim
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-amber-500/30 animate-pulseGlow'
                      : 'bg-slate-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>🏆</span>
                  <span>{claiming ? 'Generating Credential...' : 'Claim Verified Certificate'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
