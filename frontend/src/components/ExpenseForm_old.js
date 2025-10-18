import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './Navigation';

const ExpenseForm = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submittedExpenses, setSubmittedExpenses] = useState([]);
  
  // Current form inputs
  const [currentExpense, setCurrentExpense] = useState({
    name: '',
    amount: '',
    category: 'General',
    date: new Date().toISOString().split('T')[0],
    receipts: []
  });

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

  const categories = ['General', 'Travel', 'Food', 'Transport', 'Office Supplies', 'Equipment', 'Utilities', 'Maintenance', 'Ministry', 'Other'];

  const addExpense = () => {
    if (!currentExpense.name || !currentExpense.amount) {
      setError('Please fill in expense name and amount');
      return;
    }
    
    const newExpense = {
      ...currentExpense,
      id: Date.now(),
      amount: parseFloat(currentExpense.amount).toFixed(2)
    };
    
    setSubmittedExpenses([...submittedExpenses, newExpense]);
    setCurrentExpense({
      name: '',
      amount: '',
      category: 'General',
      date: new Date().toISOString().split('T')[0],
      receipts: []
    });
    setError('');
  };

  const editExpense = (id) => {
    const expense = submittedExpenses.find(e => e.id === id);
    setCurrentExpense(expense);
    setSubmittedExpenses(submittedExpenses.filter(e => e.id !== id));
  };

  const deleteExpense = (id) => {
    setSubmittedExpenses(submittedExpenses.filter(e => e.id !== id));
  };

  const handleFileChange = (files) => {
    setCurrentExpense({
      ...currentExpense,
      receipts: Array.from(files)
    });
  };

  const getTotalAmount = () => {
    return submittedExpenses.reduce((total, expense) => total + parseFloat(expense.amount), 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submittedExpenses.length === 0) {
      setError('Please add at least one expense');
      return;
    }

    try {
      setError('');
      const formData = new FormData();
      
      // Add expense data
      formData.append('expenseData', JSON.stringify(submittedExpenses));
      
      // Add all receipt files
      submittedExpenses.forEach((expense, index) => {
        if (expense.receipts && expense.receipts.length > 0) {
          expense.receipts.forEach((file, fileIndex) => {
            formData.append(`receipts_${index}_${fileIndex}`, file);
          });
        }
      });

      const response = await axios.post('/api/expenses/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Expenses submitted successfully!');
      setSubmittedExpenses([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error submitting expenses:', error);
      setError(error.response?.data?.message || 'Error submitting expenses. Please try again.');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Navigation user={user} />
      
              <div style={{
          maxWidth: '1600px', // Increased from 1400px to accommodate wider table
          margin: '0 auto',
          padding: '20px'
        }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #007bff, #0056b3)',
          color: 'white',
          padding: '30px',
          borderRadius: '15px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0, 123, 255, 0.3)'
        }}>
          <h1 style={{ 
            margin: '0 0 15px 0',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            💰 Submit Expenses
          </h1>
          <p style={{ 
            margin: 0,
            fontSize: '18px',
            opacity: 0.9
          }}>
            Add all related expenses for approval and reimbursement
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Info Section */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #28a745, #20c997)',
              color: 'white',
              padding: '15px 20px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{ fontSize: '24px' }}>💡</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Smart Tip</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Add all related expenses for your submission. They will be grouped together for approval and reimbursement as one unit.
                </div>
              </div>
            </div>
          </div>

          {/* Excel-like Expense Table - Full Width */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: '25px',
            width: '100%' // Ensure full width
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #007bff, #0056b3)',
              color: 'white',
              padding: '20px 25px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%' // Full width header
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                📋 Expense Details
              </h3>
              <button 
                type="button" 
                onClick={addExpenseRow} 
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.3)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ➕ Add Row
              </button>
            </div>

            {/* Excel-like Table - Full Width */}
            <div style={{ 
              padding: '0',
              width: '100%',
              overflowX: 'auto' // Add back horizontal scroll for very small screens
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: '1100px' // Ensure minimum width for all columns
              }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ 
                      padding: '15px 10px', 
                      textAlign: 'center', 
                      fontWeight: 'bold', 
                      color: '#495057', 
                      fontSize: '14px',
                      width: '60px',
                      borderRight: '1px solid #dee2e6'
                    }}>#</th>
                    <th style={{ 
                      padding: '15px 10px', 
                      textAlign: 'left', 
                      fontWeight: 'bold', 
                      color: '#495057', 
                      fontSize: '14px',
                      width: '140px',
                      borderRight: '1px solid #dee2e6'
                    }}>💵 Amount ($)</th>
                    <th style={{ 
                      padding: '15px 10px', 
                      textAlign: 'left', 
                      fontWeight: 'bold', 
                      color: '#495057', 
                      fontSize: '14px',
                      width: '150px',
                      borderRight: '1px solid #dee2e6'
                    }}>📂 Category</th>
                    <th style={{ 
                      padding: '15px 10px', 
                      textAlign: 'left', 
                      fontWeight: 'bold', 
                      color: '#495057', 
                      fontSize: '14px',
                      width: '400px',
                      borderRight: '1px solid #dee2e6'
                    }}>📝 Description</th>
                    <th style={{ 
                      padding: '15px 10px', 
                      textAlign: 'left', 
                      fontWeight: 'bold', 
                      color: '#495057', 
                      fontSize: '14px',
                      width: '220px',
                      borderRight: '1px solid #dee2e6'
                    }}>📎 Receipts</th>
                    <th style={{ 
                      padding: '15px 10px', 
                      textAlign: 'center', 
                      fontWeight: 'bold', 
                      color: '#495057', 
                      fontSize: '14px',
                      width: '100px'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={index} style={{ 
                      borderBottom: index < expenses.length - 1 ? '1px solid #dee2e6' : 'none',
                      background: index % 2 === 0 ? '#fff' : '#f8f9fa',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e3f2fd'}
                    onMouseOut={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#f8f9fa'}
                    >
                      {/* Row Number */}
                      <td style={{ 
                        padding: '12px 10px', 
                        fontWeight: 'bold', 
                        color: '#6c757d', 
                        fontSize: '16px',
                        textAlign: 'center',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        {index + 1}
                      </td>
                      
                      {/* Amount */}
                      <td style={{ padding: '12px 10px', borderRight: '1px solid #dee2e6' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={expense.amount}
                          onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                          required
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '2px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#007bff'}
                          onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                        />
                      </td>
                      
                      {/* Category */}
                      <td style={{ padding: '12px 10px', borderRight: '1px solid #dee2e6' }}>
                        <select
                          value={expense.category}
                          onChange={(e) => updateExpense(index, 'category', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '2px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '15px',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box',
                            background: 'white'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#007bff'}
                          onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      
                      {/* Description - Much Wider */}
                      <td style={{ padding: '12px 10px', borderRight: '1px solid #dee2e6' }}>
                        <input
                          type="text"
                          value={expense.description}
                          onChange={(e) => updateExpense(index, 'description', e.target.value)}
                          required
                          placeholder="Enter detailed expense description..."
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '2px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '15px',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#007bff'}
                          onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                        />
                      </td>
                      
                      {/* Receipts */}
                      <td style={{ padding: '12px 10px', borderRight: '1px solid #dee2e6' }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(index, e.target.files)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '2px solid #ced4da',
                              borderRadius: '6px',
                              fontSize: '13px',
                              transition: 'border-color 0.2s ease',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#007bff'}
                            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                          />
                          {expense.receipts.length > 0 && (
                            <div style={{ 
                              marginTop: '4px',
                              padding: '3px 6px',
                              background: '#d4edda',
                              border: '1px solid #c3e6cb',
                              borderRadius: '4px',
                              color: '#155724',
                              fontSize: '11px',
                              textAlign: 'center',
                              fontWeight: 'bold'
                            }}>
                              ✅ {expense.receipts.length} file(s)
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        {expenses.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeExpenseRow(index)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#c82333';
                              e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = '#dc3545';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        
        <div style={{
          background: '#e9ecef',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📋 Submission Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', textAlign: 'center' }}>
            <div style={{ 
              background: 'white', 
              padding: '15px', 
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {expenses.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Expenses</div>
            </div>
            <div style={{ 
              background: 'white', 
              padding: '15px', 
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                ${getTotalAmount()}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Amount</div>
            </div>
            <div style={{ 
              background: 'white', 
              padding: '15px', 
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {expenses.reduce((total, exp) => total + exp.receipts.length, 0)}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Receipts</div>
            </div>
            <div style={{ 
              background: 'white', 
              padding: '15px', 
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
                {new Date().toLocaleDateString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Submission Date</div>
            </div>
          </div>
        </div>
        
        <button type="submit" style={{
          width: '100%',
          padding: '18px',
          background: 'linear-gradient(135deg, #28a745, #20c997)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          💾 Submit All Expenses (${getTotalAmount()})
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;