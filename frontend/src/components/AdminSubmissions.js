import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import { StyledComponents } from '../theme/StyledComponents';

const AdminSubmissions = () => {
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending for optimization
  const [yearFilter, setYearFilter] = useState('2025');
  const [allExpenses, setAllExpenses] = useState([]);

  // Helper to parse receipt URLs
  const getReceiptUrls = (expense) => {
    try {
      let urls = [];
      if (!expense.receiptUrls) return [];

      if (Array.isArray(expense.receiptUrls)) {
        urls = expense.receiptUrls;
      } else if (typeof expense.receiptUrls === 'string') {
        const parsed = JSON.parse(expense.receiptUrls);
        urls = Array.isArray(parsed) ? parsed : [];
      }

      // Filter out non-string items to prevent crashes
      return urls.filter(url => typeof url === 'string' && url.length > 0);
    } catch (e) {
      console.warn('Error parsing receipt URLs:', e);
      return [];
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (token && storedUser) {
      setUser(storedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchSubmissions();
    } else {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [selectedUser, statusFilter, yearFilter]);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Build query string for server-side filtering
      const params = {};
      if (selectedUser !== 'all') params.userId = selectedUser;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (yearFilter !== 'all') params.year = yearFilter;

      const response = await axios.get('/api/expenses/submissions', {
        headers: { Authorization: `Bearer ${token}` },
        params // Axios automatically serializes this to ?status=pending&...
      });

      // Data is already filtered by backend
      const filtered = response.data;
      setSubmissions(filtered);

      // Create consolidated expenses list
      const consolidatedExpenses = [];
      filtered.forEach(submission => {
        if (submission.Expenses && submission.Expenses.length > 0) {
          submission.Expenses.forEach(expense => {
            consolidatedExpenses.push({
              ...expense,
              submissionId: submission.id,
              submissionStatus: submission.status,
              submissionDate: submission.submissionDate,
              userName: submission.User?.name || 'Unknown User',
              approvedDate: submission.approvedDate,
              notes: submission.notes
            });
          });
        }
      });

      // Sort by submission date (newest first)
      consolidatedExpenses.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
      setAllExpenses(consolidatedExpenses);

    } catch (error) {
      console.error('Error fetching submissions:', error);
      if (error.response && error.response.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
      } else {
        alert(`Error fetching submissions: ${error.message}`);
      }
    }
  };

  const handleApproveSubmission = async (submissionId, receiptFile) => {
    const formData = new FormData();
    formData.append('submissionId', submissionId);
    if (receiptFile) formData.append('reimbursementReceipt', receiptFile);

    try {
      await axios.post('/api/expenses/approve-submission', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Expense submission approved and reimbursed successfully!');
      fetchSubmissions();
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('❌ Error processing approval');
    }
  };

  const handleRejectSubmission = async (submissionId, reason) => {
    try {
      await axios.post('/api/expenses/reject-submission', { submissionId, reason });
      alert('❌ Expense submission rejected');
      fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('❌ Error rejecting submission');
    }
  };

  const uniqueUsers = [...new Set(submissions.map(s => s.User?.name).filter(Boolean))];
  const availableYears = ['2024', '2025', '2026']; // Add more years as needed

  if (!user) return (
    <div style={StyledComponents.LoadingContainer}>
      <div style={StyledComponents.LoadingText}>Loading...</div>
    </div>
  );

  return (
    <div style={StyledComponents.PageContainer}>
      <Navigation user={user} />
      <div style={StyledComponents.ContentWrapper}>
        <div style={StyledComponents.Card}>
          <h2 style={{
            textAlign: 'center',
            color: '#2c3e50',
            marginBottom: '2rem',
            fontSize: '1.75rem',
            fontWeight: '400'
          }}>
            💼 Treasurer Dashboard - All Expenses Consolidated
          </h2>

          {/* Filter Controls */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '30px',
            padding: '20px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            flexWrap: 'wrap'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by User:</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(userName => (
                  <option key={userName} value={submissions.find(s => s.User?.name === userName)?.userId}>
                    {userName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '120px' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Year:</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '100px' }}
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {allExpenses.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Expenses</div>
            </div>
          </div>

          {/* Consolidated Expenses Table */}
          {allExpenses.length > 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              {/* Table Header */}
              <div style={{
                background: '#f8f9fa',
                borderBottom: '2px solid #dee2e6',
                padding: '15px 0'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 120px 100px 100px 120px 100px 100px 100px 100px 100px',
                  gap: '10px',
                  padding: '0 20px',
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  <div>Sub ID</div>
                  <div>User</div>
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Receipts</div>
                  <div>Description</div>
                  <div>Category</div>
                  <div>Status</div>
                  <div>Approved Date</div>
                  <div>Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {allExpenses.map((expense, index) => (
                  <div
                    key={`${expense.submissionId}-${expense.id}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 120px 100px 100px 120px 100px 100px 100px 100px 100px',
                      gap: '10px',
                      padding: '15px 20px',
                      borderBottom: index < allExpenses.length - 1 ? '1px solid #dee2e6' : 'none',
                      background: index % 2 === 0 ? '#fff' : '#f9f9f9',
                      alignItems: 'center'
                    }}
                  >
                    {/* Submission ID */}
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6c757d' }}>
                      #{expense.submissionId}
                    </div>

                    {/* User Name */}
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {expense.userName}
                    </div>

                    {/* Submission Date */}
                    <div style={{ fontSize: '14px' }}>
                      {new Date(expense.submissionDate).toLocaleDateString()}
                    </div>

                    {/* Amount */}
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                      ${parseFloat(expense.amount).toFixed(2)}
                    </div>

                    {/* Receipts */}
                    <div>
                      {getReceiptUrls(expense).length > 0 ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {getReceiptUrls(expense).map((url, idx) => (
                            <a
                              key={idx}
                              href={url.startsWith('http') ? url : `http://localhost:4000${url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                textDecoration: 'none',
                                fontSize: '16px'
                              }}
                              title="View Receipt"
                            >
                              📄
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#adb5bd' }}>No Receipt</span>
                      )}
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {expense.description}
                    </div>

                    {/* Category */}
                    <div>
                      <span style={{
                        background: '#e9ecef',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#495057'
                      }}>
                        {expense.category}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        background: expense.submissionStatus === 'pending' ? '#ffc107' :
                          expense.submissionStatus === 'approved' ? '#28a745' : '#dc3545',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {expense.submissionStatus.toUpperCase()}
                      </span>
                    </div>

                    {/* Approved Date */}
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {expense.approvedDate ? new Date(expense.approvedDate).toLocaleDateString() : '-'}
                    </div>

                    {/* Actions */}
                    <div>
                      {expense.submissionStatus === 'pending' && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => {
                              if (window.confirm(`Approve submission #${expense.submissionId}?`)) {
                                handleApproveSubmission(expense.submissionId, null);
                              }
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) handleRejectSubmission(expense.submissionId, reason);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            ❌
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6c757d',
              fontSize: '18px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
              No expenses found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSubmissions;