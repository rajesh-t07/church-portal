import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import { StyledComponents } from '../theme/StyledComponents';

const AdminExpenses = () => {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [groupedExpenses, setGroupedExpenses] = useState({});
  const [selectedUser, setSelectedUser] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (token && storedUser) {
      setUser(storedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchExpenses();
    } else {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    groupExpensesByUser();
  }, [expenses, selectedUser, statusFilter]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('/expenses');
      setExpenses(response.data);
    } catch (error) {
      alert('Error fetching expenses');
    }
  };

  const groupExpensesByUser = () => {
    const filtered = expenses.filter(expense => {
      const userMatch = selectedUser === 'all' || expense.userId.toString() === selectedUser;
      const statusMatch = statusFilter === 'all' || expense.status === statusFilter;
      return userMatch && statusMatch;
    });

    const grouped = filtered.reduce((acc, expense) => {
      const userName = expense.User?.name || 'Unknown User';
      if (!acc[userName]) {
        acc[userName] = {
          user: expense.User,
          expenses: [],
          totalAmount: 0,
          pendingCount: 0
        };
      }
      acc[userName].expenses.push(expense);
      acc[userName].totalAmount += parseFloat(expense.amount);
      if (expense.status === 'pending') acc[userName].pendingCount++;
      return acc;
    }, {});

    setGroupedExpenses(grouped);
  };

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
      return [];
    }
  };

  const handleApprove = async (expenseId, receiptFile) => {
    const formData = new FormData();
    formData.append('expenseId', expenseId);
    formData.append('status', 'approved');
    if (receiptFile) formData.append('reimbursementReceipt', receiptFile);

    try {
      await axios.post('/expenses/approve', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Expense approved and reimbursed');
      fetchExpenses();
    } catch (error) {
      alert('Error processing approval');
    }
  };

  const handleReject = async (expenseId, reason) => {
    try {
      await axios.post('/expenses/reject', { expenseId, reason });
      alert('Expense rejected');
      fetchExpenses();
    } catch (error) {
      alert('Error rejecting expense');
    }
  };

  const uniqueUsers = [...new Set(expenses.map(e => e.User?.name).filter(Boolean))];

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
            💼 Treasurer Dashboard - Expense Management
          </h2>

          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '30px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by User:</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={expenses.find(e => e.User?.name === user)?.userId}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {Object.entries(groupedExpenses).map(([userName, data]) => (
            <div key={userName} style={{
              border: '2px solid #dee2e6',
              borderRadius: '10px',
              marginBottom: '30px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#007bff',
                color: 'white',
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0 }}>{userName}</h3>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Total: ${data.totalAmount.toFixed(2)}</strong></div>
                  <div><small>Pending: {data.pendingCount} expenses</small></div>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                {data.expenses.map(expense => (
                  <div key={expense.id} style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px',
                    background: expense.status === 'pending' ? '#fff3cd' :
                      expense.status === 'approved' ? '#d4edda' : '#f8d7da'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                      <div>
                        <strong>Description:</strong> {expense.description}
                      </div>
                      <div>
                        <strong>Amount:</strong> ${expense.amount}
                      </div>
                      <div>
                        <strong>Category:</strong> {expense.category}
                      </div>
                      <div>
                        <strong>Status:</strong>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          marginLeft: '5px',
                          background: expense.status === 'pending' ? '#ffc107' :
                            expense.status === 'approved' ? '#28a745' : '#dc3545',
                          color: 'white'
                        }}>
                          {expense.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <strong>Submitted:</strong> {new Date(expense.submissionDate).toLocaleDateString()}
                    </div>

                    {getReceiptUrls(expense).length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <strong>Receipts:</strong>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                          {getReceiptUrls(expense).map((url, index) => (
                            <a
                              key={index}
                              href={url.startsWith('http') ? url : `http://localhost:4000${url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '5px 10px',
                                background: '#007bff',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                            >
                              Receipt {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {expense.status === 'pending' && (
                      <div style={{
                        display: 'flex',
                        gap: '15px',
                        alignItems: 'center',
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '5px'
                      }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                            Upload Reimbursement Receipt:
                          </label>
                          <input
                            type="file"
                            id={`receipt-${expense.id}`}
                            accept="image/*,.pdf"
                            style={{ fontSize: '14px' }}
                          />
                        </div>

                        <button
                          onClick={() => {
                            const file = document.getElementById(`receipt-${expense.id}`).files[0];
                            if (window.confirm('Approve this expense and mark as reimbursed?')) {
                              handleApprove(expense.id, file);
                            }
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Approve & Reimburse
                        </button>

                        <button
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) handleReject(expense.id, reason);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}

                    {expense.status === 'approved' && expense.reimbursementReceiptUrl && (
                      <div style={{ marginTop: '10px' }}>
                        <strong>Reimbursement Receipt:</strong>
                        <a
                          href={expense.reimbursementReceiptUrl.startsWith('http') ? expense.reimbursementReceiptUrl : `http://localhost:4000${expense.reimbursementReceiptUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: '10px', color: '#007bff' }}
                        >
                          View Receipt
                        </a>
                      </div>
                    )}

                    {expense.notes && (
                      <div style={{ marginTop: '10px', fontStyle: 'italic', color: '#666' }}>
                        <strong>Notes:</strong> {expense.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedExpenses).length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              fontSize: '18px'
            }}>
              No expenses found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExpenses;