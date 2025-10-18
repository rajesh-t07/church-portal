import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import DonorAutocomplete from './DonorAutocomplete';

const DonationEntry = () => {
  const [user, setUser] = useState(null);
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [donationType, setDonationType] = useState('Tithe');
  const [paymentMethod, setPaymentMethod] = useState('Check');
  const [checkNumber, setCheckNumber] = useState('');
  const [submittedDonations, setSubmittedDonations] = useState([]);
  const [cash, setCash] = useState({});
  const [pastorGift, setPastorGift] = useState('');
  const [reviewer1, setReviewer1] = useState('');
  const [reviewer2, setReviewer2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [submittedOfferingId, setSubmittedOfferingId] = useState(null);
  const [showCashDenominations, setShowCashDenominations] = useState(false);

  // Reset form function - Best practice after successful submission
  const resetForm = () => {
    setAmount('');
    setDonorName('');
    setDonationType('Tithe');
    setPaymentMethod('Check');
    setCheckNumber('');
    setSubmittedDonations([]);
    setCash({});
    setPastorGift('');
    setReviewer1('');
    setReviewer2('');
    setError('');
    // Note: Keep success message and showPdfDownload for user feedback
  };

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

  // Helper functions
  const addDonation = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (paymentMethod === 'Check' && !checkNumber.trim()) {
      setError('Please enter check number');
      return;
    }

    const newDonation = {
      donorName: donorName.trim() || 'Anonymous',
      amount: parseFloat(amount),
      donationType,
      paymentMethod,
      checkNumber: paymentMethod === 'Check' ? checkNumber : null,
      id: Date.now()
    };

    setSubmittedDonations([...submittedDonations, newDonation]);
    setDonorName('');
    setAmount('');
    setCheckNumber('');
    setError('');
  };

  const removeDonation = (id) => {
    setSubmittedDonations(submittedDonations.filter(d => d.id !== id));
  };

  const getCashTotal = () => {
    return Object.entries(cash).reduce((total, [denom, count]) => {
      return total + (parseFloat(denom) * parseInt(count || 0));
    }, 0).toFixed(2);
  };

  const getCheckTotal = () => {
    return submittedDonations
      .filter(d => d.paymentMethod === 'Check')
      .reduce((total, d) => total + d.amount, 0)
      .toFixed(2);
  };

  const getCashDonationTotal = () => {
    return submittedDonations
      .filter(d => d.paymentMethod === 'Cash')
      .reduce((total, d) => total + d.amount, 0)
      .toFixed(2);
  };

  const getTotalAmount = () => {
    const cashFromDenominations = parseFloat(getCashTotal());
    const cashFromDonations = parseFloat(getCashDonationTotal());
    const checksTotal = parseFloat(getCheckTotal());
    const pastorGiftAmount = parseFloat(pastorGift || 0);
    return (cashFromDenominations + cashFromDonations + checksTotal - pastorGiftAmount).toFixed(2);
  };

  const createPendingDeposit = async (sessionId) => {
    try {
      const cashData = Object.entries(cash)
        .filter(([denom, count]) => count > 0)
        .map(([denomination, count]) => ({ denomination, count }));

      const checksData = submittedDonations
        .filter(d => d.paymentMethod === 'Check')
        .map(d => ({
          name: d.donorName,
          amount: d.amount,
          checkNumber: d.checkNumber
        }));

      const individualCashData = submittedDonations
        .filter(d => d.paymentMethod === 'Cash')
        .map(d => ({
          donorName: d.donorName,
          amount: d.amount
        }));

      // Calculate totals
      const cashTotal = cashData.reduce((sum, item) => sum + (parseFloat(item.denomination) * item.count), 0);
      const checksTotal = checksData.reduce((sum, check) => sum + parseFloat(check.amount), 0);
      const individualCashTotal = individualCashData.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);
      const totalOffering = cashTotal + checksTotal + individualCashTotal;
      const finalDeposit = totalOffering - parseFloat(pastorGift || 0);

      const weekData = {
        date: donationDate,
        cash: cashData,
        checks: checksData,
        individualCashDonations: individualCashData,
        pastorGift: parseFloat(pastorGift || 0)
      };

      const totals = {
        cashTotal,
        checksTotal,
        totalOffering,
        finalDeposit
      };

      const response = await axios.post('/api/offerings/save-pending', {
        weekData,
        totals,
        sessionId,
        reviewer1,
        reviewer2
      });

      return response.data.deposit?.id || response.data.id;
    } catch (error) {
      console.error('Error creating pending deposit:', error);
      return null;
    }
  };

  const downloadOfferingSummaryPdf = async () => {
    if (!submittedOfferingId) return;
    
    try {
      const response = await axios.get(`/api/offerings/${submittedOfferingId}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sunday_Offering_Summary_${donationDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Error downloading PDF. Please try again.');
    }
  };

  const submitAllOfferings = async () => {
    if (submittedDonations.length === 0) {
      setError('Please add at least one donation before submitting.');
      return;
    }

    try {
      setError('');
      
      const sessionResponse = await axios.post('/api/donations/create-session', {
        donationDate: donationDate,
        totalAmount: getTotalAmount(),
        pastorGift: parseFloat(pastorGift || 0),
        reviewer1,
        reviewer2
      });
      
      const sessionId = sessionResponse.data.sessionId;
      
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
      
      const offeringId = await createPendingDeposit(sessionId);
      if (offeringId) {
        setSubmittedOfferingId(offeringId);
      }

      // Reset form for next entry - Best practice
      resetForm();
      
    } catch (error) {
      console.error('Error submitting donations:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.data?.message) {
        setError(`❌ ${error.response.data.message}`);
      } else if (error.response?.status === 500) {
        setError('❌ Server error. Please check if the backend is running.');
      } else if (error.response?.status === 401) {
        setError('❌ Authentication error. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.code === 'ERR_NETWORK') {
        setError('❌ Network error. Please check if the backend server is running.');
      } else {
        setError('❌ Error submitting donations. Please try again.');
      }
    }
  };

  if (!user) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      <Navigation user={user} />
      
      {/* Main Container */}
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '20px',
        paddingTop: '100px'
      }}>
        
        {/* Compact Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '16px',
          padding: '20px 30px',
          marginBottom: '25px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '24px',
              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
            }}>
              💰
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{
                margin: '0',
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}>
                Sunday Offering Portal
              </h1>
              <p style={{
                margin: '2px 0 0 0',
                fontSize: '14px',
                color: '#6c757d',
                fontWeight: '500'
              }}>
                Modern digital offering management
              </p>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '2px solid rgba(220, 53, 69, 0.3)',
            color: '#721c24',
            padding: '16px 24px',
            borderRadius: '16px',
            marginBottom: '24px',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        {/* Main Grid Layout - Horizontal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '30px',
          alignItems: 'start'
        }}>
          
          {/* Left Panel - Form & Cash */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            
            {/* Service Date & Quick Entry */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(20px)'
            }}>
              {/* Service Date Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '28px' }}>📅</div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      opacity: 0.9
                    }}>
                      Service Date
                    </label>
                    <input
                      type="date"
                      value={donationDate}
                      onChange={(e) => setDonationDate(e.target.value)}
                      required
                      style={{
                        padding: '12px 16px',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        background: 'rgba(255,255,255,0.95)',
                        color: '#333',
                        width: '180px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '14px', opacity: 0.9 }}>
                  💡 All offerings for this service
                </div>
              </div>

              {/* Compact Quick Entry Form */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#28a745',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    marginRight: '12px'
                  }}>
                    +
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Quick Entry
                  </h3>
                </div>

                {/* Single Row Form with Check Number */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: paymentMethod === 'Check' ? '2fr 1fr 1fr 1fr 1.2fr 80px' : '2fr 1fr 1fr 1fr 80px',
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <DonorAutocomplete
                    value={donorName}
                    onChange={(value) => setDonorName(value)}
                    placeholder="👤 Donor name or leave blank..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  />

                  <input
                    type="number"
                    placeholder="💰 0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white',
                      fontWeight: '600'
                    }}
                  />

                  <select
                    value={donationType}
                    onChange={(e) => setDonationType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    <option value="Tithe">Tithe</option>
                    <option value="Offering">Offering</option>
                    <option value="Special">Special</option>
                  </select>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    <option value="Check">Check</option>
                    <option value="Cash">Cash</option>
                  </select>

                  {/* Check Number - appears in same row when Check is selected */}
                  {paymentMethod === 'Check' && (
                    <input
                      type="text"
                      placeholder="🧾 Check #"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    />
                  )}

                  <button
                    onClick={addDonation}
                    style={{
                      padding: '8px 12px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Split Area: Cash Count (Left) + Live Entries (Right) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              
              {/* Left Half: Cash Denominations */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    💵 Cash Count
                  </h4>
                  <button
                    onClick={() => setShowCashDenominations(!showCashDenominations)}
                    style={{
                      padding: '6px 12px',
                      background: showCashDenominations ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {showCashDenominations ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showCashDenominations && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 60px 70px',
                    gap: '6px',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}>
                    {[
                      { label: '$100', value: 100 },
                      { label: '$50', value: 50 },
                      { label: '$20', value: 20 },
                      { label: '$10', value: 10 },
                      { label: '$5', value: 5 },
                      { label: '$1', value: 1 }
                    ].map(denom => (
                      <>
                        <div key={`label-${denom.value}`} style={{
                          fontWeight: '600',
                          textAlign: 'right'
                        }}>
                          {denom.label}:
                        </div>
                        <input
                          key={`input-${denom.value}`}
                          type="number"
                          value={cash[denom.value] || 0}
                          onChange={(e) => setCash({...cash, [denom.value]: parseInt(e.target.value) || 0})}
                          min="0"
                          style={{
                            width: '50px',
                            padding: '4px 6px',
                            textAlign: 'center',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: 'white',
                            color: '#333'
                          }}
                        />
                        <div key={`total-${denom.value}`} style={{
                          fontWeight: '600',
                          color: '#28a745',
                          fontSize: '12px'
                        }}>
                          ${((cash[denom.value] || 0) * denom.value).toFixed(2)}
                        </div>
                      </>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Half: Live Donation Entries */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  📝 Recent Entries ({submittedDonations.length})
                </h4>
                
                {submittedDonations.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#6c757d',
                    fontSize: '14px',
                    padding: '20px'
                  }}>
                    No donations entered yet
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '8px'
                  }}>
                    {submittedDonations.slice().reverse().map(donation => (
                      <div key={donation.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 8px',
                        marginBottom: '4px',
                        background: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ 
                          flex: 1,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            fontWeight: '600',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {donation.donorName || 'Anonymous'}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#6c757d'
                          }}>
                            {donation.donationType} • {donation.paymentMethod}
                            {donation.checkNumber && (
                              <span style={{ 
                                fontWeight: '600', 
                                color: '#495057',
                                background: '#e9ecef',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                marginLeft: '4px'
                              }}>
                                #{donation.checkNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span style={{ 
                            fontWeight: '700',
                            color: donation.paymentMethod === 'Cash' ? '#28a745' : '#17a2b8',
                            minWidth: '50px',
                            textAlign: 'right'
                          }}>
                            ${donation.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeDonation(donation.id)}
                            style={{
                              background: '#dc3545',
                              border: 'none',
                              borderRadius: '3px',
                              color: 'white',
                              padding: '2px 5px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              lineHeight: '1'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Summary & Controls */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            
            {/* Live Summary */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(20px)'
            }}>
              <h3 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '700',
                color: '#2c3e50',
                textAlign: 'center'
              }}>
                📊 Live Summary
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '600' }}>Donations</span>
                  <span style={{ fontSize: '22px', fontWeight: '700' }}>{submittedDonations.length}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '600' }}>Cash</span>
                  <span style={{ fontSize: '22px', fontWeight: '700' }}>${getCashTotal()}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '600' }}>Checks</span>
                  <span style={{ fontSize: '22px', fontWeight: '700' }}>${getCheckTotal()}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '14px',
                  color: 'white',
                  border: '3px solid rgba(255,255,255,0.2)'
                }}>
                  <span style={{ fontSize: '17px', fontWeight: '700' }}>Final Total</span>
                  <span style={{ fontSize: '26px', fontWeight: '900' }}>${getTotalAmount()}</span>
                </div>
              </div>
            </div>

            {/* Pastor Gift */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(20px)'
            }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '700',
                color: '#dc3545',
                textAlign: 'center'
              }}>
                🎁 Pastor Gift (Cash Out)
              </h3>
              <input
                type="number"
                placeholder="0.00"
                value={pastorGift}
                onChange={(e) => setPastorGift(e.target.value)}
                step="0.01"
                min="0"
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '14px',
                  fontSize: '18px',
                  fontWeight: '600',
                  textAlign: 'center',
                  background: 'white'
                }}
              />
            </div>

            {/* Reviewers */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(20px)'
            }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '700',
                color: '#2c3e50',
                textAlign: 'center'
              }}>
                ✍️ Verification
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Reviewer 1"
                  value={reviewer1}
                  onChange={(e) => setReviewer1(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: 'white'
                  }}
                />
                <input
                  type="text"
                  placeholder="Reviewer 2"
                  value={reviewer2}
                  onChange={(e) => setReviewer2(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: 'white'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitAllOfferings}
              disabled={submittedDonations.length === 0 || success}
              style={{
                width: '100%',
                padding: '20px',
                background: submittedDonations.length > 0 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: submittedDonations.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: submittedDonations.length > 0 
                  ? '0 12px 24px rgba(102, 126, 234, 0.4)' 
                  : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              🚀 Submit All Offerings
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal Overlay - Centered */}
      {showPdfDownload && (
        <div style={{
          position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
          animation: 'modalSlideIn 0.3s ease-out'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '20px'
          }}>
            🎉
          </div>
          
          <h2 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '28px',
            fontWeight: '700'
          }}>
            Offerings Successfully Submitted!
          </h2>
          
          <p style={{
            marginBottom: '30px',
            fontSize: '18px',
            opacity: 0.95,
            lineHeight: '1.5'
          }}>
            Your offerings have been recorded with<br/>
            <strong style={{ fontSize: '20px' }}>Submission ID #{submittedOfferingId}</strong>
          </p>

          <p style={{
            marginBottom: '30px',
            fontSize: '16px',
            opacity: 0.9
          }}>
            Download the PDF summary and check the Deposit Management screen to complete the process.
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
                padding: '16px 24px',
                background: 'rgba(255,255,255,0.25)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.35)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.25)';
              }}
            >
              📄 Download PDF Summary
            </button>
            
            <button
              onClick={() => window.location.href = '/deposit-management'}
              style={{
                padding: '16px 24px',
                background: 'rgba(255,255,255,0.9)',
                color: '#28a745',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.9)';
              }}
            >
              🏦 Go to Deposit Manager
            </button>
          </div>

          <div style={{ marginTop: '25px' }}>
            <button
              onClick={() => {
                setSuccess('');
                setShowPdfDownload(false);
                setSubmittedOfferingId(null);
                resetForm();
              }}
              style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.15)';
              }}
            >
              ➕ Start New Entry
            </button>
          </div>
        </div>
      </div>
    )}

    {/* CSS Animation for Modal */}
    <style>{`
      @keyframes modalSlideIn {
        from {
          transform: scale(0.8) translateY(-20px);
          opacity: 0;
        }
        to {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }
    `}</style>
    </div>
  );
};

export default DonationEntry;