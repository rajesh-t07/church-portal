const generateReport = (data, type, userId = null) => {
  if (type === 'expenses') {
    const total = data.reduce((sum, exp) => sum + exp.amount, 0);
    const pending = data.filter(exp => exp.status === 'pending').length;
    return { totalExpenses: total, pendingCount: pending, details: data };
  } else if (type === 'offerings') {
    const total = data.reduce((sum, off) => sum + off.total, 0);
    return { totalOfferings: total, details: data };
  } else if (type === 'tax') {
    // Simple tax form generation for donations
    const donations = data.filter(off => off.checks.some(check => check.name === userId)); // Assuming userId is name or something
    const totalDonations = donations.reduce((sum, off) => sum + off.total, 0);
    return { year: new Date().getFullYear(), totalDonations, details: donations };
  }
};

module.exports = { generateReport };