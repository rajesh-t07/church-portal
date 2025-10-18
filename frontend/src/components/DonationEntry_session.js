import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import DonorAutocomplete from './DonorAutocomplete';

const DonationEntry = () => {
  const [user, setUser] = useState(null);
  const [sessionData, setSessionData] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    pastorGift: '',
    notes: ''
  });
  
  // Current donation being entered
  const [currentDonation, setCurrentDonation] = useState({
    donorName: '',
    donorId: null,
    amount: '',
    donationType: 'Tithe',
    paymentMethod: 'Check',
    checkNumber: ''
  });
  
  // List of donations for the session
  const [donations, setDonations] = useState([]);
  
  // Cash denomination tracking
  const [cashDenominations, setCashDenominations] = useState({
    hundreds: 0,
    fifties: 0,
    twenties: 0,
    tens: 0,
    fives: 0,
    ones: 0
  });
  
  const [showCashBreakdown, setShowCashBreakdown] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Calculate session totals
  const calculateTotals = () => {
    const totalDonations = donations.reduce((sum, donation) => sum + parseFloat(donation.amount || 0), 0);
    const pastorGift = parseFloat(sessionData.pastorGift || 0);
    const netDeposit = totalDonations - pastorGift;
    const cashAmount = donations.filter(d => d.paymentMethod === 'Cash').reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const checkAmount = donations.filter(d => d.paymentMethod === 'Check').reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    
    return { totalDonations, pastorGift, netDeposit, cashAmount, checkAmount };
  };

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
      donationDate: sessionData.sessionDate,
      id: Date.now() // temporary ID
    };

    setDonations([...donations, newDonation]);
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
    setDonations(donations.filter(d => d.id !== id));
  };

  const getCashDenominationTotal = () => {
    return (cashDenominations.hundreds * 100) +
           (cashDenominations.fifties * 50) +
           (cashDenominations.twenties * 20) +
           (cashDenominations.tens * 10) +
           (cashDenominations.fives * 5) +
           (cashDenominations.ones * 1);
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
        donationDate: sessionData.sessionDate,
        id: Date.now()
      };
      
      setDonations([...donations, cashEntry]);
      
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

  const updateDenomination = (denomination, value) => {
    setCashDenominations(prev => ({
      ...prev,
      [denomination]: parseInt(value) || 0
    }));
  };

  const submitSession = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (donations.length === 0) {
        setError('Please add at least one donation');
        return;
      }

      const response = await axios.post('/api/donations/submit-session', {
        donations: donations.map(d => ({
          donorId: d.donorId,
          donorName: d.donorName,
          amount: d.amount,
          donationType: d.donationType,
          paymentMethod: d.paymentMethod,
          checkNumber: d.checkNumber,
          donationDate: d.donationDate
        })),
        pastorGift: sessionData.pastorGift,
        sessionDate: sessionData.sessionDate,
        notes: sessionData.notes
      });

      const result = response.data;
      setSuccess(`✅ Session saved successfully! Total: $${result.summary.totalCollected}, Net Deposit: $${result.summary.netDeposit}`);
      
      // Reset form
      setDonations([]);
      setSessionData({
        sessionDate: new Date().toISOString().split('T')[0],
        pastorGift: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('Error submitting donation session:', error);
      setError('❌ Error submitting donations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (!user) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Loading...
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Navigation user={user} />
      
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px',
        background: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <div style={{ background: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {/* Header */}
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#1a472a',
              margin: '0 0 10px 0',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
              ⛪ Weekly Donation Session
            </h2>
            <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
              Record all donations with proper accounting for pastor gifts
            </p>
          </div>

          {error && (
            <div style={{ 
              background: '#f8d7da', 
              color: '#721c24', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ 
              background: '#d4edda', 
              color: '#155724', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              {success}
            </div>
          )}

          {/* Session Information */}
          <div style={{
            background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '1px solid #2196f3'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1976d2', fontSize: '18px' }}>
              📅 Session Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  fontSize: '14px'
                }}>
                  Service Date:
                </label>
                <input
                  type="date"
                  value={sessionData.sessionDate}
                  onChange={(e) => setSessionData({...sessionData, sessionDate: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #2196f3',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  fontSize: '14px'
                }}>
                  Pastor Gift ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sessionData.pastorGift}
                  onChange={(e) => setSessionData({...sessionData, pastorGift: e.target.value})}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #2196f3',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  fontSize: '14px'
                }}>
                  Notes:
                </label>
                <input
                  type="text"
                  value={sessionData.notes}
                  onChange={(e) => setSessionData({...sessionData, notes: e.target.value})}
                  placeholder="Optional session notes..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #2196f3',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Session Summary */}
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '2px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#495057', fontSize: '18px', textAlign: 'center' }}>
              💰 Session Summary
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              gap: '15px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #28a745, #20c997)',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${totals.totalDonations.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Collected</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #fd7e14, #e55a4f)',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${totals.pastorGift.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Pastor Gift</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #007bff, #0056b3)',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${totals.netDeposit.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Net Deposit</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #6f42c1, #59309d)',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${totals.cashAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Cash</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #17a2b8, #117a8b)',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${totals.checkAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Checks</div>
              </div>
            </div>
          </div>

          {/* Donation Input Form */}
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '2px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 25px 0', color: '#495057', fontSize: '20px', textAlign: 'center' }}>
              ➕ Add New Donation
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px',
              marginBottom: '25px'
            }}>
              {/* Donor Name */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057',
                  fontSize: '14px'
                }}>
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
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057',
                  fontSize: '14px'
                }}>
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
              ➕ Add Donation to Session
            </button>
          </div>

          {/* Donations Table */}
          {donations.length > 0 && (
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
                  💰 Session Donations for {sessionData.sessionDate}
                </h3>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {donations.length} donations
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    Total: ${totals.totalDonations.toFixed(2)}
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
                    {donations.map((donation, index) => (
                      <tr key={donation.id} style={{ 
                        borderBottom: index < donations.length - 1 ? '1px solid #dee2e6' : 'none',
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
                💵 Cash Denomination Breakdown
              </h3>
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
                  <button
                    type="button"
                    onClick={addCashFromDenominations}
                    disabled={getCashDenominationTotal() === 0}
                    style={{
                      backgroundColor: getCashDenominationTotal() > 0 ? '#dc3545' : '#6c757d',
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
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span>💰</span> Add Cash Entry from Denominations
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          {donations.length > 0 && (
            <button 
              type="button"
              onClick={submitSession}
              disabled={loading}
              style={{
                width: '100%',
                padding: '20px',
                background: loading ? '#6c757d' : 'linear-gradient(135deg, #007bff, #0056b3)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 25px rgba(0, 123, 255, 0.4)'
              }}
            >
              {loading ? 'Submitting Session...' : `🎯 Submit Donation Session (${donations.length} donations, $${totals.netDeposit.toFixed(2)} net deposit)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationEntry;