import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import Reports from './components/Reports';
import Login from './components/Login';
import AdminExpenses from './components/AdminExpenses';
import AdminSubmissions from './components/AdminSubmissions';
import DonationEntry from './components/DonationEntry';
import OfferingForm from './components/OfferingForm';
import DonorManagement from './components/DonorManagement';
import DepositManagement from './components/DepositManagement';
import { StyledComponents } from './theme/StyledComponents';

function App() {
  return (
    <Router>
      <div className="App" style={StyledComponents.PageContainer}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/expenses" element={<ExpenseForm />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin/expenses" element={<AdminSubmissions />} />
          <Route path="/admin/expenses-legacy" element={<AdminExpenses />} />
          <Route path="/donations" element={<DonationEntry />} />
          <Route path="/donor-management" element={<DonorManagement />} />
          <Route path="/deposits" element={<DepositManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;