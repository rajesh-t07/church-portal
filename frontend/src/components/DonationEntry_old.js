import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import DonorAutocomplete from './DonorAutocomplete';
import DepositSlipManager from './DepositSlipManager';
import { StyledComponents } from '../theme/StyledComponents';

const DonationEntry = () => {
  const [user, setUser] = useState(null);
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Current donation being entered (like expense form)
  const [currentDonation, setCurrentDonation] = useState({
    donorName: '',
    donorId: null,
    amount: '',
    donationType: 'Tithe',
    paymentMethod: 'Check',
    checkNumber: ''
  });
  
  // List of submitted donations for the service
  const [submittedDonations, setSubmittedDonations] = useState([]);
  
  // Cash denomination tracking
  const [cashDenominations, setCashDenominations] = useState({
    hundreds: 0,
    fifties: 0,
    twenties: 0,
    tens: 0,
    fives: 0,
    ones: 0
  });
  
  // Weekly deposit tracking
  const [pastorGift, setPastorGift] = useState(0);
  const [depositSlip, setDepositSlip] = useState(null);
  const [showCashBreakdown, setShowCashBreakdown] = useState(true);
  const [showDepositManager, setShowDepositManager] = useState(false);
  
  // Reviewer tracking for PDF generation
  const [reviewer1, setReviewer1] = useState('');
  const [reviewer2, setReviewer2] = useState('');
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [submittedSessionId, setSubmittedSessionId] = useState(null);
  const [submittedOfferingId, setSubmittedOfferingId] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (token && storedUser) {
      setUser(storedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      window.location.href = '/login';
    }
  }, []);

  const donationTypes = ['Tithe', 'Offering', 'Building Fund', 'Missions', 'Special Events', 'Other'];
  const paymentMethods = ['Check', 'Cash', 'Online Transfer'];

  const addDonationToList = () => {
    if (!currentDonation.amount || parseFloat(currentDonation.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (currentDonation.paymentMethod === 'Check' && !currentDonation.checkNumber) {
      setError('Please enter check number for check donations');
      return;
    }

    const newDonation = {
      ...currentDonation,
      amount: parseFloat(currentDonation.amount),
      donorName: currentDonation.donorName || 'Anonymous',
      id: Date.now() // temporary ID
    };

    setSubmittedDonations([...submittedDonations, newDonation]);
    setCurrentDonation({
      donorName: '',
      donorId: null,
      amount: '',
      donationType: 'Tithe',
      paymentMethod: 'Check',
      checkNumber: ''
    });
    setError('');
  };

  const removeDonation = (id) => {
    setSubmittedDonations(submittedDonations.filter(d => d.id !== id));
  };

  const getTotalAmount = () => {
    const donationsTotal = submittedDonations.reduce((total, donation) => total + (parseFloat(donation.amount) || 0), 0);
    const denominationsTotal = getCashDenominationTotal();
    return (donationsTotal + denominationsTotal).toFixed(2);
  };

  const getCashDenominationTotal = () => {
    const total = (cashDenominations.hundreds * 100) +
           (cashDenominations.fifties * 50) +
           (cashDenominations.twenties * 20) +
           (cashDenominations.tens * 10) +
           (cashDenominations.fives * 5) +
           (cashDenominations.ones * 1);
    
    console.log('Cash Denominations State:', cashDenominations);
    console.log('Calculated Total:', total);
    
    return total;
  };

  const addCashFromDenominations = () => {
    const cashTotal = getCashDenominationTotal();
    if (cashTotal > 0) {
      const cashEntry = {
        donorName: 'Anonymous Cash',
        donorId: null,
        amount: cashTotal,
        donationType: 'Tithe',
        paymentMethod: 'Cash',
        checkNumber: '',
        id: Date.now()
      };
      
      setSubmittedDonations([...submittedDonations, cashEntry]);
      
      // Reset denominations after adding
      setCashDenominations({
        hundreds: 0,
        fifties: 0,
        twenties: 0,
        tens: 0,
        fives: 0,
        ones: 0
      });
      
      setSuccess(`✅ Added cash donation of $${cashTotal.toFixed(2)} from denominations`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Please enter cash denominations first');
    }
  };

  const getCashTotal = () => {
    // Cash from individual donations
    const donationCash = submittedDonations
      .filter(d => d.paymentMethod === 'Cash')
      .reduce((total, donation) => total + (parseFloat(donation.amount) || 0), 0);
    
    // Cash from denominations
    const denominationCash = Object.entries(cashDenominations)
      .reduce((total, [denomination, count]) => {
        const values = {
          'hundreds': 100, 'fifties': 50, 'twenties': 20,
          'tens': 10, 'fives': 5, 'ones': 1
        };
        return total + (values[denomination] * (parseInt(count) || 0));
      }, 0);
    
    return donationCash + denominationCash;
  };

  // Helper function to prepare data for deposit slip manager
  const prepareWeekData = () => {
    // Always include current cash denominations, whether converted to donations or not
    const cash = Object.entries(cashDenominations)
      .filter(([_, count]) => count > 0)
      .map(([denomination, count]) => {
        const denominationValues = {
          'hundreds': { value: 100, name: 'Hundred' },
          'fifties': { value: 50, name: 'Fifty' },
          'twenties': { value: 20, name: 'Twenty' },
          'tens': { value: 10, name: 'Ten' },
          'fives': { value: 5, name: 'Five' },
          'ones': { value: 1, name: 'One' }
        };
        
        return {
          denomination: denominationValues[denomination].value,
          denominationName: denominationValues[denomination].name,
          count: count
        };
      });

    const checks = submittedDonations
      .filter(d => d.paymentMethod === 'Check')
      .map(d => ({
        name: d.donorName || 'Anonymous',
        checkNumber: d.checkNumber || '',
        amount: d.amount
      }));

    const individualCashDonations = submittedDonations
      .filter(d => d.paymentMethod === 'Cash')
      .map(d => ({
        donorName: d.donorName || 'Anonymous',
        amount: d.amount
      }));

    return {
      date: donationDate,
      cash,
      checks,
      individualCashDonations,
      totalCash: getCashTotal(),
      totalChecks: getCheckTotal(),
      totalOffering: getTotalAmount(),
      pastorGift: pastorGift
    };
  };

  const getCheckTotal = () => {
    return submittedDonations
      .filter(d => d.paymentMethod === 'Check')
      .reduce((total, donation) => total + (parseFloat(donation.amount) || 0), 0);
  };

  const getDonationCount = () => {
    return submittedDonations.filter(d => d.amount && parseFloat(d.amount) > 0).length;
  };

  const getFinalDepositAmount = () => {
    return (getCashTotal() + getCheckTotal() - parseFloat(pastorGift || 0)).toFixed(2);
  };

  const updateDenomination = (denomination, value) => {
    setCashDenominations(prev => ({
      ...prev,
      [denomination]: parseInt(value) || 0
    }));
  };

  const resetForm = () => {
    // Reset all form fields
    setSubmittedDonations([]);
    setCurrentDonation({
      donorName: '',
      donorId: null,
      amount: '',
      donationType: 'Tithe',
      paymentMethod: 'Check',
      checkNumber: ''
    });
    setReviewer1('');
    setReviewer2('');
    setPastorGift('');
    
    // Reset cash denominations
    setCashDenominations({
      hundreds: 0,
      fifties: 0,
      twenties: 0,
      tens: 0,
      fives: 0,
      ones: 0
    });
    
    // Reset UI state
    setSuccess('');
    setShowPdfDownload(false);
    setSubmittedSessionId(null);
    setSubmittedOfferingId(null);
    setError('');
  };

  const downloadOfferingSummaryPdf = async () => {
    try {
      let response;
      
      // Use offering PDF endpoint if available (better formatting and calculations)
      if (submittedOfferingId) {
        response = await axios.get(`/api/offerings/${submittedOfferingId}/pdf`, {
          responseType: 'blob'
        });
      } else if (submittedSessionId) {
        // Fallback to session PDF endpoint
        response = await axios.get(`/api/donations/session/${submittedSessionId}/pdf`, {
          responseType: 'blob'
        });
      } else {
        setError('No PDF available for download');
        return;
      }
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Weekly_Offering_Summary_${donationDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Error downloading PDF. Please try again.');
    }
  };

  const createPendingDeposit = async (sessionId) => {
    try {
      const weekData = {
        date: donationDate,
        cash: Object.entries(cashDenominations)
          .filter(([_, count]) => count > 0)
          .map(([denomination, count]) => {
            const denominationValues = {
              'hundreds': { value: 100, name: 'Hundred' },
              'fifties': { value: 50, name: 'Fifty' },
              'twenties': { value: 20, name: 'Twenty' },
              'tens': { value: 10, name: 'Ten' },
              'fives': { value: 5, name: 'Five' },
              'ones': { value: 1, name: 'One' }
            };
            
            return {
              denomination: denominationValues[denomination].value,
              denominationName: denominationValues[denomination].name,
              count: count
            };
          }),
        checks: submittedDonations
          .filter(d => d.paymentMethod === 'Check')
          .map(d => ({
            name: d.donorName || 'Anonymous',
            checkNumber: d.checkNumber || '',
            amount: d.amount
          })),
        individualCashDonations: submittedDonations
          .filter(d => d.paymentMethod === 'Cash')
          .map(d => ({
            donorName: d.donorName || 'Anonymous',
            amount: d.amount
          })),
        pastorGift: parseFloat(pastorGift || 0)
      };

      const totals = {
        totalOffering: parseFloat(getTotalAmount()),
        cashTotal: getCashTotal(),
        checksTotal: getCheckTotal(),
        finalDeposit: parseFloat(getFinalDepositAmount())
      };

      const response = await axios.post('/api/offerings/pending-deposit', {
        weekData,
        totals,
        sessionId,
        reviewer1,
        reviewer2
      });

      console.log('Pending deposit created successfully');
      
      // Return the offering ID for PDF generation
      return response.data.deposit?.id;
    } catch (error) {
      console.error('Error creating pending deposit:', error);
      // Don't show error to user since this is a background operation
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submittedDonations.length === 0) {
      setError('Please add at least one donation');
      return;
    }

    if (!reviewer1 || !reviewer2) {
      setError('Please enter both reviewer names before submitting');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      // First, create a donation session with reviewers
      const sessionResponse = await axios.post('/api/donations/create-session', {
        donationDate,
        reviewer1,
        reviewer2,
        totalAmount: getTotalAmount(),
        pastorGift
      });
      
      const sessionId = sessionResponse.data.sessionId;
      setSubmittedSessionId(sessionId);
      
      // Then submit all donations with the session ID
      const submissions = [];
      
      for (const donation of submittedDonations) {
        const response = await axios.post('/api/donations/submit', {
          ...donation,
          donationDate,
          sessionId,
          amount: parseFloat(donation.amount),
          donorName: donation.donorName || 'Anonymous'
        });
        submissions.push(response.data);
      }
      
      setSuccess(`✅ Successfully recorded ${submissions.length} donations totaling $${getTotalAmount()}`);
      setShowPdfDownload(true);
      
      // Create pending deposit record for DepositManagement
      const offeringId = await createPendingDeposit(sessionId);
      if (offeringId) {
        setSubmittedOfferingId(offeringId);
      }
      
      // Don't reset form immediately - let user download PDF first
      // Reset form after successful submission - removed automatic reset
      // User can manually reset or navigate away
      
      // Show deposit manager after PDF download option - disabled for now
      // setTimeout(() => {
      //   setShowDepositManager(true);
      // }, 3000);
      
    } catch (error) {
      console.error('Error submitting donations:', error);
      setError('❌ Error submitting donations. Please try again.');
    }
  };

  if (!user) return (
    <div style={StyledComponents.LoadingContainer}>
      <div style={StyledComponents.LoadingText}>Loading...</div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      <Navigation user={user} />
      
      {/* Main Content Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        paddingTop: '1rem'
      }}>
        {/* Hero Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            marginBottom: '1rem',
            fontSize: '2rem'
          }}>
            ⛪
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#2c3e50',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em'
          }}>
            Weekly Offering Entry
          </h1>
          <p style={{
            color: '#6c757d',
            fontSize: '1.2rem',
            margin: 0,
            fontWeight: '400'
          }}>
            Record all donations received during Sunday service
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            fontSize: '1rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(40, 167, 69, 0.1)',
            border: '1px solid rgba(40, 167, 69, 0.3)',
            color: '#155724',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            fontSize: '1rem'
          }}>
            {success}
          </div>
        )}

        {/* Service Date Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#495057',
                marginBottom: '0.5rem'
              }}>
                � Service Date
              </label>
              <input
                type="date"
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                required
                style={{
                  padding: '0.75rem 1rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  width: '200px',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.5rem' }}>� Quick Guide</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                Add individual donations, cash counts, and reviewer signatures for complete offering summary
              </div>
            </div>
          </div>
        </div>

        {/* Individual Donation Entry Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              borderRadius: '12px',
              marginRight: '1rem',
              fontSize: '1.5rem'
            }}>
              ➕
            </div>
            <div>
              <h3 style={{ 
                margin: '0', 
                color: '#2c3e50', 
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                Add New Donation
              </h3>
              <p style={{
                margin: '0.25rem 0 0 0',
                color: '#6c757d',
                fontSize: '1rem'
              }}>
                Enter individual donation details
              </p>
            </div>
          </div>

            <div style={{
              ...StyledComponents.FormGrid,
              marginBottom: '1.5rem'
            }}>
              {/* Donor Name */}
              <div style={StyledComponents.FormGroup}>
                <label style={StyledComponents.Label}>
                  👤 Donor Name
                </label>
                <DonorAutocomplete
                  value={currentDonation.donorName}
                  onChange={(name, donor) => setCurrentDonation({
                    ...currentDonation, 
                    donorName: name,
                    donorId: donor?.id || null
                  })}
                  placeholder="Start typing donor name or leave empty for anonymous..."
                />
              </div>

              {/* Amount */}
              <div style={StyledComponents.FormGroup}>
                <label style={StyledComponents.Label}>
                  💵 Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentDonation.amount}
                  onChange={(e) => setCurrentDonation({...currentDonation, amount: e.target.value})}
                  placeholder="0.00"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Donation Type */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  🎯 Donation Type
                </label>
                <select
                  value={currentDonation.donationType}
                  onChange={(e) => setCurrentDonation({...currentDonation, donationType: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: 'white'
                  }}
                >
                  {donationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  💳 Payment Method
                </label>
                <select
                  value={currentDonation.paymentMethod}
                  onChange={(e) => setCurrentDonation({...currentDonation, paymentMethod: e.target.value, checkNumber: e.target.value !== 'Check' ? '' : currentDonation.checkNumber})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: 'white'
                  }}
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Check Number */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057',
                  fontSize: '14px'
                }}>
                  🏦 Check Number {currentDonation.paymentMethod === 'Check' && '*'}
                </label>
                <input
                  type="text"
                  value={currentDonation.checkNumber}
                  onChange={(e) => setCurrentDonation({...currentDonation, checkNumber: e.target.value})}
                  placeholder={currentDonation.paymentMethod === 'Check' ? 'Required' : 'N/A'}
                  disabled={currentDonation.paymentMethod !== 'Check'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: currentDonation.paymentMethod !== 'Check' ? '#f8f9fa' : 'white',
                    color: currentDonation.paymentMethod !== 'Check' ? '#6c757d' : '#495057',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Add Button */}
            <button 
              type="button"
              onClick={addDonationToList}
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(135deg, #28a745, #20c997)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
              }}
            >
              ➕ Add Donation to List
            </button>
          </div>

          {/* Donations Table */}
          {submittedDonations.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              marginBottom: '25px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #28a745, #20c997)',
                color: 'white',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  💰 Donation Entries for {donationDate}
                </h3>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {submittedDonations.length} donations
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    Total: ${getTotalAmount()}
                  </div>
                </div>
              </div>

              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '15px 12px', textAlign: 'center', fontWeight: 'bold', color: '#495057', fontSize: '14px', width: '60px' }}>#</th>
                      <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold', color: '#495057', fontSize: '14px', minWidth: '150px' }}>👤 Donor</th>
                      <th style={{ padding: '15px 12px', textAlign: 'right', fontWeight: 'bold', color: '#495057', fontSize: '14px', width: '120px' }}>💵 Amount</th>
                      <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold', color: '#495057', fontSize: '14px', width: '140px' }}>🎯 Type</th>
                      <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold', color: '#495057', fontSize: '14px', width: '120px' }}>💳 Method</th>
                      <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold', color: '#495057', fontSize: '14px', width: '120px' }}>🏦 Check #</th>
                      <th style={{ padding: '15px 12px', textAlign: 'center', fontWeight: 'bold', color: '#495057', fontSize: '14px', width: '80px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedDonations.map((donation, index) => (
                      <tr key={donation.id} style={{ 
                        borderBottom: index < submittedDonations.length - 1 ? '1px solid #dee2e6' : 'none',
                        background: index % 2 === 0 ? '#fff' : '#f8fff9'
                      }}>
                        <td style={{ padding: '15px 12px', fontWeight: 'bold', color: '#6c757d', fontSize: '16px', textAlign: 'center' }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '15px 12px', fontWeight: '500' }}>
                          {donation.donorName || 'Anonymous'}
                        </td>
                        <td style={{ padding: '15px 12px', fontWeight: 'bold', color: '#28a745', fontSize: '16px', textAlign: 'right' }}>
                          ${parseFloat(donation.amount).toFixed(2)}
                        </td>
                        <td style={{ padding: '15px 12px' }}>
                          <span style={{
                            background: '#e9ecef',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#495057',
                            fontWeight: '500'
                          }}>
                            {donation.donationType}
                          </span>
                        </td>
                        <td style={{ padding: '15px 12px' }}>
                          <span style={{
                            background: donation.paymentMethod === 'Cash' ? '#fff3cd' : donation.paymentMethod === 'Check' ? '#d4edda' : '#cce5ff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: donation.paymentMethod === 'Cash' ? '#856404' : donation.paymentMethod === 'Check' ? '#155724' : '#004085',
                            fontWeight: '500'
                          }}>
                            {donation.paymentMethod}
                          </span>
                        </td>
                        <td style={{ padding: '15px 12px', color: '#6c757d' }}>
                          {donation.checkNumber || 'N/A'}
                        </td>
                        <td style={{ padding: '15px 12px', textAlign: 'center' }}>
                          <button 
                            type="button" 
                            onClick={() => removeDonation(donation.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Dashboards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '15px',
            marginBottom: '25px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #007bff, #0056b3)',
              color: 'white',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                {getDonationCount()}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Donations</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #28a745, #1e7e34)',
              color: 'white',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                ${getCashTotal().toFixed(2)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Cash Total</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #17a2b8, #117a8b)',
              color: 'white',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(23, 162, 184, 0.3)'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                ${getCheckTotal().toFixed(2)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Check Total</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #6f42c1, #59309d)',
              color: 'white',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(111, 66, 193, 0.3)'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                ${getFinalDepositAmount()}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Final Deposit</div>
            </div>
          </div>

          {/* Cash Denomination Breakdown */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: '25px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #fd7e14, #e55a4f)',
              color: 'white',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                💵 Anonymous Cash (Count Bills & Coins)
              </h3>
              <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
                This represents all unnamed cash donations from offering plate
              </div>
              <button 
                type="button" 
                onClick={() => setShowCashBreakdown(!showCashBreakdown)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {showCashBreakdown ? '🔼 Hide' : '🔽 Show'}
              </button>
            </div>
            
            {showCashBreakdown && (
              <div style={{ padding: '25px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  {[
                    { name: 'hundreds', label: '$100 Bills', value: 100 },
                    { name: 'fifties', label: '$50 Bills', value: 50 },
                    { name: 'twenties', label: '$20 Bills', value: 20 },
                    { name: 'tens', label: '$10 Bills', value: 10 },
                    { name: 'fives', label: '$5 Bills', value: 5 },
                    { name: 'ones', label: '$1 Bills', value: 1 }
                  ].map(denom => (
                    <div key={denom.name} style={{
                      background: '#f8f9fa',
                      padding: '15px',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6'
                    }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: 'bold',
                        color: '#495057',
                        fontSize: '14px'
                      }}>
                        {denom.label}:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="number"
                          min="0"
                          value={cashDenominations[denom.name]}
                          onChange={(e) => updateDenomination(denom.name, e.target.value)}
                          style={{
                            width: '80px',
                            padding: '8px 12px',
                            border: '2px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ color: '#6c757d', fontSize: '14px' }}>×</span>
                        <span style={{ fontWeight: 'bold', color: '#495057' }}>${denom.value}</span>
                        <span style={{ color: '#6c757d', fontSize: '14px' }}>=</span>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: '#28a745',
                          fontSize: '16px'
                        }}>
                          ${(cashDenominations[denom.name] * denom.value).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '18px', marginBottom: '5px' }}>
                    Total Cash from Denominations
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                    ${getCashDenominationTotal().toFixed(2)}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}>
                    💡 <strong>Anonymous Cash Denominations:</strong> Count actual bills/coins from offering plate. These will automatically be included in your deposit slip alongside named donations above.
                  </div>
                  
                  <button
                    type="button"
                    disabled={true}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '15px 30px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: getCashDenominationTotal() > 0 ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (getCashDenominationTotal() > 0) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                    }}
                  >
                    <span>ℹ️</span> Auto-Included with Submission
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pastor Gift and Final Deposit */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: '25px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #6f42c1, #5a2d8a)',
              color: 'white',
              padding: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                🎁 Pastor Gift & Final Deposit
              </h3>
            </div>
            
            <div style={{ padding: '25px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '10px', 
                    fontWeight: 'bold',
                    color: '#495057',
                    fontSize: '16px'
                  }}>
                    💰 Cash taken for Pastor Gift:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pastorGift}
                    onChange={(e) => setPastorGift(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #ced4da',
                      borderRadius: '8px',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '10px', 
                    fontWeight: 'bold',
                    color: '#495057',
                    fontSize: '16px'
                  }}>
                    📄 Deposit Slip (optional):
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDepositSlip(e.target.files[0])}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #ced4da',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
              </div>
              
              <div style={{
                marginTop: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #17a2b8, #0c7488)',
                color: 'white',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '16px', marginBottom: '5px', opacity: 0.9 }}>
                  Final Amount to Deposit
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                  ${getFinalDepositAmount()}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
                  (Cash: ${getCashTotal().toFixed(2)} + Checks: ${getCheckTotal().toFixed(2)} - Pastor Gift: ${(parseFloat(pastorGift) || 0).toFixed(2)})
                </div>
              </div>
            </div>
          </div>

          {/* Reviewers Section */}
          {submittedDonations.length > 0 && (
            <div style={{
              ...StyledComponents.Card,
              background: '#f8f9fa',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#2c3e50',
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✍️ Offering Reviewers
              </h3>
              <p style={{
                color: '#666',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                Enter the names of two people who counted and verified the offering amounts
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    First Reviewer *
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter reviewer name" 
                    value={reviewer1}
                    onChange={(e) => setReviewer1(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #ced4da',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Second Reviewer *
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter reviewer name" 
                    value={reviewer2}
                    onChange={(e) => setReviewer2(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #ced4da',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PDF Download Section */}
          {showPdfDownload && (submittedSessionId || submittedOfferingId) && (
            <div style={{
              ...StyledComponents.Card,
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              color: 'white',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                fontSize: '18px',
                fontWeight: '600'
              }}>
                🎉 Offerings Successfully Submitted!
              </h3>
              <p style={{
                marginBottom: '20px',
                fontSize: '14px',
                opacity: 0.9
              }}>
                Your offerings have been recorded with Submission ID #{submittedOfferingId}. Download the PDF summary and check the Deposit Management screen.
              </p>
              
              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={downloadOfferingSummaryPdf}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.3)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  📥 Download PDF Summary
                </button>
                
                <button 
                  onClick={() => window.location.href = '/deposits'}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(40,167,69,0.8)',
                    color: 'white',
                    border: '2px solid rgba(40,167,69,0.3)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(40,167,69,1)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(40,167,69,0.8)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  🏦 View in Deposit Manager
                </button>
                
                <button 
                  onClick={resetForm}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(108,117,125,0.8)',
                    color: 'white',
                    border: '2px solid rgba(108,117,125,0.3)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(108,117,125,1)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(108,117,125,0.8)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  🔄 Start New Entry
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {submittedDonations.length > 0 && !success && !showPdfDownload && (
            <button 
              type="button"
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '20px',
                background: 'linear-gradient(135deg, #28a745, #20c997)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(40, 167, 69, 0.4)'
              }}
            >
              🎯 Submit All Donations (${getTotalAmount()})
            </button>
          )}
        
        {/* Deposit Slip Manager Modal */}
        {showDepositManager && (
          <DepositSlipManager
            weekData={prepareWeekData()}
            onClose={() => {
              setShowDepositManager(false);
              setSubmittedDonations([]);
            }}
            onDepositComplete={() => {
              setSubmittedDonations([]);
              setCashDenominations({
                hundreds: 0,
                fifties: 0,
                twenties: 0,
                tens: 0,
                fives: 0,
                ones: 0
              });
              setPastorGift(0);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DonationEntry;