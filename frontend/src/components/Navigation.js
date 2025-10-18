import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StyledComponents, Icons } from '../theme/StyledComponents';
import { churchBranding } from '../theme/churchTheme';

const Navigation = ({ user }) => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Icons.Dashboard, roles: ['member', 'treasurer', 'admin'] },
    { path: '/expenses', label: 'Submit Expenses', icon: Icons.CreditCard, roles: ['member', 'treasurer', 'admin'] },
    { path: '/admin/expenses', label: 'Manage Expenses', icon: Icons.FileText, roles: ['treasurer', 'admin'] },
    { path: '/donations', label: 'Record Offerings', icon: Icons.CheckSquare, roles: ['treasurer', 'admin'] },
    { path: '/deposits', label: 'Manage Deposits', icon: Icons.Archive, roles: ['treasurer', 'admin'] },
    { path: '/donor-management', label: 'Manage Members', icon: Icons.Users, roles: ['admin'] },
    { path: '/reports', label: 'Reports', icon: Icons.BarChart, roles: ['treasurer', 'admin'] },
    { path: '/reports', label: 'My Reports', icon: Icons.BarChart, roles: ['member'] }
  ];

  const availableItems = navItems.filter(item => item.roles.includes(user?.role));

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return '#e74c3c';
      case 'treasurer': return '#27ae60';
      default: return '#3498db';
    }
  };

  return (
    <nav style={StyledComponents.Navigation}>
      <div style={StyledComponents.ChurchHeaderContent}>
        {/* Church Logo and Name */}
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={StyledComponents.ChurchBranding}>
            <div style={{
              ...StyledComponents.ChurchLogo,
              background: 'rgba(255,255,255,0.95)',
              fontSize: '12px'
            }}>
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
        </Link>

        {/* Navigation Items */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {availableItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...StyledComponents.NavLink,
                ...(isActive(item.path) ? StyledComponents.NavLinkActive : {}),
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <item.icon style={{ color: 'white', flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* User Info & Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: 'white'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              marginBottom: '0.25rem'
            }}>
              {user?.name}
            </div>
            <div style={{
              ...StyledComponents.StatusBadge,
              fontSize: '0.75rem',
              padding: '0.125rem 0.5rem',
              background: getRoleBadgeColor(user?.role),
              color: 'white',
              border: 'none'
            }}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(231, 76, 60, 0.9)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(192, 57, 43, 0.9)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(231, 76, 60, 0.9)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Icons.LogOut style={{ color: 'white' }} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;