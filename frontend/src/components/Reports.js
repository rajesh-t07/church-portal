import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './Navigation';
import { StyledComponents } from '../theme/StyledComponents';

const Reports = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('offerings');
  
  // Dashboard year selection (separate from date range filters)
  const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear());
  
  // Date range for filtered reports (monthly/weekly tabs)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  
  // Yearly dashboard summary
  const [yearlyDashboardData, setYearlyDashboardData] = useState({
    totalOfferings: 0,
    cashOfferings: 0, 
    checkOfferings: 0,
    totalExpensesReimbursed: 0,
    totalDirectChurchExpenses: 0,
    netChurchIncome: 0,
    offeringCount: 0
  });
  
  // State for different report types
  const [donationData, setDonationData] = useState({
    donations: [],
    summary: { totalAmount: 0, cashAmount: 0, checkAmount: 0, donationCount: 0, donorCount: 0 }
  });
  const [memberDonationYear, setMemberDonationYear] = useState(new Date().getFullYear());
  const [expenseData, setExpenseData] = useState({
    expenses: [],
    summary: { totalAmount: 0, pendingCount: 0, reimbursedCount: 0 }
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [donorData, setDonorData] = useState([]);
  const [monthlyFinancialData, setMonthlyFinancialData] = useState({
    period: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
    summary: {},
    details: {}
  });
  const [pastorGiftWeek, setPastorGiftWeek] = useState('');
  const [pastorGiftAmount, setPastorGiftAmount] = useState('');
  
  // New report states
  const [individualDonorReports, setIndividualDonorReports] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState('');
  const [availableDonors, setAvailableDonors] = useState([]);
  const [individualExpenseReports, setIndividualExpenseReports] = useState([]);
  const [expenseCategoryReports, setExpenseCategoryReports] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [summary, setSummary] = useState({
    totalReimbursable: 0,
    totalDirect: 0
  });

  // State for enhanced offering details view
  const [offeringFilters, setOfferingFilters] = useState({
    year: new Date().getFullYear(), // Independent year for offering details
    month: '', // Empty means all months
    week: '',
    paymentMethod: '', // Empty means all methods
    donationType: '', // Empty means all types
    searchTerm: ''
  });
  const [offeringView, setOfferingView] = useState('monthly'); // 'monthly', 'weekly', 'flat'
  const [offeringSortBy, setOfferingSortBy] = useState('date'); // 'date', 'amount', 'donor'
  const [offeringSortOrder, setOfferingSortOrder] = useState('desc'); // 'asc', 'desc'
  const [offeringCurrentPage, setOfferingCurrentPage] = useState(1);
  const [offeringPageSize, setOfferingPageSize] = useState(25);
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [showAllSessions, setShowAllSessions] = useState(false);

  // Individual expense report states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [expenseYear, setExpenseYear] = useState(new Date().getFullYear().toString());
  const [userExpenseData, setUserExpenseData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingExpenseData, setLoadingExpenseData] = useState(false);

  // Enhanced offering details with summary cards, filtering, and grouping

  // Helper function to get category colors
  const getCategoryColor = (category) => {
    const colors = {
      'food': '#dc3545',
      'travel': '#007bff', 
      'amazon': '#fd7e14',
      'hostel': '#6f42c1',
      'rent': '#28a745',
      'utilities': '#17a2b8',
      'supplies': '#6c757d',
      'other': '#343a40'
    };
    return colors[category?.toLowerCase()] || '#6c757d';
  };

  // Check if user is admin/treasurer
  const isAdmin = user?.role === 'admin' || user?.role === 'treasurer';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (token && storedUser) {
      setUser(storedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAllReports();
      fetchAvailableDonors();
    } else {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllReports();
    }
  }, [dateRange, user]);

  // Calculate expense summary when expense data changes
  useEffect(() => {
    if (expenseData.expenses && expenseData.expenses.length > 0) {
      const totalReimbursable = expenseData.expenses
        .filter(expense => expense.submissionId) // Has submissionId = reimbursable
        .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      
      const totalDirect = expenseData.expenses
        .filter(expense => !expense.submissionId) // No submissionId = direct
        .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      
      setSummary({
        totalReimbursable,
        totalDirect
      });
    }
  }, [expenseData.expenses]);

  // Fetch monthly financial data when tab becomes active
  useEffect(() => {
    if (activeTab === 'monthly-financial' && user) {
      fetchMonthlyFinancialReport(2025, 10);
    }
  }, [activeTab, user]);

  // Fetch yearly dashboard data when year changes
  useEffect(() => {
    console.log(`useEffect triggered - user: ${!!user}, dashboardYear: ${dashboardYear}`);
    if (user) {
      console.log(`Calling fetchYearlyDashboard(${dashboardYear})`);
      fetchYearlyDashboard(dashboardYear);
      // Removed fetchDonationReport() - now independent
    }
  }, [dashboardYear, user]);

  // Fetch offering details data when offering filters year changes (INDEPENDENT)
  useEffect(() => {
    if (user && offeringFilters.year) {
      fetchDonationReport();
    }
  }, [offeringFilters.year, user]);

  // Initial fetch for offering details when user is set
  useEffect(() => {
    if (user && offeringFilters.year) {
      fetchDonationReport();
    }
  }, [user]); // Only runs when user changes

  // Sync offering filters year with dashboard year - REMOVED FOR INDEPENDENCE
  // useEffect(() => {
  //   setOfferingFilters(prev => ({
  //     ...prev,
  //     year: dashboardYear
  //   }));
  // }, [dashboardYear]);

  // Load all users for individual expense reports dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      setLoadingUsers(true);
      try {
        const response = await fetch('/api/reports/users', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [user]);

  // Fetch individual user expense data
  useEffect(() => {
    const fetchUserExpenseData = async () => {
      if (!selectedUserId || !user) return;
      
      setLoadingExpenseData(true);
      try {
        const response = await fetch(`/api/reports/individual-expense/${selectedUserId}?year=${expenseYear}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserExpenseData(data);
        } else {
          console.error('Failed to fetch user expense data');
          setUserExpenseData(null);
        }
      } catch (error) {
        console.error('Error fetching user expense data:', error);
        setUserExpenseData(null);
      } finally {
        setLoadingExpenseData(false);
      }
    };

    fetchUserExpenseData();
  }, [selectedUserId, expenseYear, user]);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      await Promise.all([
        // fetchDonationReport(), // Now independent - triggered by offering filters
        fetchExpenseReport(),
        fetchWeeklyReport(),
        fetchDonorReport(),
        fetchMonthlyFinancialReport(2025, 10),
        fetchYearlyDashboard(dashboardYear) // Use dashboardYear for dashboard only
      ]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationReport = async () => {
    try {
      const endpoint = isAdmin ? '/api/reports/donations' : '/api/reports/my-donations';
      
      // Use offering filters year for data fetching (INDEPENDENT from dashboard year)
      const startDate = `${offeringFilters.year}-01-01`;
      const endDate = `${offeringFilters.year}-12-31`;
      
      const response = await axios.get(endpoint, {
        params: { startDate, endDate }
      });
      setDonationData(response.data);
    } catch (error) {
      console.error('Error fetching donation report:', error);
    }
  };

  const fetchExpenseReport = async () => {
    try {
      const endpoint = isAdmin ? '/api/reports/expenses' : '/api/reports/my-expenses';
      const response = await axios.get(endpoint, {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate }
      });
      setExpenseData(response.data);
    } catch (error) {
      console.error('Error fetching expense report:', error);
    }
  };

  const fetchWeeklyReport = async () => {
    try {
      const response = await axios.get('/api/reports/weekly', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate }
      });
      setWeeklyData(response.data);
    } catch (error) {
      console.error('Error fetching weekly report:', error);
    }
  };

  const fetchDonorReport = async () => {
    try {
      const response = await axios.get('/api/donors');
      setDonorData(response.data);
    } catch (error) {
      console.error('Error fetching donor report:', error);
    }
  };

  const fetchMonthlyFinancialReport = async (year = 2025, month = new Date().getMonth() + 1) => {
    try {
      const response = await axios.get('/api/reports/monthly', {
        params: { year, month }
      });
      setMonthlyFinancialData(response.data);
    } catch (error) {
      console.error('Error fetching monthly financial report:', error);
    }
  };

  // Fetch yearly dashboard summary
  const fetchYearlyDashboard = async (year = new Date().getFullYear()) => {
    try {
      console.log(`Fetching yearly dashboard for year: ${year}`);
      const response = await axios.get('/api/reports/yearly-dashboard', {
        params: { year }
      });
      console.log('Yearly dashboard response:', response.data);
      setYearlyDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching yearly dashboard:', error);
    }
  };

  // Fetch available donors for individual reports
  const fetchAvailableDonors = async () => {
    try {
      // Get all individual donor reports from multiple years to capture all donors
      const currentYear = new Date().getFullYear();
      const years = [currentYear, currentYear - 1, currentYear - 2]; // Current year and 2 previous years
      
      console.log('Fetching donors for years:', years);
      const donorMap = new Map();
      
      // Fetch data from multiple years
      for (const year of years) {
        try {
          console.log(`Fetching donors for year ${year}...`);
          const response = await axios.get('/api/reports/individual-donors', {
            params: { year }
          });
          
          console.log(`Year ${year} response:`, response.data);
          
          if (response.data && typeof response.data === 'object') {
            Object.values(response.data).forEach(report => {
              console.log('Processing report:', report);
              
              if (report.donorId && !donorMap.has(report.donorId)) {
                donorMap.set(report.donorId, {
                  id: report.donorId,
                  firstName: report.donorInfo?.firstName || report.donorName.split(' ')[0] || 'Unknown',
                  lastName: report.donorInfo?.lastName || report.donorName.split(' ').slice(1).join(' ') || ''
                });
              } else if (!report.donorId && report.donorName && !donorMap.has(report.donorName)) {
                // Handle donors without IDs (name-only donations)
                const nameParts = report.donorName.split(' ');
                donorMap.set(report.donorName, {
                  id: report.donorName, // Use name as ID for name-only donors
                  firstName: nameParts[0] || 'Unknown',
                  lastName: nameParts.slice(1).join(' ') || ''
                });
              }
            });
          }
        } catch (yearError) {
          console.log(`No data for year ${year}:`, yearError.message);
        }
      }
      
      const donorsList = Array.from(donorMap.values()).sort((a, b) => 
        (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName)
      );
      
      console.log('Final donors list:', donorsList);
      setAvailableDonors(donorsList);
      
      // If no donors found, try fallback
      if (donorsList.length === 0) {
        console.log('No donors found in reports, trying fallback...');
        throw new Error('No donors found in reports');
      }
      
    } catch (error) {
      console.error('Error fetching donors:', error);
      // Fallback to regular donors endpoint
      try {
        console.log('Using fallback donors endpoint...');
        const fallbackResponse = await axios.get('/api/donors');
        console.log('Fallback response:', fallbackResponse.data);
        setAvailableDonors(fallbackResponse.data);
      } catch (fallbackError) {
        console.error('Fallback donors fetch also failed:', fallbackError);
      }
    }
  };

  // Fetch individual donor reports
  const fetchIndividualDonorReports = async () => {
    if (!selectedDonor) {
      alert('Please select a donor first');
      return;
    }

    try {
      const response = await axios.get(`/api/reports/individual-donor/${selectedDonor}`, {
        params: { year: selectedYear }
      });
      setIndividualDonorReports(response.data);
    } catch (error) {
      console.error('Error fetching individual donor reports:', error);
      alert('Error fetching donor reports');
    }
  };

  const addPastorGift = async () => {
    try {
      if (!pastorGiftWeek || !pastorGiftAmount) {
        alert('Please enter both week date and amount');
        return;
      }

      await axios.post('/api/pastor-gifts', {
        weekDate: pastorGiftWeek,
        amount: parseFloat(pastorGiftAmount),
        description: 'Pastor gift entry',
        takenFrom: 'cash'
      });

      // Reset form
      setPastorGiftWeek('');
      setPastorGiftAmount('');
      
      // Refresh weekly data
      fetchWeeklyReport();
      
      alert('Pastor gift added successfully!');
    } catch (error) {
      console.error('Error adding pastor gift:', error);
      alert('Error adding pastor gift. Please try again.');
    }
  };

  const exportToPDF = async (reportType) => {
    try {
      const response = await axios.get(`/api/reports/export/${reportType}`, {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
        responseType: 'blob'
      });
      
      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      if (error.response && error.response.status === 400) {
        alert('This report type is not available for PDF export yet.');
      } else {
        alert('Error generating PDF. Please try again later.');
      }
    }
  };

  // Export individual donor report to PDF
  const exportIndividualDonorToPDF = async () => {
    if (!selectedDonor) {
      alert('Please select a donor first.');
      return;
    }

    try {
      const response = await axios.get(`/api/reports/individual-donor/${selectedDonor}/pdf`, {
        params: { year: selectedYear },
        responseType: 'blob'
      });
      
      // Get donor name for filename
      const donorName = availableDonors.find(d => d.id.toString() === selectedDonor);
      const filename = `donor-report-${donorName ? `${donorName.firstName}-${donorName.lastName}` : 'unknown'}-${selectedYear}.pdf`;
      
      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting individual donor report:', error);
      alert('Error generating PDF. Please try again later.');
    }
  };

  const generateTaxForms = async () => {
    try {
      const response = await axios.post('/api/reports/tax-forms', {
        year: new Date(dateRange.endDate).getFullYear()
      });
      alert(`Tax forms generated for ${response.data.donorCount} members`);
    } catch (error) {
      console.error('Error generating tax forms:', error);
    }
  };

  const renderStatsCards = () => {
    const stats = [
      {
        title: 'Total Offerings',
        value: `$${yearlyDashboardData.totalOfferings?.toLocaleString() || '0'}`,
        icon: '💰',
        color: '#28a745'
      },
      {
        title: 'Cash Offerings',
        value: `$${yearlyDashboardData.cashOfferings?.toLocaleString() || '0'}`,
        icon: '💵',
        color: '#ffc107'
      },
      {
        title: 'Check Offerings',
        value: `$${yearlyDashboardData.checkOfferings?.toLocaleString() || '0'}`,
        icon: '🏦',
        color: '#17a2b8'
      },
      {
        title: 'Pastor Gifts',
        value: `-$${yearlyDashboardData.totalPastorGifts?.toLocaleString() || '0'}`,
        icon: '🎁',
        color: '#6f42c1',
        subtitle: 'Deductions from offerings'
      },
      {
        title: 'Expenses Reimbursed',
        value: `-$${yearlyDashboardData.totalExpensesReimbursed?.toLocaleString() || '0'}`,
        icon: '💼',
        color: '#dc3545',
        subtitle: 'Member reimbursements'
      },
      {
        title: 'Direct Church Expenses',
        value: `-$${yearlyDashboardData.totalDirectChurchExpenses?.toLocaleString() || '0'}`,
        icon: '🏛️',
        color: '#fd7e14',
        subtitle: 'Rent, utilities, auto-pays'
      },
      {
        title: 'Net Church Income',
        value: `$${yearlyDashboardData.netChurchIncome?.toLocaleString() || '0'}`,
        icon: '�',
        color: yearlyDashboardData.netChurchIncome >= 0 ? '#28a745' : '#dc3545'
      }
    ];

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {stats.map((stat, index) => (
          <div key={index} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: `3px solid ${stat.color}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color, marginBottom: '5px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '16px', color: '#6c757d', fontWeight: '500' }}>
              {stat.title}
            </div>
            {stat.subtitle && (
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px', fontStyle: 'italic' }}>
                {stat.subtitle}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderTabNavigation = () => {
    const tabs = [
      { id: 'offerings', label: 'Offerings', icon: '💰' },
      { id: 'expenses', label: 'Expenses', icon: '📋' },
      { id: 'monthly-financial', label: 'Monthly Financial Summary', icon: '📈' },
      { id: 'weekly', label: 'Weekly Reports', icon: '📊' },
      { id: 'donors', label: 'Member Management', icon: '👥' },
      { id: 'tax', label: 'Tax Reports', icon: '📄' },
      { id: 'individual-donors', label: 'Individual Member Reports', icon: '🧾' },
      { id: 'individual-expenses', label: 'Individual Expense Reports', icon: '💼' },
      { id: 'expense-categories', label: 'Expense Categories', icon: '📊' }
    ];

    return (
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? '#007bff' : '#f8f9fa',
              color: activeTab === tab.id ? 'white' : '#495057',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderOfferingsTab = () => {
    // Filter and process donations based on current filters
    const getFilteredDonations = () => {
      if (!donationData.donations) return [];
      
      let filtered = donationData.donations.filter(donation => {
        const donationDate = new Date(donation.donationDate);
        const donationYear = donationDate.getFullYear();
        const donationMonth = donationDate.getMonth() + 1;
        
        // Year filter
        if (offeringFilters.year && donationYear !== offeringFilters.year) return false;
        
        // Month filter
        if (offeringFilters.month && donationMonth !== parseInt(offeringFilters.month)) return false;
        
        // Payment method filter
        if (offeringFilters.paymentMethod && 
            donation.paymentMethod.toLowerCase() !== offeringFilters.paymentMethod.toLowerCase()) return false;
        
        // Donation type filter
        if (offeringFilters.donationType && donation.donationType !== offeringFilters.donationType) return false;
        
        // Search filter
        if (offeringFilters.searchTerm) {
          const searchLower = offeringFilters.searchTerm.toLowerCase();
          const donorName = (donation.donorName || '').toLowerCase();
          const amount = donation.amount.toString();
          const checkNumber = (donation.checkNumber || '').toString();
          
          if (!donorName.includes(searchLower) && 
              !amount.includes(searchLower) && 
              !checkNumber.includes(searchLower)) {
            return false;
          }
        }
        
        return true;
      });
      
      // Sort donations
      filtered.sort((a, b) => {
        let aVal, bVal;
        
        switch (offeringSortBy) {
          case 'date':
            aVal = new Date(a.donationDate);
            bVal = new Date(b.donationDate);
            break;
          case 'amount':
            aVal = parseFloat(a.amount);
            bVal = parseFloat(b.amount);
            break;
          case 'donor':
            aVal = (a.donorName || 'Anonymous').toLowerCase();
            bVal = (b.donorName || 'Anonymous').toLowerCase();
            break;
          default:
            return 0;
        }
        
        if (offeringSortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      return filtered;
    };

    // Calculate summary statistics
    const getOfferingSummary = (donations) => {
      const summary = {
        totalAmount: 0,
        cashAmount: 0,
        checkAmount: 0,
        donationCount: donations.length,
        uniqueDonors: new Set(),
        averageAmount: 0,
        titheAmount: 0,
        offeringAmount: 0
      };

      donations.forEach(donation => {
        const amount = parseFloat(donation.amount) || 0;
        summary.totalAmount += amount;
        
        if (donation.paymentMethod === 'cash' || donation.paymentMethod === 'Cash') {
          summary.cashAmount += amount;
        } else if (donation.paymentMethod === 'check' || donation.paymentMethod === 'Check') {
          summary.checkAmount += amount;
        }
        
        if (donation.donorName) {
          summary.uniqueDonors.add(donation.donorName);
        }
        
        // Tithes = Cash Offerings (per user request)
        // Remove the donationType-based calculation
      });

      summary.averageAmount = summary.donationCount > 0 ? summary.totalAmount / summary.donationCount : 0;
      summary.titheAmount = summary.cashAmount; // Tithes = Cash Offerings
      
      return summary;
    };

    // Group donations by month or week
    const getGroupedDonations = (donations) => {
      if (offeringView === 'flat') return { flat: donations };
      
      const groups = {};
      
      donations.forEach(donation => {
        const date = new Date(donation.donationDate);
        let groupKey;
        
        if (offeringView === 'monthly') {
          groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else if (offeringView === 'weekly') {
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          groupKey = startOfWeek.toISOString().split('T')[0];
        }
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(donation);
      });
      
      return groups;
    };

    const filteredDonations = getFilteredDonations();
    const summary = getOfferingSummary(filteredDonations);
    const groupedDonations = getGroupedDonations(filteredDonations);

    // Pagination for flat view
    const getPaginatedDonations = () => {
      if (offeringView !== 'flat') return filteredDonations;
      
      const startIndex = (offeringCurrentPage - 1) * offeringPageSize;
      const endIndex = startIndex + offeringPageSize;
      return filteredDonations.slice(startIndex, endIndex);
    };

    const totalPages = Math.ceil(filteredDonations.length / offeringPageSize);

    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '24px' }}>💰 Offering Details</h3>
          <button
            onClick={() => exportToPDF('offerings')}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📄 Export PDF
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
              ${summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ opacity: 0.9, fontSize: '14px' }}>Total Offerings</div>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{summary.donationCount}</div>
            <div style={{ opacity: 0.9, fontSize: '14px' }}>Total Donations</div>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{summary.uniqueDonors.size}</div>
            <div style={{ opacity: 0.9, fontSize: '14px' }}>Unique Donors</div>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
              ${summary.averageAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ opacity: 0.9, fontSize: '14px' }}>Average Donation</div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '2px solid #e9ecef' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>💵</span>
              <span style={{ fontWeight: 'bold', color: '#495057' }}>Cash Offerings</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
              ${summary.cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '2px solid #e9ecef' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>🏦</span>
              <span style={{ fontWeight: 'bold', color: '#495057' }}>Check Offerings</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
              ${summary.checkAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '2px solid #e9ecef' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>⛪</span>
              <span style={{ fontWeight: 'bold', color: '#495057' }}>Tithes</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6f42c1' }}>
              ${summary.titheAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '25px',
          border: '1px solid #dee2e6'
        }}>
          {/* Filter Row 1 */}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
            <div style={{ minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Year:</label>
              <select
                value={offeringFilters.year}
                onChange={(e) => {
                  const newYear = parseInt(e.target.value);
                  setOfferingFilters(prev => ({ ...prev, year: newYear }));
                }}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>
            
            <div style={{ minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Month:</label>
              <select
                value={offeringFilters.month}
                onChange={(e) => setOfferingFilters(prev => ({ ...prev, month: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            
            <div style={{ minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Payment Method:</label>
              <select
                value={offeringFilters.paymentMethod}
                onChange={(e) => setOfferingFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
              </select>
            </div>
            
            <div style={{ minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Type:</label>
              <select
                value={offeringFilters.donationType}
                onChange={(e) => setOfferingFilters(prev => ({ ...prev, donationType: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="">All Types</option>
                <option value="Tithe">Tithe</option>
                <option value="Offering">Offering</option>
              </select>
            </div>
          </div>
          
          {/* Filter Row 2 */}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'end' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Search:</label>
              <input
                type="text"
                placeholder="Search donor name, amount, or check number..."
                value={offeringFilters.searchTerm}
                onChange={(e) => setOfferingFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>View:</label>
              <select
                value={offeringView}
                onChange={(e) => setOfferingView(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="monthly">Monthly Groups</option>
                <option value="weekly">Weekly Groups</option>
                <option value="flat">Flat List</option>
              </select>
            </div>
            
            <div style={{ minWidth: '100px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Sort:</label>
              <select
                value={offeringSortBy}
                onChange={(e) => setOfferingSortBy(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="donor">Donor</option>
              </select>
            </div>
            
            <button
              onClick={() => setOfferingSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {offeringSortOrder === 'asc' ? '↑' : '↓'}
            </button>
            
            <button
              onClick={() => {
                setOfferingFilters({
                  year: offeringFilters.year, // Keep the current offering year (independent)
                  month: '',
                  week: '',
                  paymentMethod: '',
                  donationType: '',
                  searchTerm: ''
                });
                setOfferingCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: '#6c757d',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div style={{ 
          background: '#e3f2fd', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          border: '1px solid #bbdefb'
        }}>
          <div style={{ fontWeight: 'bold', color: '#1565c0' }}>
            Showing {filteredDonations.length} of {donationData.donations?.length || 0} donations
            {offeringFilters.searchTerm && ` (filtered by "${offeringFilters.searchTerm}")`}
          </div>
        </div>

        {/* Data Display */}
        {offeringView === 'flat' ? (
          <>
            {/* Flat View with Pagination */}
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Member</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Method</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Check #</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedDonations().map((donation, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {new Date(donation.donationDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {donation.donorName || 'Anonymous'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                        ${donation.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: donation.donationType === 'Tithe' ? '#d4edda' : '#fff3cd',
                          color: donation.donationType === 'Tithe' ? '#155724' : '#856404'
                        }}>
                          {donation.donationType}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: (donation.paymentMethod === 'Cash' || donation.paymentMethod === 'cash') ? '#f8d7da' : '#d1ecf1',
                          color: (donation.paymentMethod === 'Cash' || donation.paymentMethod === 'cash') ? '#721c24' : '#0c5460'
                        }}>
                          {donation.paymentMethod}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                        {(donation.paymentMethod === 'Check' || donation.paymentMethod === 'check') ? (donation.checkNumber || 'N/A') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setOfferingCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={offeringCurrentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    background: offeringCurrentPage === 1 ? '#f8f9fa' : 'white',
                    cursor: offeringCurrentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                
                <span style={{ padding: '8px 16px', fontWeight: 'bold' }}>
                  Page {offeringCurrentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setOfferingCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={offeringCurrentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    background: offeringCurrentPage === totalPages ? '#f8f9fa' : 'white',
                    cursor: offeringCurrentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          /* Grouped View */
          <div>
            {Object.entries(groupedDonations)
              .sort(([a], [b]) => offeringSortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a))
              .map(([groupKey, donations]) => {
                const isExpanded = expandedMonths.has(groupKey);
                const groupSummary = getOfferingSummary(donations);
                
                const formatGroupTitle = (key) => {
                  if (offeringView === 'monthly') {
                    const [year, month] = key.split('-');
                    return new Date(year, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                  } else if (offeringView === 'weekly') {
                    const startDate = new Date(key);
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 6);
                    return `Week of ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                  }
                  return key;
                };
                
                return (
                  <div key={groupKey} style={{ 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    overflow: 'hidden'
                  }}>
                    {/* Group Header */}
                    <div 
                      onClick={() => {
                        const newExpanded = new Set(expandedMonths);
                        if (isExpanded) {
                          newExpanded.delete(groupKey);
                        } else {
                          newExpanded.add(groupKey);
                        }
                        setExpandedMonths(newExpanded);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        padding: '15px 20px',
                        cursor: 'pointer',
                        borderBottom: isExpanded ? '1px solid #dee2e6' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, color: '#495057', fontSize: '18px' }}>
                          {isExpanded ? '📂' : '📁'} {formatGroupTitle(groupKey)}
                        </h4>
                        <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>
                          {donations.length} donations • ${groupSummary.totalAmount.toFixed(2)} total
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                            ${groupSummary.cashAmount.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>Cash</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>
                            ${groupSummary.checkAmount.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>Checks</div>
                        </div>
                        <div style={{ fontSize: '20px', color: '#6c757d' }}>
                          {isExpanded ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Group Content */}
                    {isExpanded && (
                      <div style={{ background: 'white' }}>
                        {/* Session Details for Weekly and Monthly Groups */}
                        {(offeringView === 'weekly' || offeringView === 'monthly') && (
                          <div style={{ 
                            background: '#f8f9fa', 
                            padding: '15px', 
                            marginBottom: '15px',
                            borderRadius: '6px',
                            border: '1px solid #dee2e6'
                          }}>
                            <h6 style={{ margin: '0 0 10px 0', color: '#495057', fontWeight: 'bold' }}>
                              📋 {offeringView === 'weekly' ? 'Weekly' : 'Monthly'} Session Details
                            </h6>
                            
                            {/* Find session data for this time period */}
                            {(() => {
                              let periodStart, periodEnd, periodSessions;
                              
                              if (offeringView === 'weekly') {
                                periodStart = new Date(groupKey);
                                periodEnd = new Date(periodStart);
                                periodEnd.setDate(periodStart.getDate() + 6);
                              } else if (offeringView === 'monthly') {
                                const [year, month] = groupKey.split('-');
                                periodStart = new Date(year, month - 1, 1);
                                periodEnd = new Date(year, month, 0); // Last day of month
                              }
                              
                              periodSessions = donationData.sessions?.filter(session => {
                                const sessionDate = new Date(session.sessionDate);
                                return sessionDate >= periodStart && sessionDate <= periodEnd;
                              }) || [];
                              
                              if (periodSessions.length > 0) {
                                return periodSessions.map((session, idx) => (
                                  <div key={idx} style={{ 
                                    background: 'white', 
                                    padding: '12px', 
                                    borderRadius: '4px',
                                    border: '1px solid #e9ecef',
                                    marginBottom: idx < periodSessions.length - 1 ? '10px' : '0'
                                  }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
                                      <div>
                                        <strong>Date:</strong> {new Date(session.sessionDate).toLocaleDateString()}
                                      </div>
                                      <div>
                                        <strong>💵 Cash Denominations:</strong> $
                                        {(() => {
                                          const sessionDonations = session.Donations || [];
                                          const individualCash = sessionDonations
                                            .filter(d => d.paymentMethod === 'cash' || d.paymentMethod === 'Cash')
                                            .reduce((sum, d) => sum + parseFloat(d.amount), 0);
                                          const totalCash = session.cashAmount || 0;
                                          const anonymousCash = Math.max(0, totalCash - individualCash);
                                          return anonymousCash.toFixed(2);
                                        })()}
                                      </div>
                                      <div>
                                        <strong>✍️ Signers:</strong><br/>
                                        <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                          {session.reviewer1 || 'Not specified'} & {session.reviewer2 || 'Not specified'}
                                        </span>
                                      </div>
                                      {session.pastorGift > 0 && (
                                        <div>
                                          <strong>🎁 Pastor Gift:</strong><br/>
                                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                            -${session.pastorGift.toFixed(2)}
                                          </span><br/>
                                          <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                            By: {session.EnteredBy?.name || 'Unknown'}
                                          </span>
                                        </div>
                                      )}
                                      <div>
                                        <strong>🏦 Final Deposit:</strong><br/>
                                        <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                                          ${session.netDeposit.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ));
                              } else {
                                return (
                                  <div style={{ 
                                    textAlign: 'center', 
                                    padding: '15px', 
                                    color: '#6c757d',
                                    fontStyle: 'italic'
                                  }}>
                                    No session details available for this {offeringView === 'weekly' ? 'week' : 'month'}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                        
                        {/* Individual Donations Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '14px' }}>Date</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '14px' }}>Member</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #dee2e6', fontSize: '14px' }}>Amount</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #dee2e6', fontSize: '14px' }}>Type</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #dee2e6', fontSize: '14px' }}>Method</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #dee2e6', fontSize: '14px' }}>Check #</th>
                            </tr>
                          </thead>
                          <tbody>
                            {donations.map((donation, index) => (
                              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                <td style={{ padding: '8px 12px', border: '1px solid #dee2e6', fontSize: '14px' }}>
                                  {new Date(donation.donationDate).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '8px 12px', border: '1px solid #dee2e6', fontSize: '14px' }}>
                                  {donation.donorName || 'Anonymous'}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '14px' }}>
                                  ${donation.amount.toFixed(2)}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #dee2e6', fontSize: '14px' }}>
                                  <span style={{
                                    padding: '3px 6px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    backgroundColor: donation.donationType === 'Tithe' ? '#d4edda' : '#fff3cd',
                                    color: donation.donationType === 'Tithe' ? '#155724' : '#856404'
                                  }}>
                                    {donation.donationType}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #dee2e6', fontSize: '14px' }}>
                                  <span style={{
                                    padding: '3px 6px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    backgroundColor: (donation.paymentMethod === 'Cash' || donation.paymentMethod === 'cash') ? '#f8d7da' : '#d1ecf1',
                                    color: (donation.paymentMethod === 'Cash' || donation.paymentMethod === 'cash') ? '#721c24' : '#0c5460'
                                  }}>
                                    {donation.paymentMethod}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #dee2e6', fontSize: '14px' }}>
                                  {(donation.paymentMethod === 'Check' || donation.paymentMethod === 'check') ? (donation.checkNumber || 'N/A') : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {/* Anonymous Cash Summary */}
                        {(offeringView === 'weekly' || offeringView === 'monthly') && (
                          <div style={{ 
                            background: '#e8f5e8', 
                            padding: '10px', 
                            marginTop: '10px',
                            borderRadius: '4px',
                            border: '1px solid #c3e6cb',
                            fontSize: '13px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#155724' }}>
                                💵 Anonymous Cash (from denominations):
                              </span>
                              <span style={{ fontWeight: 'bold', color: '#155724' }}>
                                ${(() => {
                                  const individualCash = donations
                                    .filter(d => d.paymentMethod === 'cash' || d.paymentMethod === 'Cash')
                                    .reduce((sum, d) => sum + parseFloat(d.amount), 0);
                                  const totalCash = groupSummary.cashAmount;
                                  return Math.max(0, totalCash - individualCash).toFixed(2);
                                })()}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '3px' }}>
                              Total cash offerings minus individual named cash donations
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>
        )}

        {/* Session Summary - Enhanced with filtering and pagination */}
        {donationData.sessions && donationData.sessions.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <div 
              onClick={() => {
                const sessionSection = document.getElementById('session-details');
                const isHidden = sessionSection.style.display === 'none';
                sessionSection.style.display = isHidden ? 'block' : 'none';
              }}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px',
                cursor: 'pointer',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #dee2e6'
              }}
            >
              <h4 style={{ color: '#333', fontSize: '18px', margin: 0 }}>
                📋 Session Summary ({offeringFilters.year}) - Click to {donationData.sessions.length > 12 ? 'Expand/Collapse' : 'View'}
              </h4>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                {donationData.sessions.length} sessions • Click to view details
              </div>
            </div>

            <div id="session-details" style={{ display: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#495057' }}>
                  Filter Sessions:
                </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={offeringFilters.month}
                  onChange={(e) => setOfferingFilters(prev => ({ ...prev, month: e.target.value }))}
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <button
                  onClick={() => setOfferingFilters(prev => ({ ...prev, month: '' }))}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #6c757d',
                    borderRadius: '4px',
                    background: '#6c757d',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Show All
                </button>
              </div>
            </div>

            {/* Compact Session Cards - Show only recent or filtered sessions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              {donationData.sessions
                .filter(session => {
                  if (!offeringFilters.month) return true;
                  const sessionDate = new Date(session.sessionDate);
                  return sessionDate.getMonth() + 1 === parseInt(offeringFilters.month);
                })
                .slice(0, showAllSessions ? undefined : 12) // Show max 12 sessions unless showAllSessions is true
                .map((session, index) => (
                  <div key={index} style={{ 
                    backgroundColor: '#f8f9fa', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px', 
                    padding: '15px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h6 style={{ margin: 0, color: '#495057', fontSize: '14px', fontWeight: 'bold' }}>
                        📅 {new Date(session.sessionDate).toLocaleDateString()}
                      </h6>
                      <div style={{ fontSize: '11px', color: '#6c757d' }}>
                        ID: {session.id}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', fontSize: '12px' }}>
                      {/* Collections */}
                      <div style={{ backgroundColor: '#d4edda', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: '#155724', fontSize: '11px' }}>💰 TOTAL</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#155724' }}>
                          ${session.totalDonations?.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      {/* Cash */}
                      <div style={{ backgroundColor: '#fff3cd', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: '#856404', fontSize: '11px' }}>💵 CASH</div>
                        <div style={{ fontSize: '12px', color: '#856404' }}>
                          ${session.cashAmount?.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      {/* Checks */}
                      <div style={{ backgroundColor: '#d1ecf1', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: '#0c5460', fontSize: '11px' }}>🏦 CHECKS</div>
                        <div style={{ fontSize: '12px', color: '#0c5460' }}>
                          ${session.checkAmount?.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      {/* Final Deposit */}
                      <div style={{ backgroundColor: '#d4edda', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: '#155724', fontSize: '11px' }}>�️ DEPOSIT</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#155724' }}>
                          ${session.netDeposit?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Pastor Gift Note */}
                    {session.pastorGift > 0 && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '6px', 
                        backgroundColor: '#f8d7da', 
                        borderRadius: '3px',
                        fontSize: '11px',
                        color: '#721c24',
                        textAlign: 'center'
                      }}>
                        🎁 Pastor Gift: -${session.pastorGift?.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              }
            </div>

            {/* Show More Sessions Button */}
            {(() => {
              const filteredSessions = donationData.sessions.filter(session => {
                if (!offeringFilters.month) return true;
                const sessionDate = new Date(session.sessionDate);
                return sessionDate.getMonth() + 1 === parseInt(offeringFilters.month);
              });
              
              return filteredSessions.length > 12 && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    onClick={() => setShowAllSessions(!showAllSessions)}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #007bff',
                      borderRadius: '6px',
                      background: 'white',
                      color: '#007bff',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {showAllSessions 
                      ? '📁 Show Less Sessions' 
                      : `📄 View More Sessions (${filteredSessions.length - 12} remaining)`
                    }
                  </button>
                </div>
              );
            })()}

            {/* Quick Summary for Treasurer */}
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <h6 style={{ margin: '0 0 10px 0', color: '#1565c0', fontWeight: 'bold' }}>
                📊 {offeringFilters.month ? `${new Date(2000, offeringFilters.month - 1).toLocaleDateString('en-US', { month: 'long' })} ${offeringFilters.year}` : offeringFilters.year} Session Summary
              </h6>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '14px' }}>
                <div>
                  <strong>Total Sessions:</strong> {donationData.sessions.filter(session => {
                    if (!offeringFilters.month) return true;
                    const sessionDate = new Date(session.sessionDate);
                    return sessionDate.getMonth() + 1 === parseInt(offeringFilters.month);
                  }).length}
                </div>
                <div>
                  <strong>Total Collections:</strong> ${donationData.sessions.filter(session => {
                    if (!offeringFilters.month) return true;
                    const sessionDate = new Date(session.sessionDate);
                    return sessionDate.getMonth() + 1 === parseInt(offeringFilters.month);
                  }).reduce((sum, s) => sum + (s.totalDonations || 0), 0).toFixed(2)}
                </div>
                <div>
                  <strong>Total Deposits:</strong> ${donationData.sessions.filter(session => {
                    if (!offeringFilters.month) return true;
                    const sessionDate = new Date(session.sessionDate);
                    return sessionDate.getMonth() + 1 === parseInt(offeringFilters.month);
                  }).reduce((sum, s) => sum + (s.netDeposit || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMonthlyFinancialTab = () => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '24px' }}>📈 Monthly Financial Summary</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={monthlyFinancialData.period?.month || new Date().getMonth() + 1}
            onChange={(e) => fetchMonthlyFinancialReport(monthlyFinancialData.period?.year || 2025, parseInt(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i+1} value={i+1}>
                {new Date(2024, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            value={monthlyFinancialData.period?.year || 2024}
            onChange={(e) => fetchMonthlyFinancialReport(parseInt(e.target.value), monthlyFinancialData.period?.month || new Date().getMonth() + 1)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {Array.from({length: 5}, (_, i) => {
              const year = new Date().getFullYear() - i; // Start from current year (2025) and go backwards
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          <button
            onClick={() => fetchMonthlyFinancialReport(monthlyFinancialData.period?.year, monthlyFinancialData.period?.month)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {monthlyFinancialData.period && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
            📅 {monthlyFinancialData.period.monthName} {monthlyFinancialData.period.year}
          </h4>
          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
            Period: {monthlyFinancialData.period.startDate} to {monthlyFinancialData.period.endDate}
          </p>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: '#d4edda', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724', fontSize: '16px' }}>💰 Total Offerings</h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
            ${monthlyFinancialData.summary?.totalOfferingsReceived?.toFixed(2) || '0.00'}
          </p>
          <small style={{ color: '#6c757d' }}>
            Cash: ${monthlyFinancialData.summary?.cashOfferings?.toFixed(2) || '0.00'} | 
            Check: ${monthlyFinancialData.summary?.checkOfferings?.toFixed(2) || '0.00'}
          </small>
        </div>

        <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '16px' }}>🎁 Pastor Gifts</h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
            -${monthlyFinancialData.summary?.totalPastorGifts?.toFixed(2) || '0.00'}
          </p>
          <small style={{ color: '#6c757d' }}>Deductions from offerings</small>
        </div>

        <div style={{ backgroundColor: '#f8d7da', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#721c24', fontSize: '16px' }}>💼 Expenses Reimbursed</h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
            -${monthlyFinancialData.summary?.totalExpensesReimbursed?.toFixed(2) || '0.00'}
          </p>
          <small style={{ color: '#6c757d' }}>Member reimbursements</small>
        </div>

        <div style={{ backgroundColor: '#f1c0c7', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#721c24', fontSize: '16px' }}>🏛️ Direct Church Expenses</h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
            -${monthlyFinancialData.summary?.totalDirectChurchExpenses?.toFixed(2) || '0.00'}
          </p>
          <small style={{ color: '#6c757d' }}>Rent, utilities, auto-pays</small>
        </div>

        <div style={{ backgroundColor: '#cce5ff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#004085', fontSize: '16px' }}>📊 Net Church Income</h4>
          <p style={{ 
            margin: 0, 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: monthlyFinancialData.summary?.netChurchIncome >= 0 ? '#155724' : '#721c24' 
          }}>
            ${monthlyFinancialData.summary?.netChurchIncome?.toFixed(2) || '0.00'}
          </p>
          <small style={{ color: '#6c757d' }}>After all deductions</small>
        </div>
      </div>

      {/* Expense Categories Breakdown */}
      {monthlyFinancialData.details?.expensesByCategory?.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#333', marginBottom: '15px' }}>📋 Expense Categories Breakdown</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold' }}>Category</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>💼 Reimbursed</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>🏛️ Direct</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>💰 Total</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold' }}>📊 Count</th>
                </tr>
              </thead>
              <tbody>
                {monthlyFinancialData.details.expensesByCategory.map((category, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#495057' }}>
                      {category.category}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#dc3545' }}>
                      ${category.reimbursed?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#fd7e14' }}>
                      ${category.direct?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#721c24' }}>
                      ${category.total?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', color: '#6c757d' }}>
                      {category.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      <div style={{ 
        backgroundColor: '#e9ecef', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>📋 Monthly Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Income:</strong><br/>
            • Total offerings received: ${monthlyFinancialData.summary?.totalOfferingsReceived?.toFixed(2) || '0.00'}<br/>
            • Number of offerings: {monthlyFinancialData.summary?.offeringCount || 0}
          </div>
          <div>
            <strong>Deductions:</strong><br/>
            • Pastor gifts: ${monthlyFinancialData.summary?.totalPastorGifts?.toFixed(2) || '0.00'}<br/>
            • All expenses: ${monthlyFinancialData.summary?.totalAllExpenses?.toFixed(2) || '0.00'}
          </div>
          <div>
            <strong>Final Result:</strong><br/>
            • Net church income: <span style={{ 
              fontWeight: 'bold', 
              color: monthlyFinancialData.summary?.netChurchIncome >= 0 ? '#155724' : '#721c24' 
            }}>
              ${monthlyFinancialData.summary?.netChurchIncome?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWeeklyTab = () => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '24px' }}>📊 Weekly Giving Summary (Last 10 Weeks)</h3>
        <button
          onClick={() => exportToPDF('weekly')}
          style={{
            backgroundColor: '#17a2b8',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📊 Export Report
        </button>
      </div>
      
      {/* Compact Weekly Summary Table */}
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#495057', color: 'white' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>Week Of</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>💵 Cash</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>🏦 Checks</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>💰 Total</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>➖ Deductions</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>🏦 Final Deposit</th>
            </tr>
          </thead>
          <tbody>
            {weeklyData.slice(0, 10).map((week, index) => (
              <tr key={index} style={{ 
                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                borderBottom: '1px solid #dee2e6'
              }}>
                <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>
                  {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#28a745' }}>
                  ${week.cashAmount?.toFixed(2) || '0.00'}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#007bff' }}>
                  ${week.checkAmount?.toFixed(2) || '0.00'}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  ${week.totalAmount?.toFixed(2) || '0.00'}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: week.totalDeductions > 0 ? '#dc3545' : '#6c757d' }}>
                  {week.totalDeductions > 0 ? `-$${week.totalDeductions?.toFixed(2)}` : '-'}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  textAlign: 'right', 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#17a2b8',
                  backgroundColor: index % 2 === 0 ? '#e8f4f8' : '#f0f8ff'
                }}>
                  ${week.netDeposit?.toFixed(2) || week.totalAmount?.toFixed(2) || '0.00'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#495057' }}>TOTALS</td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px', color: '#28a745' }}>
                ${weeklyData.reduce((sum, week) => sum + (week.cashAmount || 0), 0).toFixed(2)}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px', color: '#007bff' }}>
                ${weeklyData.reduce((sum, week) => sum + (week.checkAmount || 0), 0).toFixed(2)}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '15px', color: '#333' }}>
                ${weeklyData.reduce((sum, week) => sum + (week.totalAmount || 0), 0).toFixed(2)}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px', color: '#dc3545' }}>
                -${weeklyData.reduce((sum, week) => sum + (week.totalDeductions || 0), 0).toFixed(2)}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '15px', color: '#17a2b8', backgroundColor: '#d1ecf1' }}>
                ${weeklyData.reduce((sum, week) => sum + (week.netDeposit || week.totalAmount || 0), 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Quick Add Pastor Gift Section */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px', 
        border: '1px solid #ffeaa7',
        marginTop: '20px'
      }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#856404' }}>🎁 Quick Add Pastor Gift</h5>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            placeholder="Week Date"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
            onChange={(e) => setPastorGiftWeek(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            min="0"
            step="0.01"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', width: '100px' }}
            onChange={(e) => setPastorGiftAmount(e.target.value)}
          />
          <button
            onClick={addPastorGift}
            style={{
              backgroundColor: '#856404',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Add Pastor Gift
          </button>
        </div>
        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
          💡 Tip: Use the week start date (e.g., 2025-09-29 for the week containing Oct 4)
        </div>
      </div>

      {/* Note about detailed donations */}
      <div style={{ 
        backgroundColor: '#e2e3e5', 
        padding: '12px', 
        borderRadius: '6px', 
        marginTop: '15px',
        fontSize: '13px',
        color: '#495057'
      }}>
        📋 <strong>Note:</strong> For detailed offering information (individual checks, member names) for tax reports, 
        use the "Donations" tab above. This summary shows weekly totals for bank deposit tracking.
      </div>
    </div>
  );

  const renderDonorsTab = () => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '24px' }}>👥 Donor Management</h3>
        <button
          onClick={() => window.location.href = '/donor-management'}
          style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ➕ Manage Donors
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Phone</th>
              <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Total Given</th>
              <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Last Gift</th>
            </tr>
          </thead>
          <tbody>
            {donorData.map((donor, index) => (
              <tr key={donor.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                  {donor.firstName} {donor.lastName}
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  {donor.email || 'N/A'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  {donor.phone || 'N/A'}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                  ${donor.totalGiven?.toFixed(2) || '0.00'}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  {donor.lastGiftDate ? new Date(donor.lastGiftDate).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTaxTab = () => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>📄 Tax Reporting</h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          border: '2px solid #28a745',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#28a745', margin: '0 0 15px 0' }}>Generate Annual Tax Forms</h4>
          <p style={{ marginBottom: '20px', color: '#6c757d' }}>
            Create and email tax forms for all donors for the selected year
          </p>
          <button
            onClick={generateTaxForms}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📧 Generate & Email Tax Forms
          </button>
        </div>
        
        <div style={{
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#856404', margin: '0 0 15px 0' }}>Donor Summary Report</h4>
          <p style={{ marginBottom: '20px', color: '#6c757d' }}>
            Export detailed giving summary for all donors
          </p>
          <button
            onClick={() => exportToPDF('donor-summary')}
            style={{
              backgroundColor: '#ffc107',
              color: '#212529',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📋 Export Donor Summary
          </button>
        </div>
      </div>
    </div>
  );

  // Render Expense Reports Tab
  const renderExpenseReportsTab = () => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '24px' }}>📋 Expense Reports</h3>
        <button
          onClick={() => exportToPDF('expenses')}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📄 Export PDF
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#495057', marginBottom: '15px' }}>🏛️ Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#721c24', fontWeight: 'bold' }}>💰 Total Reimbursable</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
              ${summary.totalReimbursable?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div style={{ backgroundColor: '#d1ecf1', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#0c5460', fontWeight: 'bold' }}>🏦 Total Direct</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
              ${summary.totalDirect?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div style={{ backgroundColor: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#155724', fontWeight: 'bold' }}>📊 Total Expenses</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              ${((summary.totalReimbursable || 0) + (summary.totalDirect || 0)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Person</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {expenseData.expenses && expenseData.expenses.length > 0 ? expenseData.expenses.map((expense, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  {new Date(expense.submissionDate || expense.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  {expense.User?.name || 'Church'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  {expense.description}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: getCategoryColor(expense.category),
                    color: '#fff'
                  }}>
                    {expense.category || 'General'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                  ${parseFloat(expense.amount || 0).toFixed(2)}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: expense.submissionId ? '#fff3cd' : '#d1ecf1',
                    color: expense.submissionId ? '#856404' : '#0c5460'
                  }}>
                    {expense.submissionId ? 'Reimbursable' : 'Direct'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: expense.status === 'approved' ? '#d4edda' : expense.status === 'pending' ? '#fff3cd' : '#f8d7da',
                    color: expense.status === 'approved' ? '#155724' : expense.status === 'pending' ? '#856404' : '#721c24'
                  }}>
                    {expense.status || 'pending'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', border: '1px solid #dee2e6', color: '#6c757d' }}>
                  No expense data available for the selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Individual Donor Reports Tab
  const renderIndividualDonorReportsTab = () => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '24px' }}>🧾 Individual Donor Reports</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Donor:</label>
            <select 
              value={selectedDonor} 
              onChange={(e) => setSelectedDonor(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
            >
              <option value="">Choose a donor...</option>
              {availableDonors.map(donor => (
                <option key={donor.id} value={donor.id}>
                  {donor.firstName} {donor.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Year:</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          <button
            onClick={() => fetchIndividualDonorReports()}
            disabled={!selectedDonor}
            style={{
              backgroundColor: selectedDonor ? '#28a745' : '#6c757d',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedDonor ? 'pointer' : 'not-allowed',
              marginTop: '20px'
            }}
          >
            📊 Generate Report
          </button>
          <button
            onClick={() => exportIndividualDonorToPDF()}
            disabled={!selectedDonor}
            style={{
              backgroundColor: selectedDonor ? '#dc3545' : '#6c757d',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedDonor ? 'pointer' : 'not-allowed',
              marginTop: '20px'
            }}
          >
            📄 Export PDF
          </button>
        </div>
      </div>
      
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        Generate tax reports for individual donors showing their annual giving summary.
      </p>

      {/* Display Individual Donor Report Results */}
      {individualDonorReports.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4 style={{ color: '#333', marginBottom: '20px' }}>
            📋 Donation History for {selectedYear}
          </h4>
          
          {/* Summary Section */}
          {individualDonorReports.length > 0 && (
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '2px solid #007bff'
            }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#007bff' }}>📊 Annual Summary</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div>
                  <strong>Total Donations:</strong><br />
                  <span style={{ color: '#28a745', fontSize: '18px', fontWeight: 'bold' }}>
                    ${individualDonorReports.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>Number of Donations:</strong><br />
                  <span style={{ color: '#007bff', fontSize: '18px', fontWeight: 'bold' }}>
                    {individualDonorReports.length}
                  </span>
                </div>
                <div>
                  <strong>Cash Donations:</strong><br />
                  <span style={{ color: '#ffc107', fontSize: '16px' }}>
                    ${individualDonorReports.filter(d => d.paymentMethod === 'cash').reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>Check Donations:</strong><br />
                  <span style={{ color: '#17a2b8', fontSize: '16px' }}>
                    ${individualDonorReports.filter(d => d.paymentMethod === 'check').reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Donations Table */}
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#343a40', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Payment Method</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Check #</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {individualDonorReports.map((donation, index) => (
                  <tr key={donation.id} style={{ 
                    background: index % 2 === 0 ? '#f8f9fa' : 'white',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <td style={{ padding: '12px' }}>
                      {new Date(donation.donationDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#28a745' }}>
                      ${parseFloat(donation.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: donation.paymentMethod === 'cash' ? '#ffc107' : '#17a2b8',
                        color: 'white'
                      }}>
                        {donation.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {donation.checkNumber || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {donation.donationType || 'Tithe'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {donation.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Render Individual Expense Reports Tab  
  const renderIndividualExpenseReportsTab = () => {
    // Get monthly breakdown
    const getMonthlyBreakdown = () => {
      if (!userExpenseData?.submissions) return [];
      
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2000, i).toLocaleString('default', { month: 'long' }),
        submitted: 0,
        approved: 0,
        reimbursed: 0,
        submissionCount: 0
      }));

      userExpenseData.submissions.forEach(submission => {
        const month = new Date(submission.date).getMonth();
        const amount = parseFloat(submission.amount) || 0;
        
        monthlyData[month].submitted += amount;
        monthlyData[month].submissionCount += 1;
        
        if (submission.status === 'approved') {
          monthlyData[month].approved += amount;
          monthlyData[month].reimbursed += amount;
        }
      });

      return monthlyData.filter(month => month.submitted > 0);
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount || 0);
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>💼 Individual Expense Reports</h3>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>
          View expense reports by individual for reimbursement tracking.
        </p>

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginBottom: '25px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* User Selection */}
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
              Select User:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                const userId = e.target.value;
                const user = users.find(u => u.id.toString() === userId);
                setSelectedUserId(userId);
                setSelectedUserName(user ? user.name : '');
              }}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              disabled={loadingUsers}
            >
              <option value="">Select a user...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Year Selection */}
          <div style={{ minWidth: '120px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
              Year:
            </label>
            <select
              value={expenseYear}
              onChange={(e) => setExpenseYear(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </div>

        {/* Summary Card */}
        {userExpenseData && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '25px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>
              {selectedUserName} - {expenseYear} Expense Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {formatCurrency(userExpenseData.totalSubmitted)}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px' }}>Total Submitted</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {formatCurrency(userExpenseData.totalReimbursed)}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px' }}>Total Reimbursed</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {userExpenseData.submissionCount}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px' }}>Submissions</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {userExpenseData.approvedCount}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px' }}>Approved</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loadingExpenseData && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#6c757d' }}>Loading expense data...</div>
          </div>
        )}

        {/* No User Selected */}
        {!selectedUserId && !loadingExpenseData && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '2px dashed #dee2e6'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>👤</div>
            <div style={{ fontSize: '18px', color: '#6c757d', marginBottom: '5px' }}>
              Select a user to view their expense report
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Choose a user from the dropdown above to see their submission history and reimbursement details
            </div>
          </div>
        )}

        {/* Expense Data Display */}
        {userExpenseData && userExpenseData.submissions && userExpenseData.submissions.length > 0 && (
          <>
            {/* Monthly Breakdown */}
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>📊 Monthly Breakdown</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Month</th>
                      <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Submissions</th>
                      <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Submitted</th>
                      <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Reimbursed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getMonthlyBreakdown().map((month, index) => (
                      <tr key={index}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                          {month.month}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                          {month.submissionCount}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                          {formatCurrency(month.submitted)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                          {formatCurrency(month.reimbursed)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Submissions */}
            <div>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>📋 Detailed Submission History</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Expenses</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Approved Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userExpenseData.submissions.map((submission, index) => (
                      <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {formatDate(submission.date)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                          {formatCurrency(submission.amount)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: submission.status === 'approved' ? '#d4edda' : 
                                      submission.status === 'pending' ? '#fff3cd' : '#f8d7da',
                            color: submission.status === 'approved' ? '#155724' : 
                                  submission.status === 'pending' ? '#856404' : '#721c24'
                          }}>
                            {submission.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                          {submission.expenseCount}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {submission.approvedDate ? formatDate(submission.approvedDate) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* No Data Message */}
        {userExpenseData && (!userExpenseData.submissions || userExpenseData.submissions.length === 0) && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '2px dashed #dee2e6'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
            <div style={{ fontSize: '18px', color: '#6c757d', marginBottom: '5px' }}>
              No expense submissions found
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              {selectedUserName} has no expense submissions for {expenseYear}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Expense Categories Tab
  const renderExpenseCategoriesTab = () => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>📊 Expense Categories</h3>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        Analyze expenses by category (food, travel, rent, etc.) including both reimbursable and direct church expenses.
      </p>
    </div>
  );

  // Show different views based on user role

  if (!user) return (
    <div style={StyledComponents.LoadingContainer}>
      <div style={StyledComponents.LoadingText}>Loading...</div>
    </div>
  );

  // Member view - only their own data
  if (!isAdmin) {
    return (
      <div style={StyledComponents.PageContainer}>
        <Navigation user={user} />
        <div style={StyledComponents.ContentWrapper}>
          <div style={StyledComponents.Card}>
            <h1 style={{ 
              textAlign: 'center', 
              color: '#333',
              fontSize: '36px',
              fontWeight: 'bold',
              margin: '0 0 30px 0'
            }}>
              📊 My Reports
            </h1>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {/* Member's Expense Summary */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '25px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                border: '3px solid #dc3545'
              }}>
                <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '10px' }}>📋</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545', textAlign: 'center', marginBottom: '5px' }}>
                  ${expenseData.summary.totalAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: '16px', color: '#6c757d', fontWeight: '500', textAlign: 'center' }}>
                  My Total Expenses
                </div>
                <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
                  Pending: {expenseData.summary.pendingCount} • Approved: {expenseData.summary.reimbursedCount}
                </div>
              </div>

              {/* Member's Donation Summary */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '25px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                border: '3px solid #28a745'
              }}>
                <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '10px' }}>💰</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745', textAlign: 'center', marginBottom: '5px' }}>
                  ${donationData.summary.totalAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: '16px', color: '#6c757d', fontWeight: '500', textAlign: 'center' }}>
                  My Total Donations
                </div>
                <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
                  Cash: ${donationData.summary.cashAmount.toFixed(2)} • Checks: ${donationData.summary.checkAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Member's Recent Expenses */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#333', fontSize: '24px', margin: 0 }}>📋 My Recent Expenses</h3>
                <button
                  onClick={fetchAllReports}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  🔄 Refresh
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseData.expenses.map((expense, index) => (
                      <tr key={expense.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(expense.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {expense.description}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                          ${expense.amount}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: (expense.status === 'approved' || expense.status === 'reimbursed') ? '#d4edda' : '#fff3cd',
                            color: (expense.status === 'approved' || expense.status === 'reimbursed') ? '#155724' : '#856404'
                          }}>
                            {(expense.status === 'approved' || expense.status === 'reimbursed') ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {expenseData.expenses.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                    No expenses submitted yet.
                  </div>
                )}
              </div>
            </div>

            {/* Member's Recent Donations */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#333', fontSize: '24px', margin: 0 }}>💰 My Recent Donations</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>Year:</label>
                  <select 
                    value={memberDonationYear}
                    onChange={(e) => setMemberDonationYear(parseInt(e.target.value))}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Year Summary */}
              <div style={{ 
                marginBottom: '15px', 
                padding: '10px 15px', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '6px',
                border: '1px solid #b3d9ff'
              }}>
                <strong>
                  {memberDonationYear} Summary: {donationData.donations.filter(donation => new Date(donation.donationDate).getFullYear() === memberDonationYear).length} donations • 
                  Total: ${donationData.donations.filter(donation => new Date(donation.donationDate).getFullYear() === memberDonationYear).reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                </strong>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Donor</th>
                      <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Method</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Check #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donationData.donations
                      .filter(donation => new Date(donation.donationDate).getFullYear() === memberDonationYear)
                      .map((donation, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(donation.donationDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {donation.Donor 
                            ? `${donation.Donor.firstName} ${donation.Donor.lastName}`
                            : donation.donorName || 'Anonymous'
                          }
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                          ${donation.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: donation.donationType === 'Tithe' ? '#d4edda' : '#fff3cd',
                            color: donation.donationType === 'Tithe' ? '#155724' : '#856404'
                          }}>
                            {donation.donationType}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: (donation.paymentMethod === 'Cash' || donation.paymentMethod === 'cash') ? '#f8d7da' : '#d1ecf1',
                            color: (donation.paymentMethod === 'Cash' || donation.paymentMethod === 'cash') ? '#721c24' : '#0c5460'
                          }}>
                            {donation.paymentMethod}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                          {(donation.paymentMethod === 'Check' || donation.paymentMethod === 'check') 
                            ? (donation.checkNumber || 'N/A')
                            : '—'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {donationData.donations.filter(donation => new Date(donation.donationDate).getFullYear() === memberDonationYear).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                    No donations recorded for {memberDonationYear}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin/Treasurer view - full church reports
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
            📊 Church Management Reports
          </h1>
          
          {/* Dashboard Year Selector */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              backgroundColor: '#f8f9fa',
              padding: '15px 20px',
              borderRadius: '8px',
              border: '2px solid #dee2e6'
            }}>
              <label style={{ fontWeight: 'bold', color: '#495057' }}>
                📅 Dashboard Year:
              </label>
              <select
                value={dashboardYear}
                onChange={(e) => setDashboardYear(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {Array.from({length: 5}, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                (Shows yearly totals for {dashboardYear})
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Tab Navigation */}
        {renderTabNavigation()}

        {/* Tab Content */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '50px',
            fontSize: '24px',
            color: '#6c757d'
          }}>
            Loading reports...
          </div>
        ) : (
          <>
            {activeTab === 'offerings' && renderOfferingsTab()}
            {activeTab === 'expenses' && renderExpenseReportsTab()}
            {activeTab === 'monthly-financial' && renderMonthlyFinancialTab()}
            {activeTab === 'weekly' && renderWeeklyTab()}
            {activeTab === 'donors' && renderDonorsTab()}
            {activeTab === 'tax' && renderTaxTab()}
            {activeTab === 'individual-donors' && renderIndividualDonorReportsTab()}
            {activeTab === 'individual-expenses' && renderIndividualExpenseReportsTab()}
            {activeTab === 'expense-categories' && renderExpenseCategoriesTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;