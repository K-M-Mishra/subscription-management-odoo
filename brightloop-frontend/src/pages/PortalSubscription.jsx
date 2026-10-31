import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Head, Stepper, Empty, Badge } from '../ui';
import { money, formatDate } from '../data';
import { getPortalSubscription, changeSubscriptionStatus } from '../api';

const STATUS_STEPS = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

export default function PortalSubscription() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [actionType, setActionType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPortalSubscription(id);
      setSubscription(data?.data || data);
    } catch (err) {
      setError('We could not find this subscription. It may have been removed or you might not have access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const handleAction = async () => {
    setIsSubmitting(true);
    
    let newStatus = '';
    if (actionType === 'pause') newStatus = 'Paused';
    if (actionType === 'renew') newStatus = 'Active';
    if (actionType === 'close') newStatus = 'Closed';

    try {
      await changeSubscriptionStatus(id, { status: newStatus });
      await fetchSubscription(); 
      setActionType(null); 
    } catch (err) {
      alert(err.message || 'We could not process this request right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mute)' }}>Loading your subscription details...</div>;
  }

  if (error || !subscription) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/portal" style={{ display: 'inline-block', marginBottom: '16px', color: 'var(--mute)', textDecoration: 'none' }}>
          &larr; Back to my account
        </Link>
        <Empty title="Subscription unavailable" description={error} actionText="Go back" onAction={() => navigate('/portal')} />
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(subscription.status) >= 0 ? STATUS_STEPS.indexOf(subscription.status) : 3;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/portal" style={{ display: 'inline-block', marginBottom: '16px', color: 'var(--mute)', textDecoration: 'none' }}>
        &larr; Back to my account
      </Link>

      <Head 
        title={`${subscription.productName || 'Subscription'}`}
        description={`Currently on the ${subscription.planName} plan.`}
      >
        <Badge type={subscription.status === 'Active' ? 'ok' : subscription.status === 'Closed' ? 'mute' : 'default'}>
          {subscription.status}
        </Badge>
      </Head>

      <div className="panel" style={{ marginBottom: '24px' }}>
        <Stepper steps={STATUS_STEPS} currentStep={currentStep} />
      </div>

      <div className="grid2" style={{ marginBottom: '24px' }}>
        <div className="panel">
          <h3 style={{ fontSize: '16px', marginBottom: '16px', fontFamily: 'Bricolage Grotesque' }}>Billing Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--mute)' }}>Amount</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>{money(subscription.amount)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--mute)' }}>Next billing date</div>
              <div style={{ fontSize: '16px' }}>
                {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--mute)' }}>Start date</div>
              <div style={{ fontSize: '16px' }}>
                {subscription.startDate ? formatDate(subscription.startDate) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="panel" style={{ backgroundColor: 'var(--paper)', border: 'none' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', fontFamily: 'Bricolage Grotesque' }}>Manage Subscription</h3>
          <p style={{ fontSize: '14px', color: 'var(--mute)', marginBottom: '24px' }}>
            Depending on your plan, you can make changes to your subscription below.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {subscription.plan?.canPause && subscription.status === 'Active' && (
              <button onClick={() => setActionType('pause')} className="btn" style={{ backgroundColor: '#ffffff', color: 'var(--ink)', border: '1px solid var(--line)' }}>
                Pause my subscription
              </button>
            )}

            {subscription.plan?.canRenew && (subscription.status === 'Paused' || subscription.status === 'Closed') && (
              <button onClick={() => setActionType('renew')} className="btn">
                Renew subscription
              </button>
            )}

            {subscription.plan?.canCloseEarly && subscription.status !== 'Closed' && (
              <button onClick={() => setActionType('close')} className="btn" style={{ backgroundColor: '#fce8ed', color: 'var(--warn)', border: '1px solid #f9c2d1' }}>
                Cancel subscription
              </button>
            )}

            {(!subscription.plan?.canPause && !subscription.plan?.canRenew && !subscription.plan?.canCloseEarly) && (
              <div style={{ fontSize: '14px', color: 'var(--mute)', padding: '12px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px dashed var(--line)' }}>
                This plan is fixed and cannot be changed early. Please contact support for help.
              </div>
            )}
          </div>
        </div>
      </div>

      {actionType && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16, 28, 51, 0.4)', zIndex: 99 }} 
            onClick={() => !isSubmitting && setActionType(null)}
          />
          <div className="modal">
            <h2 style={{ fontSize: '20px', margin: '0 0 16px', fontFamily: 'Bricolage Grotesque' }}>
              {actionType === 'pause' ? 'Pause your subscription?' : 
               actionType === 'renew' ? 'Renew your subscription?' : 
               'Cancel your subscription?'}
            </h2>
            
            <p style={{ color: 'var(--mute)', marginBottom: '24px' }}>
              {actionType === 'pause' ? 'Your subscription will be put on hold and you will not be billed until you choose to renew it. You will lose access to services during this time.' : 
               actionType === 'renew' ? 'Your subscription will become active again and billing will resume immediately.' : 
               'Are you sure you want to completely cancel? This action cannot be undone and your services will stop immediately.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' }}
                onClick={() => setActionType(null)}
                disabled={isSubmitting}
              >
                No, go back
              </button>
              <button 
                onClick={handleAction}
                className="btn"
                style={actionType === 'close' ? { backgroundColor: 'var(--warn)' } : {}}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Yes, confirm'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}