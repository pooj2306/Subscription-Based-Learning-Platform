import { useEffect, useState } from 'react';
import { getMyCertificates } from '../../api/certificateApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';
export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCertificates().then((res) => setCertificates(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><p className="text-gray-400">Loading certificates...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">My Certificates</h2>
      <p className="text-gray-500 text-sm mb-8">Your earned course completion certificates.</p>
      <BackLink to="/student" label="Back to Dashboard" />
      {certificates.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center max-w-lg">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-gray-400">You haven't earned any certificates yet. Complete a course to unlock one.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {certificates.map((cert) => (
          <div key={cert.id} className="card-hover bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-bold text-gray-900 mb-1">{cert.course_title}</h3>
            <p className="text-xs text-gray-400 mb-4">Certificate No: {cert.certificate_number}</p>
            
              href={cert.pdf_file}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 transition"
            <a>
              Download PDF
            </a>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}