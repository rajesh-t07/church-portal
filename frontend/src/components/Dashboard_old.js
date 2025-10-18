import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalDonors: 0,
    monthlyOffering: 0,
    pendingExpenses: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (token && storedUser) {
      setUser(storedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchDashboardStats();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch basic stats for dashboard
      const response = await axios.get('/api/reports/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  if (!user) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
    </div>
  );

  const dashboardCards = [
    {
      title: 'Record Donations',
      description: 'Enter weekly offerings & donations',
      icon: '💒',
      path: '/donations',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stat: `$${stats.monthlyOffering?.toLocaleString() || '0'}`,
      statLabel: 'This Month'
    },
    {
      title: 'Manage Expenses',
      description: 'Submit & approve expenses',
      icon: '📋',
      path: '/expenses',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stat: stats.pendingExpenses || 0,
      statLabel: 'Pending'
    },
    {
      title: 'View Reports',
      description: 'Financial summaries & analytics',
      icon: '📊',
      path: '/reports',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stat: `$${stats.totalDonations?.toLocaleString() || '0'}`,
      statLabel: 'Total YTD'
    },
    {
      title: 'Donor Management',
      description: 'Manage member information',
      icon: '👥',
      path: '/donors',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      stat: stats.totalDonors || 0,
      statLabel: 'Active Donors'
    },
    {
      title: 'Pastor Gifts',
      description: 'Track special gifts',
      icon: '🎁',
      path: '/pastor-gifts',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      stat: '$0',
      statLabel: 'This Month'
    },
    {
      title: 'Reimbursements',
      description: 'Process reimbursements',
      icon: '💳',
      path: '/reimbursements',
      color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      stat: '3',
      statLabel: 'Pending'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Header with Church Branding */}
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        padding: '20px 0',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Church Logo and Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ⛪
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                color: 'white', 
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Atlanta Little Flock Church
              </h1>
              <p style={{ 
                margin: 0, 
                color: '#bdc3c7', 
                fontSize: '14px',
                fontStyle: 'italic'
              }}>
                Fear Not, little flock
              </p>
            </div>
          </div>

          {/* User Info and Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right', color: 'white' }}>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                Welcome, {user.name}
              </div>
              <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
                {user.role === 'admin' ? 'Church Administrator' : 'User'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Welcome Section */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            margin: '0 0 10px 0', 
            color: '#2c3e50',
            fontSize: '28px',
            fontWeight: '300'
          }}>
            Church Management Portal
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#7f8c8d',
            fontSize: '16px'
          }}>
            Manage donations, expenses, and church finances with ease
          </p>
        </div>

        {/* Dashboard Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '25px',
          marginBottom: '40px'
        }}>
          {dashboardCards.map((card, index) => (
            <Link
              key={index}
              to={card.path}
              style={{
                textDecoration: 'none',
                display: 'block',
                height: '100%'
              }}
            >
              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '25px',
                height: 'calc(100% - 50px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                border: '1px solid #f0f0f0',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginRight: '15px'
                }}>
                  {card.icon}
                </div>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    color: '#2c3e50',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {card.title}
                  </h3>
                  <p style={{ 
                    margin: '2px 0 0 0', 
                    color: '#7f8c8d',
                    fontSize: '14px'
                  }}>
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Card Stats */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginBottom: '5px'
                }}>
                  {card.stat}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#95a5a6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {card.statLabel}
                </div>
              </div>

              {/* Hover indicator */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: card.color
              }} />
            </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: '#2c3e50',
            fontSize: '20px',
            fontWeight: '500'
          }}>
            📈 Quick Overview
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '5px' }}>
                TODAY'S DATE
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#2c3e50' }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '5px' }}>
                SYSTEM STATUS
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#27ae60' }}>
                🟢 All Systems Online
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '5px' }}>
                LAST BACKUP
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#2c3e50' }}>
                💾 {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div style={{
          marginTop: '30px',
          textAlign: 'center',
          padding: '20px',
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#7f8c8d',
            fontSize: '14px'
          }}>
            💡 Need help? Contact your church administrator or check the help documentation.
          </p>
        </div>
      </div>
    </div>
            ⛪ Atlanta Little Flock Church Dashboard
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#666', 
            margin: 0 
          }}>
            Welcome back, <strong>{user.name}</strong>
          </p>
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: user.role === 'admin' ? '#dc3545' : user.role === 'treasurer' ? '#28a745' : '#007bff',
            color: 'white',
            borderRadius: '20px',
            fontSize: '14px',
            marginTop: '10px'
          }}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '25px', 
          marginBottom: '40px' 
        }}>
          <Link to="/expenses" style={{
            display: 'block',
            padding: '25px',
            background: 'linear-gradient(135deg, #007bff, #0056b3)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(0, 123, 255, 0.3)',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0px)'}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>�</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Submit Expenses</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Add your receipts and expenses</div>
          </Link>

          {(user.role === 'admin' || user.role === 'treasurer') && (
            <>
              <Link to="/admin/expenses" style={{
                display: 'block',
                padding: '25px',
                background: 'linear-gradient(135deg, #dc3545, #a71e2a)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 8px 25px rgba(220, 53, 69, 0.3)',
                transition: 'transform 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0px)'}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>�</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Manage Expenses</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Approve and reimburse</div>
              </Link>

              <Link to="/donations" style={{
                display: 'block',
                padding: '25px',
                background: 'linear-gradient(135deg, #28a745, #1e7e34)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 8px 25px rgba(40, 167, 69, 0.3)',
                transition: 'transform 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0px)'}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>💰</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Record Donations</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Weekly offering entry</div>
              </Link>
            </>
          )}

          <Link to="/reports" style={{
            display: 'block',
            padding: '25px',
            background: 'linear-gradient(135deg, #ffc107, #d39e00)',
            color: 'black',
            textDecoration: 'none',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(255, 193, 7, 0.3)',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0px)'}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>View Reports</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Financial summaries</div>
          </Link>
        </div>

        <div style={{ 
          textAlign: 'center',
          padding: '30px',
          background: '#f8f9fa',
          borderRadius: '15px',
          border: '2px dashed #dee2e6'
        }}>
          <p style={{ 
            margin: '0 0 20px 0', 
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Need help? Contact your church administrator or check the help documentation.
          </p>
          <button 
            onClick={handleLogout}
            style={{
              padding: '12px 30px',
              background: 'linear-gradient(135deg, #6c757d, #545b62)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;