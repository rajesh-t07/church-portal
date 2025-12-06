import React, { useState } from 'react';
import axios from 'axios';
import { StyledComponents } from '../theme/StyledComponents';
import { churchBranding } from '../theme/churchTheme';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(endpoint, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/';
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      ...StyledComponents.PageContainer,
      ...StyledComponents.FlexCenter
    }}>
      <div style={{
        ...StyledComponents.Card,
        width: '420px',
        maxWidth: '90vw',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Church Branding Header */}
        <div style={{
          marginBottom: '2rem',
          padding: '1rem 0',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div style={{
            ...StyledComponents.FlexCenter,
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              marginBottom: '1rem',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
            }}>
              {churchBranding.logo}
            </div>
          </div>
          <h1 style={{
            margin: '0 0 0.5rem 0',
            color: '#2c3e50',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            {churchBranding.name}
          </h1>
          <p style={{
            margin: '0 0 1rem 0',
            color: '#7f8c8d',
            fontSize: '0.875rem',
            fontStyle: 'italic'
          }}>
            {churchBranding.motto}
          </p>
        </div>

        {/* Login/Register Form */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            marginBottom: '1.5rem',
            color: '#2c3e50',
            fontSize: '1.25rem',
            fontWeight: '500'
          }}>
            {isLogin ? 'Welcome Back' : 'Join Our Community'}
          </h2>

          {error && (
            <div style={{
              ...StyledComponents.Alert,
              ...StyledComponents.AlertError,
              textAlign: 'left',
              marginBottom: '1rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={StyledComponents.FormGroup}>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    ...StyledComponents.Input,
                    fontSize: '1rem',
                    padding: '0.875rem 1rem'
                  }}
                />
              </div>
            )}

            <div style={StyledComponents.FormGroup}>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  ...StyledComponents.Input,
                  fontSize: '1rem',
                  padding: '0.875rem 1rem'
                }}
              />
            </div>

            <div style={StyledComponents.FormGroup}>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  ...StyledComponents.Input,
                  fontSize: '1rem',
                  padding: '0.875rem 1rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...StyledComponents.Button,
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                marginTop: '0.5rem',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Toggle Button */}
        <div style={{
          paddingTop: '1rem',
          borderTop: '1px solid #f0f0f0'
        }}>
          <p style={{
            margin: '0 0 0.75rem 0',
            color: '#7f8c8d',
            fontSize: '0.875rem'
          }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ name: '', email: '', password: '' });
            }}
            style={{
              ...StyledComponents.ButtonSecondary,
              fontSize: '0.875rem',
              padding: '0.5rem 1rem'
            }}
          >
            {isLogin ? 'Create New Account' : 'Sign In Instead'}
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f0f0f0',
          color: '#95a5a6',
          fontSize: '0.75rem'
        }}>
          <p style={{ margin: 0 }}>
            Secure Church Financial Management Portal
          </p>
        </div>
      </div>

      {/* CSS Animation for loading spinner */}
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

export default Login;