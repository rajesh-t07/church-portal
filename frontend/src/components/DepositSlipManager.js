import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { StyledComponents } from '../theme/StyledComponents';

const DepositSlipManager = ({ weekData, onClose, onDepositComplete }) => {
  const [depositSlip, setDepositSlip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculate totals from week data
  const calculateTotals = () => {
    // Use the totals from weekData first, then fall back to calculation
    const cashTotal = weekData.totalCash || weekData.cash?.reduce((sum, item) => sum + (parseFloat(item.denomination) * parseInt(item.count)), 0) || 0;
    const checksTotal = weekData.totalChecks || weekData.checks?.reduce((sum, check) => sum + parseFloat(check.amount || 0), 0) || 0;
    const totalOffering = parseFloat(weekData.totalOffering) || (cashTotal + checksTotal);
    const pastorGift = parseFloat(weekData.pastorGift) || 0;
    const finalDeposit = totalOffering - pastorGift;

    return {
      cashTotal,
      checksTotal,
      totalOffering,
      pastorGift,
      finalDeposit
    };
  };

  const { cashTotal, checksTotal, totalOffering, pastorGift, finalDeposit } = calculateTotals();

  const handleDepositSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        weekData: weekData,
        totals: {
          cashTotal,
          checksTotal,
          totalOffering,
          pastorGift,
          finalDeposit
        }
      };
      
      console.log('Sending payload:', payload);
      
      // Just save as pending - don't finalize yet
      await axios.post('/api/offerings/save-pending', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      setSuccess('✅ Weekly offering summary saved! Print the deposit slip for filing and take to bank for deposit.');
      setTimeout(() => {
        onDepositComplete?.();
        onClose();
      }, 3000);

    } catch (error) {
      setError('Error saving offering: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const generateDepositSlipHTML = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Parse individualCashDonations if it's a string
    let individualCashDonations = [];
    try {
      if (typeof weekData.individualCashDonations === 'string') {
        individualCashDonations = JSON.parse(weekData.individualCashDonations);
      } else if (Array.isArray(weekData.individualCashDonations)) {
        individualCashDonations = weekData.individualCashDonations;
      }
    } catch (e) {
      console.log('Error parsing individualCashDonations:', e);
      individualCashDonations = [];
    }

    // Calculate totals
    const cashTotal = parseFloat(weekData.totalCash) || 0;
    const checksTotal = parseFloat(weekData.totalChecks) || 0;
    const totalOffering = parseFloat(weekData.totalOffering) || 0;
    const pastorGift = parseFloat(weekData.pastorGift) || 0;
    const finalDeposit = totalOffering - pastorGift;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 2px solid #2c3e50;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2c3e50; padding-bottom: 15px;">
          <h1 style="color: #2c3e50; margin: 0;">Atlanta Little Flock Church</h1>
          <p style="margin: 5px 0; color: #666; font-style: italic;">Fear Not, little flock</p>
          <p style="margin: 5px 0; color: #666;">5465 Legacy Parkway, Suite 650, Plano, TX 75024</p>
          <p style="margin: 5px 0; color: #666;">1-972-369-6300</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h2 style="color: #2c3e50; margin: 0 0 10px 0;">Deposit Slip</h2>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;"><strong>Account: Checking (1234)</strong></p>
            <p style="margin: 0;">Prepared By: Church Admin</p>
            <p style="margin: 0;">Deposit Date: ${currentDate}</p>
          </div>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <!-- Cash Section -->
          <div style="flex: 1;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Cash</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Verified</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Denomination</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Quantity</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${individualCashDonations.length > 0
                  ? individualCashDonations.map(donation => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">☑</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">Cash Donation - ${donation.donorName || 'Anonymous'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">1</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${parseFloat(donation.amount || 0).toFixed(2)}</td>
                  </tr>
                `).join('') : ''}
                ${weekData.cash?.length > 0 
                  ? weekData.cash.map(item => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">☑</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.denominationName} ($${item.denomination})</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.count}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${(item.denomination * item.count).toFixed(2)}</td>
                  </tr>
                `).join('') : ''}
                ${(!weekData.individualCashDonations || weekData.individualCashDonations.length === 0) && (!weekData.cash || weekData.cash.length === 0) && cashTotal > 0
                  ? `<tr><td style="border: 1px solid #ddd; padding: 8px;">☑</td><td style="border: 1px solid #ddd; padding: 8px;">Offering Plate Cash (Combined Total)</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Mixed</td><td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${cashTotal.toFixed(2)}</td></tr>`
                  : ''}
                ${(!weekData.individualCashDonations || weekData.individualCashDonations.length === 0) && (!weekData.cash || weekData.cash.length === 0) && cashTotal === 0
                  ? '<tr><td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: center;">No cash recorded</td></tr>' : ''}
              </tbody>
            </table>
          </div>

          <!-- Checks Section -->
          <div style="flex: 1;">
            <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Checks</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Verified</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Donor</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Check Number</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${weekData.checks?.map(check => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">☑</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${check.name || 'Anonymous'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${check.checkNumber || 'N/A'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${parseFloat(check.amount || 0).toFixed(2)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: center;">No checks recorded</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Reconciliation Section -->
        <div style="margin-top: 20px; border-top: 2px solid #2c3e50; padding-top: 15px;">
          <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Reconciliation</h3>
          <div style="display: flex; justify-content: space-between;">
            <div style="width: 30%;">
              <p style="margin: 5px 0;"><strong>Verified</strong></p>
            </div>
            <div style="width: 30%;">
              <p style="margin: 5px 0;"><strong>Currency Type</strong></p>
              <p style="margin: 5px 0;">Cash</p>
              <p style="margin: 5px 0;">Checks</p>
              ${pastorGift > 0 ? '<p style="margin: 5px 0; color: #dc3545;">Pastor Gift (Cash Taken)</p>' : ''}
              <p style="margin: 5px 0; border-top: 1px solid #333; padding-top: 5px;"><strong>Final Deposit</strong></p>
            </div>
            <div style="width: 30%; text-align: right;">
              <p style="margin: 5px 0;"><strong>Total</strong></p>
              <p style="margin: 5px 0;">$${cashTotal.toFixed(2)}</p>
              <p style="margin: 5px 0;">$${checksTotal.toFixed(2)}</p>
              ${pastorGift > 0 ? `<p style="margin: 5px 0; color: #dc3545;">-$${pastorGift.toFixed(2)}</p>` : ''}
              <p style="margin: 5px 0; border-top: 1px solid #333; padding-top: 5px; font-size: 18px; font-weight: bold;">$${finalDeposit.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = generateDepositSlipHTML();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Weekly Offering Deposit - Atlanta Little Flock Church</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            @media print { body { margin: 0; padding: 20px; } @page { margin: 1in; } }
          </style>
        </head>
        <body>
          ${htmlContent}
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
              🖨️ Print for Manual Filing
            </button>
            <button onclick="generatePDF()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
              📄 Download PDF
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Close
            </button>
          </div>
          
          <script>
            function numberToWords(num) {
              const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
              const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
              const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
              const thousands = ['', 'thousand', 'million', 'billion'];

              if (num === 0) return 'zero';

              function convertHundreds(n) {
                let result = '';
                if (n >= 100) {
                  result += ones[Math.floor(n / 100)] + ' hundred ';
                  n %= 100;
                }
                if (n >= 20) {
                  result += tens[Math.floor(n / 10)] + ' ';
                  n %= 10;
                } else if (n >= 10) {
                  result += teens[n - 10] + ' ';
                  return result;
                }
                if (n > 0) {
                  result += ones[n] + ' ';
                }
                return result;
              }

              const parts = [];
              let groupIndex = 0;
              
              while (num > 0) {
                if (num % 1000 !== 0) {
                  parts.unshift(convertHundreds(num % 1000) + thousands[groupIndex]);
                }
                num = Math.floor(num / 1000);
                groupIndex++;
              }
              
              return parts.join(' ').trim();
            }

            function generatePDF() {
              const { jsPDF } = window.jspdf;
              const doc = new jsPDF('p', 'mm', 'a4'); // A4 format
              
              // Calculate totals
              const cashTotal = ${parseFloat(weekData.totalCash) || 0};
              const checksTotal = ${parseFloat(weekData.totalChecks) || 0};
              const totalOffering = ${parseFloat(weekData.totalOffering) || 0};
              const pastorGift = ${parseFloat(weekData.pastorGift) || 0};
              const finalDeposit = totalOffering - pastorGift;
              
              let currentPage = 1;
              let yPos = 20;
              const pageHeight = 297; // A4 height in mm
              const bottomMargin = 30;
              
              const addNewPage = () => {
                doc.addPage();
                currentPage++;
                yPos = 20;
                addHeader();
              };
              
              const addHeader = () => {
                // Professional header
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('Atlanta Little Flock Church', 105, yPos, { align: 'center' });
                yPos += 8;
                
                doc.setFontSize(11);
                doc.setFont(undefined, 'italic');
                doc.text('Fear Not, little flock', 105, yPos, { align: 'center' });
                yPos += 6;
                
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.text('5465 Legacy Parkway, Suite 650, Plano, TX 75024', 105, yPos, { align: 'center' });
                yPos += 4;
                doc.text('1-972-369-6300', 105, yPos, { align: 'center' });
                yPos += 10;
                
                // Title section with background
                doc.setFillColor(240, 240, 240);
                doc.rect(20, yPos, 170, 15, 'F');
                
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('Weekly Offering Summary', 25, yPos + 6);
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.text('Week Ending: ${new Date(weekData.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}', 25, yPos + 11);
                
                doc.text('Prepared By: Church Admin', 140, yPos + 6);
                doc.text('Page ' + currentPage, 140, yPos + 11);
                
                yPos += 20;
              };
              
              // Initial header
              addHeader();
              
              // Executive Summary
              doc.setFontSize(12);
              doc.setFont(undefined, 'bold');
              doc.text('Executive Summary', 20, yPos);
              yPos += 8;
              
              const summaryData = [
                ['Total Individual Cash Donations:', '$' + (individualCashDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)).toFixed(2)],
                ['Total Anonymous Cash (Denominations):', '$' + (cashTotal - individualCashDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)).toFixed(2)],
                ['Total Check Donations:', '$' + checksTotal.toFixed(2)],
                ['Gross Total Offering:', '$' + totalOffering.toFixed(2)]
              ];
              
              if (pastorGift > 0) {
                summaryData.push(['Less: Pastor Gift (Cash):', '($' + pastorGift.toFixed(2) + ')']);
              }
              
              summaryData.push(['Net Amount for Deposit:', '$' + finalDeposit.toFixed(2)]);
              
              doc.setFontSize(10);
              summaryData.forEach(([label, value]) => {
                doc.setFont(undefined, 'normal');
                doc.text(label, 25, yPos);
                doc.setFont(undefined, 'bold');
                doc.text(value, 130, yPos);
                yPos += 6;
              });
              
              yPos += 10;
              
              // Individual Cash Donations Section
              // Parse individualCashDonations safely
              let individualCashDonations = [];
              try {
                const rawData = ${JSON.stringify(weekData.individualCashDonations || [])};
                if (typeof rawData === 'string') {
                  individualCashDonations = JSON.parse(rawData);
                } else if (Array.isArray(rawData)) {
                  individualCashDonations = rawData;
                }
              } catch (e) {
                console.log('Error parsing individualCashDonations in PDF:', e);
                individualCashDonations = [];
              }
              if (individualCashDonations.length > 0) {
                if (yPos > pageHeight - bottomMargin - 60) {
                  addNewPage();
                }
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Individual Cash Donations (' + individualCashDonations.length + ')', 20, yPos);
                yPos += 8;
                
                // Table header
                doc.setFillColor(230, 230, 230);
                doc.rect(20, yPos, 170, 8, 'F');
                
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                doc.text('#', 25, yPos + 5);
                doc.text('Donor Name', 35, yPos + 5);
                doc.text('Amount', 140, yPos + 5);
                doc.text('Date', 165, yPos + 5);
                yPos += 10;
                
                // Cash entries
                doc.setFont(undefined, 'normal');
                individualCashDonations.forEach((donation, index) => {
                  if (yPos > pageHeight - bottomMargin) {
                    addNewPage();
                    
                    // Repeat header on new page
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text('Individual Cash Donations (continued)', 20, yPos);
                    yPos += 8;
                    
                    doc.setFillColor(230, 230, 230);
                    doc.rect(20, yPos, 170, 8, 'F');
                    
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.text('#', 25, yPos + 5);
                    doc.text('Donor Name', 35, yPos + 5);
                    doc.text('Amount', 140, yPos + 5);
                    doc.text('Date', 165, yPos + 5);
                    yPos += 10;
                    
                    doc.setFont(undefined, 'normal');
                  }
                  
                  doc.setFontSize(9);
                  doc.text((index + 1).toString(), 25, yPos);
                  doc.text(donation.donorName ? donation.donorName.substring(0, 30) : 'Anonymous', 35, yPos);
                  doc.text('$' + parseFloat(donation.amount || 0).toFixed(2), 140, yPos);
                  doc.text(new Date().toLocaleDateString(), 165, yPos);
                  yPos += 6;
                });
                
                yPos += 10;
              }
              
              // Check Donations Section (detailed listing)
              const checkItems = ${JSON.stringify(weekData.checks || [])};
              if (checkItems.length > 0) {
                if (yPos > pageHeight - bottomMargin - 60) {
                  addNewPage();
                }
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Check Donations (' + checkItems.length + ' checks)', 20, yPos);
                yPos += 8;
                
                // Check table header
                doc.setFillColor(230, 230, 230);
                doc.rect(20, yPos, 170, 8, 'F');
                
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                doc.text('#', 25, yPos + 5);
                doc.text('Donor Name', 35, yPos + 5);
                doc.text('Check Number', 100, yPos + 5);
                doc.text('Amount', 140, yPos + 5);
                doc.text('Date', 165, yPos + 5);
                yPos += 10;
                
                // Check entries
                doc.setFont(undefined, 'normal');
                checkItems.forEach((check, index) => {
                  if (yPos > pageHeight - bottomMargin) {
                    addNewPage();
                    
                    // Repeat header on new page
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text('Check Donations (continued)', 20, yPos);
                    yPos += 8;
                    
                    doc.setFillColor(230, 230, 230);
                    doc.rect(20, yPos, 170, 8, 'F');
                    
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.text('#', 25, yPos + 5);
                    doc.text('Donor Name', 35, yPos + 5);
                    doc.text('Check Number', 100, yPos + 5);
                    doc.text('Amount', 140, yPos + 5);
                    doc.text('Date', 165, yPos + 5);
                    yPos += 10;
                    
                    doc.setFont(undefined, 'normal');
                  }
                  
                  doc.setFontSize(9);
                  doc.text((index + 1).toString(), 25, yPos);
                  doc.text((check.name || 'Anonymous').substring(0, 25), 35, yPos);
                  doc.text(check.checkNumber || 'N/A', 100, yPos);
                  doc.text('$' + parseFloat(check.amount || 0).toFixed(2), 140, yPos);
                  doc.text(new Date().toLocaleDateString(), 165, yPos);
                  yPos += 6;
                });
                
                yPos += 10;
              }
              
              // Anonymous Cash Denominations Section
              const cashItems = ${JSON.stringify(weekData.cash || [])};
              const haseDenominations = cashItems.length > 0;
              if (haseDenominations) {
                if (yPos > pageHeight - bottomMargin - 50) {
                  addNewPage();
                }
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Anonymous Cash Denominations', 20, yPos);
                yPos += 8;
                
                // Denominations table
                doc.setFillColor(230, 230, 230);
                doc.rect(20, yPos, 170, 8, 'F');
                
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                doc.text('Denomination', 25, yPos + 5);
                doc.text('Quantity', 80, yPos + 5);
                doc.text('Total Amount', 140, yPos + 5);
                yPos += 10;
                
                doc.setFont(undefined, 'normal');
                cashItems.forEach((item) => {
                  if (item.count > 0) {
                    let denomText = '';
                    if (item.denomination == 100) denomText = 'One Hundred Dollar Bills';
                    else if (item.denomination == 50) denomText = 'Fifty Dollar Bills';
                    else if (item.denomination == 20) denomText = 'Twenty Dollar Bills';
                    else if (item.denomination == 10) denomText = 'Ten Dollar Bills';
                    else if (item.denomination == 5) denomText = 'Five Dollar Bills';
                    else if (item.denomination == 1) denomText = 'One Dollar Bills';
                    else denomText = item.denominationName;
                    
                    doc.text(denomText, 25, yPos);
                    doc.text(item.count.toString(), 80, yPos);
                    doc.text('$' + (item.denomination * item.count).toFixed(2), 140, yPos);
                    yPos += 6;
                  }
                });
                
                yPos += 10;
              }
              
              // Final Reconciliation Section
              if (yPos > pageHeight - bottomMargin - 50) {
                addNewPage();
              }
              
              doc.setFillColor(250, 250, 250);
              doc.rect(20, yPos, 170, 45, 'F');
              
              doc.setFontSize(12);
              doc.setFont(undefined, 'bold');
              doc.text('Final Reconciliation', 25, yPos + 8);
              
              doc.setFontSize(10);
              doc.setFont(undefined, 'normal');
              doc.text('Net Deposit Amount: $' + finalDeposit.toFixed(2), 25, yPos + 18);
              
              doc.setFont(undefined, 'italic');
              doc.text('Amount in Words:', 25, yPos + 25);
              const dollars = Math.floor(finalDeposit);
              const cents = Math.round((finalDeposit - dollars) * 100);
              const amountInWords = numberToWords(dollars).toUpperCase() + ' DOLLARS AND ' + cents + '/100';
              doc.text(amountInWords, 25, yPos + 32);
              
              yPos += 50;
              
              // Footer signatures
              if (yPos > pageHeight - bottomMargin - 20) {
                addNewPage();
              }
              
              doc.setFontSize(9);
              doc.setFont(undefined, 'normal');
              doc.text('Prepared by: ___________________________    Date: ___________', 25, yPos);
              yPos += 8;
              doc.text('Reviewed by: ___________________________    Date: ___________', 25, yPos);
              yPos += 8;
              doc.text('Approved by: ___________________________    Date: ___________', 25, yPos);
              
              doc.save('Weekly-Offering-Summary-' + new Date().toISOString().split('T')[0] + '.pdf');
            }
              
              // Final summary box
              if (yPos > 220) {
                doc.addPage();
                yPos = 50;
              }
              
              // Draw summary box
              doc.setLineWidth(1);
              doc.rect(20, yPos - 5, 170, 45);
              
              doc.setFontSize(14);
              doc.setFont(undefined, 'bold');
              doc.text('DEPOSIT SUMMARY', 105, yPos + 5, { align: 'center' });
              
              yPos += 15;
              doc.setFontSize(11);
              doc.setFont(undefined, 'normal');
              
              doc.text('Total Cash:', 30, yPos);
              doc.text('$' + cashTotal.toFixed(2), 170, yPos, { align: 'right' });
              yPos += 7;
              
              doc.text('Total Checks:', 30, yPos);
              doc.text('$' + checksTotal.toFixed(2), 170, yPos, { align: 'right' });
              yPos += 7;
              
              doc.text('Gross Total:', 30, yPos);
              doc.text('$' + totalOffering.toFixed(2), 170, yPos, { align: 'right' });
              yPos += 7;
              
              if (pastorGift > 0) {
                doc.setTextColor(150, 0, 0);
                doc.text('Less: Pastor Gift (Cash):', 30, yPos);
                doc.text('-$' + pastorGift.toFixed(2), 170, yPos, { align: 'right' });
                yPos += 7;
                doc.setTextColor(0, 0, 0);
              }
              
              // Final amount line
              doc.setLineWidth(0.5);
              doc.line(30, yPos, 180, yPos);
              yPos += 7;
              
              doc.setFontSize(12);
              doc.setFont(undefined, 'bold');
              doc.text('NET DEPOSIT AMOUNT:', 30, yPos);
              doc.text('$' + finalDeposit.toFixed(2), 170, yPos, { align: 'right' });
              
              // Amount in words
              yPos += 15;
              const dollars = Math.floor(finalDeposit);
              const cents = Math.round((finalDeposit - dollars) * 100);
              const amountInWords = numberToWords(dollars).toUpperCase() + ' DOLLARS';
              const centWords = cents > 0 ? ' AND ' + cents + '/100' : ' AND 00/100';
              
              doc.setFontSize(10);
              doc.setFont(undefined, 'normal');
              doc.text('Amount in Words:', 30, yPos);
              yPos += 6;
              doc.setFont(undefined, 'bold');
              doc.text(amountInWords + centWords, 30, yPos);
              
              // Footer
              yPos += 20;
              if (yPos > 250) {
                doc.addPage();
                yPos = 50;
              }
              
              doc.setFontSize(9);
              doc.setFont(undefined, 'normal');
              doc.text('Prepared by: ___________________________    Date: ___________', 30, yPos);
              yPos += 10;
              doc.text('Bank Teller: ____________________________    Date: ___________', 30, yPos);
              
              doc.save('Church-Deposit-Slip-' + new Date().toISOString().split('T')[0] + '.pdf');
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        ...StyledComponents.Card,
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e9ecef'
        }}>
          <h2 style={{
            margin: 0,
            color: '#2c3e50',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            📋 Weekly Offering Summary
          </h2>
          <button
            onClick={onClose}
            style={{
              ...StyledComponents.ButtonSecondary,
              ...StyledComponents.ButtonSmall
            }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{
          ...StyledComponents.Alert,
          background: '#e3f2fd',
          color: '#1565c0',
          border: '1px solid #bbdefb',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>📅 Sunday Offering Complete!</div>
          <div>1. Print the deposit slip below for filing and leadership sharing</div>
          <div>2. Take printed slip to bank for deposit during weekday</div>
          <div>3. Return to "Manage Deposits" to upload bank completion slip</div>
        </div>

        {error && (
          <div style={{
            ...StyledComponents.Alert,
            ...StyledComponents.AlertError
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            ...StyledComponents.Alert,
            ...StyledComponents.AlertSuccess
          }}>
            {success}
          </div>
        )}



        {/* Deposit Summary */}
        <div style={{
          ...StyledComponents.Card,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            💰 Deposit Summary
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Cash Total</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${cashTotal.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Checks Total</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${checksTotal.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Pastor Gift</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffeaa7' }}>-${pastorGift.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '1rem' }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Final Deposit</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>${finalDeposit.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Deposit Slip Upload */}
        <div style={{
          ...StyledComponents.Card,
          background: '#f8f9fa',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            color: '#2c3e50',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            📄 Bank Deposit Slip (Optional)
          </h3>
          <div style={StyledComponents.FormGroup}>
            <label style={StyledComponents.Label}>
              Upload photo/scan of bank deposit slip
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDepositSlip(e.target.files[0])}
              style={StyledComponents.Input}
            />
            {depositSlip && (
              <div style={{
                ...StyledComponents.StatusSuccess,
                marginTop: '0.5rem',
                fontSize: '0.875rem'
              }}>
                ✅ File selected: {depositSlip.name}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          paddingTop: '1rem',
          borderTop: '1px solid #e9ecef'
        }}>
          <button
            onClick={generatePDF}
            style={{
              ...StyledComponents.ButtonSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📄 Print Deposit Slip
          </button>
          <button
            onClick={handleDepositSubmit}
            disabled={loading}
            style={{
              ...StyledComponents.Button,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? '⏳ Saving...' : '� Save & Print Summary'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositSlipManager;