import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { submitSupportTicket } from '../../api/dashboardApi';

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'How do I enroll in a course?',
    category: 'Courses',
    answer:
      'Navigate to your Dashboard or Curriculum catalogue, click on any course card to open its detail page, and select "Buy Course" for lifetime pay-per-course access or subscribe to any All-Access plan under "Subscription Plans" in the sidebar.',
  },
  {
    id: 2,
    question: 'How do I access my course lessons?',
    category: 'Lessons',
    answer:
      'Once enrolled in a course or active on a subscription, open the course from your Student Dashboard. Expand the curriculum modules to view all structured topics, then click on any lesson to watch video lectures, review notes, and study code examples.',
  },
  {
    id: 3,
    question: 'How do I track my learning progress?',
    category: 'Progress',
    answer:
      'Visit "Analytics & Readiness" in your sidebar or review your Dashboard intelligence hub. You can monitor overall completion percentages, time invested (focus vs. lecture minutes), daily study trends, and quiz accuracy.',
  },
  {
    id: 4,
    question: 'Can I resume a course where I left off?',
    category: 'Lessons',
    answer:
      'Yes! Your lesson completion status, quiz attempts, flashcard review intervals, and Pomodoro focus sessions are automatically recorded in real-time. When you log back in, you can pick up immediately.',
  },
  {
    id: 5,
    question: 'How do I reset my password?',
    category: 'Account',
    answer:
      'You can update your credentials through your account settings or submit a request to the support team with your registered student email address for identity verification and access restoration.',
  },
  {
    id: 6,
    question: 'How do I change my profile details?',
    category: 'Account',
    answer:
      'Click your avatar in the top-right header corner and select "Account Settings". From there, you can view your registered username, role, and active subscriptions.',
  },
  {
    id: 7,
    question: 'How do I switch between dark mode and light mode?',
    category: 'Platform',
    answer:
      'Click the Sun/Moon icon in the top-right header or landing page navigation. Your chosen theme switches instantly and is automatically saved to your browser preferences across all sessions.',
  },
  {
    id: 8,
    question: 'How do I download my course certificate?',
    category: 'Certificates',
    answer:
      'Certificates require completing 100% of course lessons, passing the comprehensive exam, and submitting a verified capstone project. Once unlocked, visit "Certificates" in the sidebar to download your tamper-proof PDF certificate with unique verification hash.',
  },
  {
    id: 9,
    question: 'What should I do if a course is not loading?',
    category: 'Technical',
    answer:
      'Ensure you have an active network connection and refresh the browser. If you are in Demo Mode, note that private lesson videos and quiz submissions require signing into a free or active account. If an error persists, reach out via our contact form below.',
  },
  {
    id: 10,
    question: 'How do I contact the support team?',
    category: 'Support',
    answer:
      'You can submit an inquiry directly using the "Contact Support" form on this page or email us at support@sblp.edu. Our engineering support desk responds within 24 hours with your ticket tracking number.',
  },
  {
    id: 11,
    question: 'What can I access in Demo Mode?',
    category: 'Demo',
    answer:
      'Demo Mode lets you explore all course cards, descriptions, categories, lesson counts, module outlines, and platform features without registering or entering payment details. Interactive actions like taking graded tests and claiming certificates will prompt you to create a free account.',
  },
  {
    id: 12,
    question: 'How do I register for free?',
    category: 'Account',
    answer:
      'Click the "Register for Free" button located in the top-right header, landing page hero, or demo banners. Enter a chosen username, email, and password to immediately set up your free student account.',
  },
];

