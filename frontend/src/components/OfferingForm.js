import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import { StyledComponents } from '../theme/StyledComponents';

const OfferingForm = () => {
  const [user, setUser] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checks, setChecks] = useState([{ name: '', checkNumber: '', amount: '' }]);
  const [cash, setCash] = useState([{ denomination: '100', count: '' }]);
  const [total, setTotal] = useState('');
  const [depositSlip, setDepositSlip] = useState(null);
  const [reviewer1, setReviewer1] = useState('');
  const [reviewer2, setReviewer2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submittedOfferingId, setSubmittedOfferingId] = useState(null);

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

  const calculateTotal = () => {
    const checkTotal = checks.reduce((sum, check) => sum + (parseFloat(check.amount) || 0), 0);
    const cashTotal = cash.reduce((sum, c) => sum + ((parseFloat(c.denomination) || 0) * (parseInt(c.count) || 0)), 0);
    return (checkTotal + cashTotal).toFixed(2);
  };

  useEffect(() => {
    setTotal(calculateTotal());
  }, [checks, cash]);

  const downloadOfferingSummaryPdf = async () => {
    if (!submittedOfferingId) return;
    
    try {
      const response = await axios.get(`/offerings/${submittedOfferingId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get the filename from the response headers or create a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'Weekly_Offering_Summary.pdf';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          filename = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error downloading PDF: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('date', date);
    formData.append('checks', JSON.stringify(checks.filter(check => check.name && check.amount)));
    formData.append('cash', JSON.stringify(cash.filter(c => c.denomination && c.count)));
    formData.append('total', total);
    formData.append('reviewer1', reviewer1);
    formData.append('reviewer2', reviewer2);
    if (depositSlip) formData.append('depositSlip', depositSlip);

    try {
      const response = await axios.post('/offerings/submit', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      setSuccess('Offering submitted successfully!');
      setSubmittedOfferingId(response.data.id);
      // Reset form
      setChecks([{ name: '', checkNumber: '', amount: '' }]);
      setCash([{ denomination: '100', count: '' }]);
      setDepositSlip(null);
      setReviewer1('');
      setReviewer2('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting offering');
    }
  };

  if (!user) {
    return (
      <div style={StyledComponents.LoadingContainer}>
        <div style={StyledComponents.LoadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={StyledComponents.PageContainer}>
      <Navigation user={user} />
      <div style={StyledComponents.ContentWrapper}>
        <div style={StyledComponents.Card}>
          {/* Header */}
          <div style={{ ...StyledComponents.TextCenter, marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: '400', 
              color: '#2c3e50',
              margin: '0 0 0.75rem 0'
            }}>
              � Weekly Offering Summary
            </h2>
            <p style={{
              color: '#7f8c8d',
              fontSize: '1rem',
              margin: 0
            }}>
              Enter Sunday offering details for weekly summary report
            </p>
          </div>

          {error && (
            <div style={{
              ...StyledComponents.Alert,
              ...StyledComponents.AlertError
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{
              ...StyledComponents.Alert,
              ...StyledComponents.AlertSuccess
            }}>
              ✅ {success}
              {submittedOfferingId && (
                <div style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={downloadOfferingSummaryPdf}
                    style={{
                      ...StyledComponents.Button,
                      backgroundColor: '#28a745',
                      fontSize: '1rem',
                      padding: '0.75rem 1.5rem',
                      marginRight: '1rem'
                    }}
                  >
                    📄 Download PDF Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      ...StyledComponents.ButtonSecondary,
                      fontSize: '1rem',
                      padding: '0.75rem 1.5rem'
                    }}
                  >
                    🖨️ Print for Manual Filing
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Date Selection */}
            <div style={StyledComponents.FormGroup}>
              <label style={StyledComponents.Label}>
                Offering Date *
              </label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
                style={StyledComponents.Input}
              />
            </div>

            {/* Checks Section */}
            <div style={{
              ...StyledComponents.Card,
              background: '#f8f9fa',
              marginBottom: '2rem'
            }}>
              <h3 style={{ 
                margin: '0 0 1.5rem 0', 
                color: '#2c3e50',
                fontSize: '1.25rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📄 Checks
              </h3>
              
              {checks.map((check, index) => (
                <div key={index} style={{
                  ...StyledComponents.FormGrid,
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={StyledComponents.FormGroup}>
                    <label style={StyledComponents.Label}>Donor Name</label>
                    <input 
                      placeholder="Enter donor name" 
                      value={check.name} 
                      onChange={(e) => {
                        const newChecks = [...checks];
                        newChecks[index].name = e.target.value;
                        setChecks(newChecks);
                      }}
                      style={StyledComponents.Input}
                    />
                  </div>
                  <div style={StyledComponents.FormGroup}>
                    <label style={StyledComponents.Label}>Check Number</label>
                    <input 
                      placeholder="Check #" 
                      value={check.checkNumber} 
                      onChange={(e) => {
                        const newChecks = [...checks];
                        newChecks[index].checkNumber = e.target.value;
                        setChecks(newChecks);
                      }}
                      style={StyledComponents.Input}
                    />
                  </div>
                  <div style={StyledComponents.FormGroup}>
                    <label style={StyledComponents.Label}>Amount</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      value={check.amount} 
                      onChange={(e) => {
                        const newChecks = [...checks];
                        newChecks[index].amount = e.target.value;
                        setChecks(newChecks);
                      }}
                      style={StyledComponents.Input}
                    />
                  </div>
                  {checks.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'end' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          const newChecks = checks.filter((_, i) => i !== index);
                          setChecks(newChecks);
                        }}
                        style={{
                          ...StyledComponents.ButtonDanger,
                          ...StyledComponents.ButtonSmall
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={() => setChecks([...checks, { name: '', checkNumber: '', amount: '' }])}
                style={{
                  ...StyledComponents.ButtonSecondary,
                  width: '100%'
                }}
              >
                ➕ Add Another Check
              </button>
            </div>

            {/* Cash Section */}
            <div style={{
              ...StyledComponents.Card,
              background: '#f8f9fa',
              marginBottom: '2rem'
            }}>
              <h3 style={{ 
                margin: '0 0 1.5rem 0', 
                color: '#2c3e50',
                fontSize: '1.25rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                💵 Cash Denominations
              </h3>
              
              {cash.map((c, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: '1rem',
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e9ecef',
                  alignItems: 'end'
                }}>
                  <div style={StyledComponents.FormGroup}>
                    <label style={StyledComponents.Label}>Denomination</label>
                    <select 
                      value={c.denomination} 
                      onChange={(e) => {
                        const newCash = [...cash];
                        newCash[index].denomination = e.target.value;
                        setCash(newCash);
                      }}
                      style={StyledComponents.Select}
                    >
                      <option value="">Select</option>
                      <option value="100">$100</option>
                      <option value="50">$50</option>
                      <option value="20">$20</option>
                      <option value="10">$10</option>
                      <option value="5">$5</option>
                      <option value="1">$1</option>
                    </select>
                  </div>
                  <div style={StyledComponents.FormGroup}>
                    <label style={StyledComponents.Label}>Count</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={c.count} 
                      onChange={(e) => {
                        const newCash = [...cash];
                        newCash[index].count = e.target.value;
                        setCash(newCash);
                      }}
                      style={StyledComponents.Input}
                    />
                  </div>
                  {cash.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => {
                        const newCash = cash.filter((_, i) => i !== index);
                        setCash(newCash);
                      }}
                      style={{
                        ...StyledComponents.ButtonDanger,
                        ...StyledComponents.ButtonSmall
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={() => setCash([...cash, { denomination: '', count: '' }])}
                style={{
                  ...StyledComponents.ButtonSecondary,
                  width: '100%'
                }}
              >
                ➕ Add Another Denomination
              </button>
            </div>

            {/* Total and Deposit Slip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                ...StyledComponents.Card,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '500' }}>
                  Total Offering
                </h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  ${total}
                </div>
              </div>

              <div style={StyledComponents.FormGroup}>
                <label style={StyledComponents.Label}>
                  📄 Deposit Slip (Optional)
                </label>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={(e) => setDepositSlip(e.target.files[0])}
                  style={StyledComponents.Input}
                />
                {depositSlip && (
                  <div style={{
                    ...StyledComponents.StatusSuccess,
                    marginTop: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    ✅ File selected: {depositSlip.name}
                  </div>
                )}
              </div>
            </div>

            {/* Reviewers Section */}
            <div style={{
              ...StyledComponents.Card,
              background: '#f8f9fa',
              marginBottom: '2rem'
            }}>
              <h3 style={{ 
                margin: '0 0 1.5rem 0', 
                color: '#2c3e50',
                fontSize: '1.25rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ✍️ Offering Reviewers
              </h3>
              <p style={{
                color: '#666',
                fontSize: '0.9rem',
                marginBottom: '1.5rem'
              }}>
                Two people who counted and verified the offering amounts
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem'
              }}>
                <div style={StyledComponents.FormGroup}>
                  <label style={StyledComponents.Label}>
                    First Reviewer *
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter reviewer name" 
                    value={reviewer1}
                    onChange={(e) => setReviewer1(e.target.value)}
                    required
                    style={StyledComponents.Input}
                  />
                </div>
                <div style={StyledComponents.FormGroup}>
                  <label style={StyledComponents.Label}>
                    Second Reviewer *
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter reviewer name" 
                    value={reviewer2}
                    onChange={(e) => setReviewer2(e.target.value)}
                    required
                    style={StyledComponents.Input}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              style={{
                ...StyledComponents.Button,
                width: '100%',
                fontSize: '1.125rem',
                padding: '1rem'
              }}
            >
              � Generate Weekly Offering Summary
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfferingForm;