import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import { StyledComponents } from '../theme/StyledComponents';

const DonorManagement = () => {
  const [user, setUser] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (token && storedUser) {
      setUser(storedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchDonors();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/donors');
      setDonors(response.data);
    } catch (error) {
      console.error('Error fetching donors:', error);
      setError('Failed to fetch donors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDonor) {
        await axios.put(`/api/donors/${editingDonor.id}`, formData);
        setSuccess('Donor updated successfully!');
      } else {
        await axios.post('/api/donors', formData);
        setSuccess('Donor added successfully!');
      }
      
      resetForm();
      fetchDonors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving donor:', error);
      setError('Failed to save donor');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (donor) => {
    setEditingDonor(donor);
    setFormData({
      firstName: donor.firstName || '',
      lastName: donor.lastName || '',
      email: donor.email || '',
      phone: donor.phone || '',
      address: donor.address || '',
      city: donor.city || '',
      state: donor.state || '',
      zipCode: donor.zipCode || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (donorId) => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      try {
        await axios.delete(`/api/donors/${donorId}`);
        setSuccess('Donor deleted successfully!');
        fetchDonors();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting donor:', error);
        setError('Failed to delete donor');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const syncDonorsFromDonations = async () => {
    if (window.confirm('This will create donor records for everyone who has made donations. Continue?')) {
      try {
        setLoading(true);
        const response = await axios.post('/api/donors/sync-from-donations');
        setSuccess(`${response.data.message} Created: ${response.data.createdCount}, Updated: ${response.data.updatedCount}`);
        fetchDonors();
        setTimeout(() => setSuccess(''), 5000);
      } catch (error) {
        console.error('Error syncing donors:', error);
        setError('Failed to sync donors from donations');
        setTimeout(() => setError(''), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setEditingDonor(null);
    setShowForm(false);
  };

  const filteredDonors = donors.filter(donor =>
    `${donor.firstName} ${donor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (donor.email && donor.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderForm = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '24px', textAlign: 'center' }}>
          {editingDonor ? '✏️ Edit Donor' : '➕ Add New Donor'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                ZIP Code
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: '12px 24px',
                border: '2px solid #6c757d',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#6c757d',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#28a745',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {editingDonor ? 'Update Donor' : 'Add Donor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

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
          <h1 style={{ 
            textAlign: 'center', 
            color: '#2c3e50',
            fontSize: '2rem',
            fontWeight: '400',
            margin: '0 0 2rem 0'
          }}>
            👥 Donor Management
          </h1>

          {/* Success/Error Messages */}
          {success && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '12px 20px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              {success}
            </div>
          )}
          
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px 20px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          {/* Search and Add Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <input
                type="text"
                placeholder="🔍 Search donors by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={syncDonorsFromDonations}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🔄</span> Sync from Donations
              </button>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>➕</span> Add New Donor
              </button>
            </div>
          </div>

          {/* Donors Table */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '50px',
              fontSize: '24px',
              color: '#6c757d'
            }}>
              Loading donors...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                      Name
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                      Contact Info
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                      Address
                    </th>
                    <th style={{ padding: '15px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                      Total Given
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.map((donor, index) => (
                    <tr key={donor.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td style={{ padding: '15px', border: '1px solid #dee2e6' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                          {donor.firstName} {donor.lastName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          Member since: {new Date(donor.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: '15px', border: '1px solid #dee2e6' }}>
                        <div style={{ marginBottom: '5px' }}>
                          📧 {donor.email || 'No email'}
                        </div>
                        <div>
                          📞 {donor.phone || 'No phone'}
                        </div>
                      </td>
                      <td style={{ padding: '15px', border: '1px solid #dee2e6' }}>
                        {donor.address ? (
                          <div>
                            <div>{donor.address}</div>
                            <div>{donor.city}, {donor.state} {donor.zipCode}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d' }}>No address</span>
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '16px' }}>
                        ${donor.totalGiven?.toFixed(2) || '0.00'}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(donor)}
                            style={{
                              backgroundColor: '#007bff',
                              color: 'white',
                              padding: '8px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(donor.id)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              padding: '8px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredDonors.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '50px',
                  fontSize: '18px',
                  color: '#6c757d'
                }}>
                  {searchTerm ? 'No donors found matching your search.' : 'No donors added yet.'}
                </div>
              )}
            </div>
          )}

          {/* Add/Edit Form Modal */}
          {showForm && renderForm()}
        </div>
      </div>
    </div>
  );
};

export default DonorManagement;