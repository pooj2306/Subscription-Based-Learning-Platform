import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPlans, subscribeToPlan } from '../../api/subscriptionApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';
export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getPlans().then((res) => setPlans(res.data)).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId) => {
    setSubscribing(planId);
    setMessage('');
    try {
      await subscribeToPlan(planId);
      setMessage('Subscribed successfully! Redirecting...');
      setTimeout(() => navigate('/student'), 1200);
    } catch (err) {
      setMessage('Subscription failed. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return <DashboardLayout><p className="text-gray-400">Loading plans...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <BackLink to="/student" label="Back to Dashboard" />

      <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose a Plan</h2>
      <p className="text-gray-500 text-sm mb-8">Unlock full access to all courses.</p>

      {message && (
        <p className="mb-6 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 text-sm font-medium">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <div
            key={plan.id}
            className={`card-hover rounded-2xl p-6 flex flex-col border ${
              i === 1
                ? 'bg-gradient-to-br from-brand-600 to-accent-500 text-white border-transparent shadow-lg shadow-brand-200'
                : 'bg-white border-gray-100 shadow-sm'
            }`}
          >
            {i === 1 && (
              <span className="text-[11px] font-bold uppercase tracking-wide bg-white/20 text-white px-2.5 py-1 rounded-full w-fit mb-3">
                Most Popular
              </span>
            )}
            <h3 className={`text-lg font-bold mb-1 ${i === 1 ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
            <p className={`text-sm mb-4 ${i === 1 ? 'text-white/80' : 'text-gray-500'}`}>{plan.description}</p>
            <p className="text-3xl font-extrabold mb-1">₹{plan.price}</p>
            <p className={`text-sm mb-6 ${i === 1 ? 'text-white/70' : 'text-gray-400'}`}>{plan.duration_days} days</p>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={subscribing === plan.id}
              className={`mt-auto py-2.5 rounded-xl font-semibold transition disabled:opacity-50 ${
                i === 1
                  ? 'bg-white text-brand-700 hover:bg-gray-50'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {subscribing === plan.id ? 'Processing...' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}