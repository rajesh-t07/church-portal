import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navigation from './Navigation';
import { StyledComponents, Icons } from '../theme/StyledComponents';
import { churchBranding } from '../theme/churchTheme';
import BibleVerse from './BibleVerse';

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
    <div style={StyledComponents.LoadingContainer}>
      <div style={StyledComponents.LoadingText}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        Loading your dashboard...
      </div>
    </div>
  );

  // Define all dashboard cards
  const allDashboardCards = [
    {
      title: 'Record Offerings',
      description: 'Enter weekly offerings & donations',
      icon: Icons.DollarSign,
      path: '/donations',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stat: `$${stats.monthlyOffering?.toLocaleString() || '0'}`,
      statLabel: 'This Month',
      roles: ['admin', 'treasurer'] // Only admin and treasurer can record offerings
    },
    {
      title: 'Manage Expenses',
      description: 'Review & approve expenses',
      icon: Icons.FileText,
      path: '/admin/expenses',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stat: stats.pendingExpenses || 0,
      statLabel: 'Pending',
      roles: ['admin', 'treasurer'] // Only admin and treasurer can manage expenses
    },
    {
      title: 'Financial Reports',
      description: 'View summaries & analytics',
      icon: Icons.BarChart,
      path: '/reports',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stat: `$${stats.totalDonations?.toLocaleString() || '0'}`,
      statLabel: 'Total YTD',
      roles: ['admin', 'treasurer'] // Only admin and treasurer can view full reports
    },
    {
      title: 'Member Management',
      description: 'Manage member information',
      icon: Icons.Users,
      path: '/donor-management',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      stat: stats.totalDonors || 0,
      statLabel: 'Total Members',
      roles: ['admin'] // Only admin can manage members
    },
    {
      title: 'Submit Expenses',
      description: 'Submit personal expenses',
      icon: Icons.CreditCard,
      path: '/expenses',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      stat: '$0',
      statLabel: 'This Month',
      roles: ['admin', 'treasurer', 'member'] // All users can submit expenses
    },
    {
      title: 'My Reports',
      description: 'View your expense & donation history',
      icon: Icons.FileText,
      path: '/reports',
      color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      stat: 'Available',
      statLabel: 'Personal View',
      roles: ['member'] // Members see limited reports (only their own data)
    },
    {
      title: 'Offering Forms',
      description: 'Alternative offering entry',
      icon: Icons.CheckSquare,
      path: '/offerings',
      color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      stat: 'Available',
      statLabel: 'Ready to Use',
      roles: ['admin', 'treasurer'] // Only admin and treasurer can use offering forms
    }
  ];

  // Filter cards based on user role
  const userRole = user.role?.toLowerCase() || 'member';
  const dashboardCards = allDashboardCards.filter(card => 
    card.roles.includes(userRole)
  );

  return (
    <div style={StyledComponents.PageContainer}>
      {/* Church Header */}
      <div style={StyledComponents.ChurchHeader}>
        <div style={StyledComponents.ChurchHeaderContent}>
          {/* Church Logo and Name */}
          <div style={StyledComponents.ChurchBranding}>
            <div style={StyledComponents.ChurchLogo}>
              Atlanta<br/>Little<br/>Flock
            </div>
            <div style={StyledComponents.ChurchInfo}>
              <h1 style={StyledComponents.ChurchName}>
                {churchBranding.name}
              </h1>
              <p style={StyledComponents.ChurchMotto}>
                {churchBranding.motto}
              </p>
            </div>
          </div>

          {/* User Info and Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right', color: 'white' }}>
              <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                Welcome, {user.name}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#bdc3c7',
                marginTop: '0.25rem'
              }}>
                {user.role === 'admin' ? 'Church Administrator' : user.role === 'treasurer' ? 'Church Treasurer' : 'Church Member'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                ...StyledComponents.ButtonDanger,
                padding: '0.625rem 1.25rem',
                borderRadius: '1.5rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <Icons.LogOut style={{ color: 'white' }} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div style={StyledComponents.ContentWrapper}>
        {/* Welcome Section */}
        <div style={StyledComponents.WelcomeCard}>
          <h2 style={{ 
            margin: '0 0 0.75rem 0', 
            color: '#2c3e50',
            fontSize: '1.75rem',
            fontWeight: '300'
          }}>
            Church Finance Portal
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#7f8c8d',
            fontSize: '1rem',
            lineHeight: '1.5'
          }}>
            Professional financial management for {churchBranding.name}
          </p>
        </div>

        {/* Dashboard Cards */}
        <div style={StyledComponents.DashboardGrid}>
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
              <div 
                style={StyledComponents.DashboardCard}
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
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '1rem' 
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '0.75rem',
                    background: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    <card.icon style={{ color: 'white', width: '24px', height: '24px' }} />
                  </div>
                  <div>
                    <h3 style={{ 
                      margin: 0, 
                      color: '#2c3e50',
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      lineHeight: '1.3'
                    }}>
                      {card.title}
                    </h3>
                    <p style={{ 
                      margin: '0.25rem 0 0 0', 
                      color: '#7f8c8d',
                      fontSize: '0.875rem',
                      lineHeight: '1.4'
                    }}>
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* Card Stats */}
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    marginBottom: '0.25rem'
                  }}>
                    {card.stat}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#95a5a6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '500'
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
                  background: card.color,
                  borderRadius: '0 0 1rem 1rem'
                }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Daily Bible Verse */}
        <BibleVerse />

        {/* Help Section */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '1rem',
          border: '1px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#7f8c8d',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            lineHeight: '1.5'
          }}>
            <Icons.HelpCircle style={{ color: '#667eea' }} />
            Need help? Contact your church administrator or check the help documentation.
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;