export default function HelpDesk() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Search & Accordion State
  const [searchQuery, setSearchQuery] = useState('');
  const [openAccordionId, setOpenAccordionId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: user?.username || '',
    email: '',
    category: 'Course Content',
    subject: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState('');

  const toggleAccordion = (id) => {
    setOpenAccordionId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(null);

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.description.trim()) {
      setFormError('Please fill in all required fields before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitSupportTicket(form);
      setFormSuccess(res.data);
      setForm({
        name: user?.username || '',
        email: '',
        category: 'Course Content',
        subject: '',
        description: '',
      });
    } catch (err) {
      console.error('Support submission error:', err);
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Could not submit support ticket. Please verify your details or use our mail link.';
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200">
      {/* ── Help Desk Top Header ── */}
      <header className="sticky top-0 z-30 bg-[var(--bg-card)]/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={user ? (user.role === 'STUDENT' ? '/student' : '/instructor') : '/'}
              className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white transition"
            >
              <span>←</span>
              <span>{user ? 'Back to Dashboard' : 'Back to Home'}</span>
            </Link>
            <span className="text-gray-300 dark:text-slate-700">|</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>❓</span> Help & Support Center
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {user ? (
              <span className="text-xs font-bold text-gray-700 dark:text-slate-200 hidden sm:inline">
                {user.username}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-white transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 transition"
                >
                  Register for Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Help Desk Content Container ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Hero Banner */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-brand-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-3">
            <span>💡</span> Self-Service Knowledge & Assistance
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight mb-3">
            How can we help you learn?
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            Search our comprehensive knowledge base or submit a ticket directly to the platform engineering support team.
          </p>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-lg mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g., certificates, demo mode, dark mode)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--card-border)] text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── 3 Quick Support Pillar Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <a
            href="#faqs"
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--card-border)] hover:border-brand-600 dark:hover:border-indigo-400 transition shadow-xs group"
          >
            <span className="text-2xl block mb-2">📖</span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition">
              Searchable FAQs
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              12 answers covering enrollments, certificates, and demo mode.
            </p>
          </a>

          <a
            href="#contact-form"
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--card-border)] hover:border-brand-600 dark:hover:border-indigo-400 transition shadow-xs group"
          >
            <span className="text-2xl block mb-2">✉️</span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition">
              Submit Ticket
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              Direct tracking number generated with 24-hour response guarantee.
            </p>
          </a>

          <a
            href="mailto:support@sblp.edu"
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--card-border)] hover:border-brand-600 dark:hover:border-indigo-400 transition shadow-xs group"
          >
            <span className="text-2xl block mb-2">📬</span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition">
              Mail Us Directly
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              support@sblp.edu for escalated account support.
            </p>
          </a>
        </div>

        {/* ── FAQ ACCORDION SECTION ── */}
        <section id="faqs" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-950 dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Showing {filteredFaqs.length} of {FAQ_ITEMS.length} answers
              </p>
            </div>
            {searchQuery && (
              <span className="text-xs font-semibold text-brand-600 dark:text-indigo-400">
                Filtered by "{searchQuery}"
              </span>
            )}
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openAccordionId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-card)] overflow-hidden shadow-xs transition"
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-brand-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md shrink-0">
                        Q{faq.id}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        {faq.question}
                      </span>
                    </div>
                    <span
                      className={`text-gray-400 text-sm transform transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-brand-600' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed border-t border-[var(--card-border)] animate-in fade-in duration-150">
                      <p>{faq.answer}</p>
                      <span className="inline-block mt-3 text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                        Topic Category: {faq.category}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="p-8 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--card-border)]">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                  No matching questions found for "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-brand-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Reset search filter
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── CONTACT SUPPORT FORM SECTION ── */}
        <section id="contact-form" className="bg-[var(--bg-card)] rounded-3xl p-6 sm:p-10 border border-[var(--card-border)] shadow-sm">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-brand-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <span>✉️</span> Official Support Desk
            </div>
            <h2 className="text-2xl font-black text-gray-950 dark:text-white mb-2">
              Contact Support & Submit Ticket
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">
              Have a technical question, billing inquiry, or issue with a course? Send your request directly to our platform desk. You will receive an official ticket reference number.
            </p>

            {/* Success Notification */}
            {formSuccess && (
              <div className="mb-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 animate-in fade-in">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">✅</span>
                  <h4 className="text-sm font-black">
                    Ticket #{formSuccess.ticket_number} Created Successfully
                  </h4>
                </div>
                <p className="text-xs mt-1 leading-relaxed">
                  {formSuccess.message}
                </p>
              </div>
            )}

            {/* Error Notification */}
            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    required
                    placeholder="student@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
                    Issue Category *
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Course Content">Course Content & Lessons</option>
                    <option value="Billing & Subscription">Billing & Subscription</option>
                    <option value="Certificates & Exams">Certificates & Verified Exams</option>
                    <option value="Technical & Bug">Technical Issue / Bug Report</option>
                    <option value="General Inquiry">General Learning Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleFormChange}
                    required
                    placeholder="Brief summary of issue"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleFormChange}
                  required
                  placeholder="Please describe what happened, relevant course names, or error messages..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting Request...' : 'Submit Request ➔'}
                </button>

                <p className="text-[11px] text-gray-400 dark:text-slate-400">
                  Or direct email: <a href="mailto:support@sblp.edu" className="text-brand-600 dark:text-indigo-400 underline">support@sblp.edu</a>
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
