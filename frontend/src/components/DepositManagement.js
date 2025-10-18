import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import { StyledComponents } from '../theme/StyledComponents';

const DepositManagement = () => {
  const [user, setUser] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showDepositSlip, setShowDepositSlip] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'finalized'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (token && storedUser) {
      setUser(storedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchDeposits();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchDeposits = async () => {
    try {
      const response = await axios.get('/api/offerings/deposits');
      setDeposits(response.data);
      setLoading(false);
    } catch (error) {
      setError('Error loading deposits: ' + error.message);
      setLoading(false);
    }
  };

  // Calculate financial summary
  const calculateFinancialSummary = () => {
    const pending = deposits.filter(d => d.status === 'Offerings Entered - Pending Deposit');
    const completed = deposits.filter(d => d.status === 'Deposit Completed');
    
    const totalPending = pending.reduce((sum, d) => sum + parseFloat(d.finalDeposit || 0), 0);
    const totalCompleted = completed.reduce((sum, d) => sum + parseFloat(d.finalDeposit || 0), 0);
    const totalOfferings = totalPending + totalCompleted;
    
    return {
      totalOfferings,
      totalPending,
      totalCompleted,
      pendingCount: pending.length,
      completedCount: completed.length
    };
  };

  const updateDepositStatus = async (depositId, status, bankSlip = null) => {
    try {
      const formData = new FormData();
      formData.append('status', status);
      if (bankSlip) {
        formData.append('bankDepositSlip', bankSlip);
      }

      await axios.put(`/api/offerings/${depositId}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(`Deposit ${status} successfully!`);
      fetchDeposits();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error updating deposit: ' + error.message);
    }
  };

  const generateDepositSlipHTML = (deposit) => {
    const depositDate = new Date(deposit.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deposit Slip - Atlanta Little Flock Church</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .deposit-container { max-width: 800px; margin: 0 auto; border: 2px solid #2c3e50; }
            .header { text-align: center; padding: 20px; border-bottom: 2px solid #2c3e50; }
            .header h1 { color: #2c3e50; margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .content { padding: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .section { flex: 1; margin-right: 20px; }
            .section:last-child { margin-right: 0; }
            .section h3 { color: #2c3e50; margin: 0 0 10px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .text-right { text-align: right; }
            .reconciliation { margin-top: 20px; border-top: 2px solid #2c3e50; padding-top: 15px; }
            .reconciliation-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-row { border-top: 1px solid #333; padding-top: 5px; font-weight: bold; font-size: 18px; }
            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-finalized { background: #d4edda; color: #155724; }
            @media print {
              body { margin: 0; padding: 20px; }
              @page { margin: 1in; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="deposit-container">
            <div class="header">
              <h1>Atlanta Little Flock Church</h1>
              <p style="font-style: italic;">Fear Not, little flock</p>
              <p>5465 Legacy Parkway, Suite 650, Plano, TX 75024</p>
              <p>1-972-369-6300</p>
            </div>

            <div class="content">
              <div class="info-row">
                <div>
                  <h2 style="color: #2c3e50; margin: 0;">Deposit Slip</h2>
                  <p>Deposit ID: #${deposit.id}</p>
                  <span class="status-badge ${deposit.status === 'finalized' ? 'status-finalized' : 'status-pending'}">
                    ${deposit.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <div style="text-align: right;">
                  <p><strong>Account: Checking (1234)</strong></p>
                  <p>Prepared By: Church Admin</p>
                  <p>Deposit Date: ${depositDate}</p>
                </div>
              </div>

              <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <!-- Cash Section -->
                <div class="section">
                  <h3>Cash</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Verified</th>
                        <th>Denomination</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(() => {
                        let cashRows = '';
                        
                        // Add individual cash donations first
                        let individualCash = [];
                        try {
                          // Handle both parsed arrays and JSON strings
                          if (typeof deposit.individualCashDonations === 'string') {
                            individualCash = JSON.parse(deposit.individualCashDonations);
                          } else if (Array.isArray(deposit.individualCashDonations)) {
                            individualCash = deposit.individualCashDonations;
                          }
                        } catch (e) {
                          console.log('Error parsing individualCashDonations:', e);
                          individualCash = [];
                        }
                        
                        if (individualCash && individualCash.length > 0) {
                          cashRows += individualCash.map(cashDonation => `
                            <tr>
                              <td>☑</td>
                              <td>Cash - ${cashDonation.donorName || 'Anonymous'}</td>
                              <td class="text-right">1</td>
                              <td class="text-right">$${parseFloat(cashDonation.amount || 0).toFixed(2)}</td>
                            </tr>
                          `).join('');
                        }
                        
                        // Add cash denominations
                        if (deposit.cash && deposit.cash.length > 0) {
                          cashRows += deposit.cash.map(item => `
                            <tr>
                              <td>☑</td>
                              <td>${item.denominationName || 'Unknown'} ($${item.denomination})</td>
                              <td class="text-right">${item.count}</td>
                              <td class="text-right">$${(item.denomination * item.count).toFixed(2)}</td>
                            </tr>
                          `).join('');
                        }
                        
                        // If no individual cash donations or denominations, show combined total
                        if (!cashRows && parseFloat(deposit.cashTotal || 0) > 0) {
                          cashRows = `<tr><td>☑</td><td>Offering Plate Cash (Combined Total)</td><td class="text-right">Mixed</td><td class="text-right">$${parseFloat(deposit.cashTotal || 0).toFixed(2)}</td></tr>
                                     <tr><td colspan="4" style="text-align: center; font-size: 11px; color: #666; font-style: italic; padding: 4px;">* Count actual bills/coins and enter above for detailed breakdown</td></tr>`;
                        }
                        
                        return cashRows || '<tr><td colspan="4" style="text-align: center; color: #666;">No cash recorded</td></tr>';
                      })()}
                    </tbody>
                  </table>
                </div>

                <!-- Checks Section -->
                <div class="section">
                  <h3>Checks</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Verified</th>
                        <th>Donor</th>
                        <th>Check Number</th>
                        <th class="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${deposit.checks?.map(check => `
                        <tr>
                          <td>☑</td>
                          <td>${check.name || 'Anonymous'}</td>
                          <td>${check.checkNumber || 'N/A'}</td>
                          <td class="text-right">$${parseFloat(check.amount || 0).toFixed(2)}</td>
                        </tr>
                      `).join('') || '<tr><td colspan="4" style="text-align: center;">No checks recorded</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Reconciliation Section -->
              <div class="reconciliation">
                <h3>Reconciliation</h3>
                <div style="display: flex; justify-content: space-between;">
                  <div style="width: 30%;"><strong>Verified</strong></div>
                  <div style="width: 40%;"><strong>Currency Type</strong></div>
                  <div style="width: 30%; text-align: right;"><strong>Total</strong></div>
                </div>
                <div class="reconciliation-row">
                  <div style="width: 30%;"></div>
                  <div style="width: 40%;">Cash</div>
                  <div style="width: 30%; text-align: right;">$${(deposit.cashTotal || 0).toFixed(2)}</div>
                </div>
                <div class="reconciliation-row">
                  <div style="width: 30%;"></div>
                  <div style="width: 40%;">Checks</div>
                  <div style="width: 30%; text-align: right;">$${(deposit.checksTotal || 0).toFixed(2)}</div>
                </div>
                ${deposit.pastorGift > 0 ? `
                <div class="reconciliation-row" style="color: #dc3545;">
                  <div style="width: 30%;"></div>
                  <div style="width: 40%;">Pastor Gift (Cash Taken)</div>
                  <div style="width: 30%; text-align: right;">-$${deposit.pastorGift.toFixed(2)}</div>
                </div>
                ` : ''}
                <div class="reconciliation-row total-row">
                  <div style="width: 30%;"></div>
                  <div style="width: 40%;">Final Deposit</div>
                  <div style="width: 30%; text-align: right;">$${(deposit.finalDeposit || deposit.total || 0).toFixed(2)}</div>
                </div>
                
                <!-- Amount in Words -->
                <div style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; background-color: #f8f9fa;">
                  <div style="font-weight: bold; margin-bottom: 8px;">Amount in Words:</div>
                  <div style="font-style: italic;">
                    <script>
                      function numberToWords(num) {
                        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
                        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
                        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
                        const thousands = ['', 'thousand', 'million', 'billion'];

                        if (num === 0) return 'zero';

                        function convertHundreds(n) {
                          let result = '';
                          if (n >= 100) {
                            result += ones[Math.floor(n / 100)] + ' hundred ';
                            n %= 100;
                          }
                          if (n >= 20) {
                            result += tens[Math.floor(n / 10)] + ' ';
                            n %= 10;
                          } else if (n >= 10) {
                            result += teens[n - 10] + ' ';
                            return result;
                          }
                          if (n > 0) {
                            result += ones[n] + ' ';
                          }
                          return result;
                        }

                        const parts = [];
                        let groupIndex = 0;
                        
                        while (num > 0) {
                          if (num % 1000 !== 0) {
                            parts.unshift(convertHundreds(num % 1000) + thousands[groupIndex]);
                          }
                          num = Math.floor(num / 1000);
                          groupIndex++;
                        }
                        
                        return parts.join(' ').trim();
                      }
                      
                      const finalAmount = ${(deposit.finalDeposit || deposit.total || 0).toFixed(2)};
                      const dollars = Math.floor(finalAmount);
                      const cents = Math.round((finalAmount - dollars) * 100);
                      const amountInWords = numberToWords(dollars).toUpperCase() + ' DOLLARS';
                      const centWords = cents > 0 ? ' AND ' + cents + '/100' : ' AND 00/100';
                      document.write(amountInWords + centWords);
                    </script>
                  </div>
                </div>
                
                <!-- Signature Section -->
                <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                  <div style="width: 45%;">
                    <div style="border-bottom: 1px solid #333; margin-bottom: 5px; height: 20px;"></div>
                    <div style="font-size: 12px;">Prepared by / Date</div>
                  </div>
                  <div style="width: 45%;">
                    <div style="border-bottom: 1px solid #333; margin-bottom: 5px; height: 20px;"></div>
                    <div style="font-size: 12px;">Bank Teller / Date</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
              🖨️ Print Deposit Slip
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
      </html>
    `;
  };

  const printDepositSlip = (deposit) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateDepositSlipHTML(deposit));
    printWindow.document.close();
  };

  const filteredDeposits = deposits.filter(deposit => {
    if (filter === 'all') return true;
    return deposit.status === filter;
  });

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
              🏦 Deposit Management
            </h2>
            <p style={{
              color: '#7f8c8d',
              fontSize: '1rem',
              margin: 0
            }}>
              View, print, and manage weekly offering deposit slips
            </p>
          </div>

          {/* Financial Summary Dashboard */}
          {!loading && deposits.length > 0 && (() => {
            const summary = calculateFinancialSummary();
            return (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '15px',
                padding: '2rem',
                color: 'white',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.5rem',
                  fontWeight: '600'
                }}>
                  📊 Financial Overview
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                      Total Offerings Entered
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      ${summary.totalOfferings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                      {summary.pendingCount + summary.completedCount} entries
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255,193,7,0.2)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    border: '1px solid rgba(255,193,7,0.3)'
                  }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                      ⏳ Awaiting Bank Deposit
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffeaa7' }}>
                      ${summary.totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                      {summary.pendingCount} pending {summary.pendingCount === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(40,167,69,0.2)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    border: '1px solid rgba(40,167,69,0.3)'
                  }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                      ✅ Successfully Deposited
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00b894' }}>
                      ${summary.totalCompleted.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                      {summary.completedCount} completed {summary.completedCount === 1 ? 'deposit' : 'deposits'}
                    </div>
                  </div>
                </div>

                {summary.pendingCount > 0 && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ffeaa7'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      💡 Leadership Note:
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                      {summary.pendingCount} offering {summary.pendingCount === 1 ? 'entry' : 'entries'} totaling ${summary.totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })} ready for bank deposit
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {error && (
            <div style={{
              ...StyledComponents.Alert,
              ...StyledComponents.AlertError
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              ...StyledComponents.Alert,
              ...StyledComponents.AlertSuccess
            }}>
              {success}
            </div>
          )}

          {/* Filter Controls */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={StyledComponents.FormGroup}>
              <label style={StyledComponents.Label}>Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={StyledComponents.Select}
              >
                <option value="all">All Deposits</option>
                <option value="pending">Pending Approval</option>
                <option value="finalized">Finalized</option>
              </select>
            </div>
            <button
              onClick={fetchDeposits}
              style={{
                ...StyledComponents.ButtonSecondary,
                alignSelf: 'end'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Deposits List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1.125rem', color: '#6c757d' }}>Loading deposits...</div>
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'white',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦</div>
              <div style={{ fontSize: '1.25rem', color: '#2c3e50', marginBottom: '1rem', fontWeight: '600' }}>
                No Offering Deposits Yet
              </div>
              <div style={{ color: '#6c757d', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
                {filter === 'all' 
                  ? 'No offering entries have been created yet. Once offerings are entered on Sundays, they will appear here for deposit management.'
                  : `No ${filter} deposits found. Try changing the filter or check back after Sunday offerings are entered.`
                }
              </div>
              <div style={{ 
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}>
                💡 <strong>For Leadership:</strong> This page shows real-time financial status from offering entry to bank deposit completion.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={StyledComponents.Table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Deposit ID</th>
                    <th>Cash Total</th>
                    <th>Checks Total</th>
                    <th>Pastor Gift</th>
                    <th>Final Deposit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.map(deposit => (
                    <tr key={deposit.id}>
                      <td>
                        {new Date(deposit.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td>#{deposit.id}</td>
                      <td style={{ textAlign: 'right' }}>
                        ${(deposit.cashTotal || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        ${(deposit.checksTotal || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', color: deposit.pastorGift > 0 ? '#dc3545' : '#6c757d' }}>
                        {deposit.pastorGift > 0 ? `-$${deposit.pastorGift.toFixed(2)}` : '$0.00'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ${(deposit.finalDeposit || deposit.total || 0).toFixed(2)}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          ...(deposit.status === 'finalized' 
                            ? { background: '#d4edda', color: '#155724' }
                            : { background: '#fff3cd', color: '#856404' }
                          )
                        }}>
                          {deposit.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => printDepositSlip(deposit)}
                            style={{
                              ...StyledComponents.ButtonSecondary,
                              ...StyledComponents.ButtonSmall
                            }}
                            title="Print Deposit Slip"
                          >
                            🖨️
                          </button>
                          
                          {deposit.status !== 'finalized' && (
                            <>
                              <button
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*,.pdf';
                                  input.onchange = (e) => {
                                    if (e.target.files[0]) {
                                      updateDepositStatus(deposit.id, 'finalized', e.target.files[0]);
                                    }
                                  };
                                  input.click();
                                }}
                                style={{
                                  ...StyledComponents.Button,
                                  ...StyledComponents.ButtonSmall
                                }}
                                title="Upload Bank Slip & Finalize"
                              >
                                ✅ Finalize
                              </button>
                            </>
                          )}
                          
                          {deposit.depositSlipUrl && (
                            <button
                              onClick={() => window.open(deposit.depositSlipUrl, '_blank')}
                              style={{
                                ...StyledComponents.ButtonSecondary,
                                ...StyledComponents.ButtonSmall
                              }}
                              title="View Bank Deposit Slip"
                            >
                              📄
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositManagement;