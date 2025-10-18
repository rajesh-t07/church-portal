import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import { StyledComponents } from '../theme/StyledComponents';

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
    expenseDate: new Date().toISOString().split('T')[0], // Actual expense date
    comments: '',
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
      expenseDate: new Date().toISOString().split('T')[0],
      comments: '',
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
      
      // Prepare expense data for backend (map to expected format)
      const expensesForSubmission = submittedExpenses.map(expense => ({
        amount: expense.amount,
        description: expense.name + (expense.comments ? ` - ${expense.comments}` : ''), // Combine name and comments
        category: expense.category,
        expenseDate: expense.expenseDate
      }));
      
      // Add expense data array as expected by backend
      formData.append('expenses', JSON.stringify(expensesForSubmission));
      
      // Add receipt files with backend expected naming
      submittedExpenses.forEach((expense, index) => {
        if (expense.receipts && expense.receipts.length > 0) {
          expense.receipts.forEach((file, fileIndex) => {
            formData.append(`receipts_${index}`, file);
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
      setError(error.response?.data?.message || error.response?.data?.error || `Error submitting expenses: ${error.message}`);
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
              💰 Expense Tracker
            </h2>
            <p style={{
              color: '#7f8c8d',
              fontSize: '1rem',
              margin: 0
            }}>
              Submit your expenses for church reimbursement
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
            </div>
          )}

          {/* Input Form Section */}
          <div style={{
            padding: '1.5rem',
            background: '#f8f9fa',
            borderRadius: '0.75rem',
            border: '1px solid #e9ecef',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              margin: '0 0 1.5rem 0',
              color: '#2c3e50',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              Add New Expense
            </h3>

            <div style={StyledComponents.FormGrid}>
              <div style={StyledComponents.FormGroup}>
                <label style={StyledComponents.Label}>
                  Expense Name *
                </label>
                <input
                  type="text"
                  value={currentExpense.name}
                  onChange={(e) => setCurrentExpense({...currentExpense, name: e.target.value})}
                  placeholder="Enter expense name"
                  style={StyledComponents.Input}
                />
              </div>
              
              <div style={StyledComponents.FormGroup}>
                <label style={StyledComponents.Label}>
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentExpense.amount}
                  onChange={(e) => setCurrentExpense({...currentExpense, amount: e.target.value})}
                  placeholder="0.00"
                  style={StyledComponents.Input}
                />
              </div>
              
              <div style={StyledComponents.FormGroup}>
                <label style={StyledComponents.Label}>
                  Category
                </label>
                <select
                  value={currentExpense.category}
                  onChange={(e) => setCurrentExpense({...currentExpense, category: e.target.value})}
                  style={StyledComponents.Select}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div style={StyledComponents.FormGroup}>
                <label style={StyledComponents.Label}>
                  Expense Date *
                </label>
                <input
                  type="date"
                  value={currentExpense.expenseDate}
                  onChange={(e) => setCurrentExpense({...currentExpense, expenseDate: e.target.value})}
                  style={StyledComponents.Input}
                />
              </div>
            </div>
            
            <div style={StyledComponents.FormGroup}>
              <label style={StyledComponents.Label}>
                Comments / Description
              </label>
              <textarea
                value={currentExpense.comments}
                onChange={(e) => setCurrentExpense({...currentExpense, comments: e.target.value})}
                placeholder="Enter any additional details or comments about this expense..."
                rows="3"
                style={StyledComponents.TextArea}
              />
            </div>
            
            <div style={StyledComponents.FormGroup}>
              <label style={StyledComponents.Label}>
                📎 Upload Receipt/Bill
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e.target.files)}
                style={{
                  ...StyledComponents.Input,
                  border: '2px dashed #ced4da',
                  background: 'white'
                }}
              />
              {currentExpense.receipts?.length > 0 && (
                <div style={{
                  ...StyledComponents.StatusSuccess,
                  marginTop: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  ✅ {currentExpense.receipts.length} file(s) selected
                </div>
              )}
            </div>
            
            <div style={StyledComponents.TextCenter}>
              <button 
                type="button" 
                onClick={addExpense}
                style={{
                  ...StyledComponents.ButtonSuccess,
                  fontSize: '1rem',
                  padding: '0.875rem 2rem'
                }}
              >
                ➕ Add Expense
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div style={StyledComponents.MarginBottom}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: '#2c3e50',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              Current Expenses
            </h3>
            
            <table style={StyledComponents.Table}>
              <thead style={StyledComponents.TableHeader}>
                <tr>
                  <th style={StyledComponents.TableHeaderCell}>Expense Name</th>
                  <th style={StyledComponents.TableHeaderCell}>Amount</th>
                  <th style={StyledComponents.TableHeaderCell}>Category</th>
                  <th style={StyledComponents.TableHeaderCell}>Date</th>
                  <th style={StyledComponents.TableHeaderCell}>Comments</th>
                  <th style={StyledComponents.TableHeaderCell}>Receipt</th>
                  <th style={StyledComponents.TableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submittedExpenses.map((expense, index) => (
                  <tr key={expense.id} style={index % 2 === 0 ? StyledComponents.TableRowEven : StyledComponents.TableRowOdd}>
                    <td style={StyledComponents.TableCell}>{expense.name}</td>
                    <td style={StyledComponents.TableCell}>${expense.amount}</td>
                    <td style={StyledComponents.TableCell}>{expense.category}</td>
                    <td style={StyledComponents.TableCell}>{expense.expenseDate}</td>
                    <td style={{
                      ...StyledComponents.TableCell,
                      maxWidth: '200px',
                      wordWrap: 'break-word'
                    }}>
                      {expense.comments || '-'}
                    </td>
                    <td style={{
                      ...StyledComponents.TableCell,
                      textAlign: 'center'
                    }}>
                      {expense.receipts && expense.receipts.length > 0 ? (
                        <div style={StyledComponents.StatusSuccess}>
                          📎 {expense.receipts.length} file(s)
                        </div>
                      ) : (
                        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>No receipt</span>
                      )}
                    </td>
                    <td style={{
                      ...StyledComponents.TableCell,
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => editExpense(expense.id)}
                          style={{
                            ...StyledComponents.ButtonSecondary,
                            ...StyledComponents.ButtonSmall
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          type="button" 
                          onClick={() => deleteExpense(expense.id)}
                          style={{
                            ...StyledComponents.ButtonDanger,
                            ...StyledComponents.ButtonSmall
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {submittedExpenses.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ 
                      ...StyledComponents.TableCell,
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#6c757d',
                      fontStyle: 'italic'
                    }}>
                      No expenses added yet. Use the form above to add expenses.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total and Submit Section */}
          <div style={{
            ...StyledComponents.FlexBetween,
            padding: '1.5rem 0',
            borderTop: '2px solid #e9ecef',
            marginTop: '1rem'
          }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#2c3e50'
            }}>
              Total: ${getTotalAmount()}
            </div>
            <button 
              onClick={handleSubmit}
              disabled={submittedExpenses.length === 0}
              style={{
                ...StyledComponents.Button,
                fontSize: '1rem',
                padding: '1rem 2rem',
                opacity: submittedExpenses.length === 0 ? 0.6 : 1,
                cursor: submittedExpenses.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              💸 Submit All Expenses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;