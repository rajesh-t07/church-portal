const PDFDocument = require('pdfkit');

class PDFService {
  constructor() {
    this.pageMargin = 50;
    this.primaryColor = '#2c3e50';
    this.secondaryColor = '#3498db';
    this.accentColor = '#e74c3c';
  }

  // Create a new PDF document with standard settings
  createDocument() {
    return new PDFDocument({
      size: 'A4',
      margin: this.pageMargin,
      info: {
        Title: 'Atlanta Little Flock Church Report',
        Author: 'Atlanta Little Flock Church',
        Subject: 'Financial Report',
        Creator: 'Atlanta Little Flock Church Portal'
      }
    });
  }

  // Add header with church branding
  addHeader(doc, title, subtitle = null) {
    const pageWidth = doc.page.width;
    const marginLeft = this.pageMargin;
    const marginRight = this.pageMargin;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Header background
    doc.rect(0, 0, pageWidth, 80)
       .fill(this.primaryColor);

    // Church name
    doc.fill('white')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('Atlanta Little Flock Church', marginLeft, 15, { width: contentWidth, align: 'center' });

    // Church motto
    doc.fontSize(12)
       .font('Helvetica')
       .text('Fear Not, little flock', marginLeft, 38, { width: contentWidth, align: 'center' });

    // Report title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(title, marginLeft, 55, { width: contentWidth, align: 'center' });

    // Subtitle if provided
    if (subtitle) {
      doc.fontSize(12)
         .text(subtitle, marginLeft, 62, { width: contentWidth, align: 'center' });
    }

    // Reset position and color
    doc.y = 100;
    doc.fill('black');

    return doc;
  }

    // Add footer with page numbers and generation date
  addFooter(doc) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginLeft = this.pageMargin;
    const marginRight = this.pageMargin;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Save current position
    const currentY = doc.y;

    // Move to footer position
    const footerY = pageHeight - 50;

    // Footer line
    doc.strokeColor('#ddd')
       .lineWidth(1)
       .moveTo(marginLeft, footerY)
       .lineTo(pageWidth - marginRight, footerY)
       .stroke();

    // Church information
    doc.fontSize(10)
       .fill(this.primaryColor)
       .font('Helvetica-Bold')
       .text('Atlanta Little Flock Church', marginLeft, footerY + 5, { width: contentWidth, align: 'center' });
    
    doc.fontSize(8)
       .fill('#666')
       .font('Helvetica')
       .text('7445 Cheswick Ct, Atlanta GA 30350 Tel: 404-660-6501 / 470-361-5878', marginLeft, footerY + 18, { width: contentWidth, align: 'center' })
       .text('www: atlantalittleflock.org       Email: atlantalittleflock@gmail.com', marginLeft, footerY + 30, { width: contentWidth, align: 'center' });

    // Generation date and page number
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.fontSize(7)
       .fill('#999')
       .text(`Generated on ${dateString} at ${timeString}`, marginLeft, footerY + 45, 
             { width: contentWidth / 2, align: 'left' });

    // Page number
    doc.text(`Page ${doc.bufferedPageRange().start + 1}`, marginLeft + contentWidth / 2, footerY + 45,
             { width: contentWidth / 2, align: 'right' });

    // Restore position (don't move cursor for content)
    doc.y = currentY;
    
    return doc;
  }

  // Add a styled table with proper page break handling
  addTable(doc, headers, rows, options = {}) {
    const tableWidth = options.width || (doc.page.width - 2 * this.pageMargin);
    const rowHeight = options.rowHeight || 25;
    const headerHeight = options.headerHeight || 30;
    const fontSize = options.fontSize || 10;
    const headerFontSize = options.headerFontSize || 11;
    const maxRowsPerPage = Math.floor((doc.page.height - 200) / rowHeight); // Leave space for header/footer

    // Calculate column widths
    const columnCount = headers.length;
    const columnWidths = options.columnWidths || 
      Array(columnCount).fill(tableWidth / columnCount);

    // Function to draw table header
    const drawHeader = (yPosition) => {
      doc.rect(this.pageMargin, yPosition, tableWidth, headerHeight)
         .fill(this.primaryColor);

      doc.fill('white')
         .fontSize(headerFontSize)
         .font('Helvetica-Bold');

      let currentX = this.pageMargin;
      headers.forEach((header, index) => {
        doc.text(header, currentX + 5, yPosition + 8, {
          width: columnWidths[index] - 10,
          align: options.headerAlign && options.headerAlign[index] || 'left'
        });
        currentX += columnWidths[index];
      });

      return yPosition + headerHeight;
    };

    // Start table
    let currentY = doc.y + 10;
    
    // Check if we need a new page for the header
    if (currentY + headerHeight + rowHeight > doc.page.height - 100) {
      doc.addPage();
      currentY = 50;
    }

    currentY = drawHeader(currentY);
    let rowsOnCurrentPage = 0;

    // Draw rows
    doc.fill('black')
       .fontSize(fontSize)
       .font('Helvetica');

    rows.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (rowsOnCurrentPage >= maxRowsPerPage || currentY + rowHeight > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
        currentY = drawHeader(currentY);
        rowsOnCurrentPage = 0;
      }

      const isEvenRow = rowIndex % 2 === 0;
      
      // Alternate row backgrounds
      if (!isEvenRow) {
        doc.rect(this.pageMargin, currentY, tableWidth, rowHeight)
           .fill('#f8f9fa')
           .fill('black'); // Reset text color
      }

      let currentX = this.pageMargin;
      row.forEach((cell, cellIndex) => {
        const cellValue = cell !== null && cell !== undefined ? cell.toString() : '';
        doc.text(cellValue, currentX + 5, currentY + 6, {
          width: columnWidths[cellIndex] - 10,
          align: options.cellAlign && options.cellAlign[cellIndex] || 'left'
        });
        currentX += columnWidths[cellIndex];
      });

      // Draw row border
      doc.strokeColor('#ddd')
         .lineWidth(0.5)
         .moveTo(this.pageMargin, currentY + rowHeight)
         .lineTo(this.pageMargin + tableWidth, currentY + rowHeight)
         .stroke();

      currentY += rowHeight;
      rowsOnCurrentPage++;
    });

    doc.y = currentY + 20;
    return doc;
  }

  // Add summary section with key metrics
  addSummarySection(doc, title, metrics) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fill(this.primaryColor)
       .text(title, { align: 'left' });

    doc.y += 10;

    const boxWidth = (doc.page.width - 2 * this.pageMargin - 20) / 2;
    const boxHeight = 60;
    const startX = this.pageMargin;
    let currentX = startX;
    let currentY = doc.y;

    metrics.forEach((metric, index) => {
      if (index > 0 && index % 2 === 0) {
        currentY += boxHeight + 10;
        currentX = startX;
      }

      // Metric box
      doc.rect(currentX, currentY, boxWidth, boxHeight)
         .fill('#f8f9fa')
         .stroke('#ddd');

      // Metric value
      doc.fill(this.secondaryColor)
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(metric.value, currentX + 10, currentY + 10, {
           width: boxWidth - 20,
           align: 'center'
         });

      // Metric label
      doc.fill('#666')
         .fontSize(11)
         .font('Helvetica')
         .text(metric.label, currentX + 10, currentY + 35, {
           width: boxWidth - 20,
           align: 'center'
         });

      currentX += boxWidth + 10;
    });

    doc.y = currentY + boxHeight + 20;
    doc.fill('black');
    return doc;
  }

  // Format currency values
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }

  // Format dates
  formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Check if new page is needed with better logic
  checkPageBreak(doc, requiredHeight = 100) {
    const bottomMargin = 80; // Space for footer
    if (doc.y + requiredHeight > doc.page.height - bottomMargin) {
      doc.addPage();
      doc.y = 50; // Top margin for new page
    }
    return doc;
  }

  // Generate offerings report PDF
  async generateOfferingsReport(data, dateRange) {
    return new Promise((resolve, reject) => {
      try {
        const doc = this.createDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add header
        this.addHeader(doc, 'Offerings Report', 
          `${this.formatDate(dateRange.startDate)} - ${this.formatDate(dateRange.endDate)}`);

        // Add summary
        const metrics = [
          { label: 'Total Offerings', value: this.formatCurrency(data.summary.totalAmount) },
          { label: 'Cash Offerings', value: this.formatCurrency(data.summary.cashAmount) },
          { label: 'Check Offerings', value: this.formatCurrency(data.summary.checkAmount) },
          { label: 'Number of Offerings', value: data.summary.donationCount.toString() }
        ];
        this.addSummarySection(doc, 'Summary', metrics);

        // Add offerings table
        if (data.donations && data.donations.length > 0) {
          const headers = ['Date', 'Donor', 'Amount', 'Payment Method', 'Purpose'];
          const columnWidths = [80, 150, 80, 100, 120];
          const rows = data.donations.map(donation => [
            this.formatDate(donation.donationDate),
            donation.Donor?.name || 'Anonymous',
            this.formatCurrency(donation.amount),
            donation.paymentMethod || 'Unknown',
            donation.purpose || 'General'
          ]);

          this.checkPageBreak(doc, 200);
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text('Detailed Offerings', { align: 'left' });

          this.addTable(doc, headers, rows, {
            columnWidths,
            cellAlign: ['left', 'left', 'right', 'center', 'left']
          });
        }

        this.addFooter(doc);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate expenses report PDF
  async generateExpensesReport(data, dateRange) {
    return new Promise((resolve, reject) => {
      try {
        const doc = this.createDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add header
        this.addHeader(doc, 'Expenses Report', 
          `${this.formatDate(dateRange.startDate)} - ${this.formatDate(dateRange.endDate)}`);

        // Add summary
        const totalAmount = data.expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) || 0;
        const reimbursableCount = data.expenses?.filter(exp => exp.submissionId).length || 0;
        const directCount = data.expenses?.filter(exp => !exp.submissionId).length || 0;

        const metrics = [
          { label: 'Total Expenses', value: this.formatCurrency(totalAmount) },
          { label: 'Reimbursable Expenses', value: reimbursableCount.toString() },
          { label: 'Direct Church Expenses', value: directCount.toString() },
          { label: 'Total Transactions', value: (data.expenses?.length || 0).toString() }
        ];
        this.addSummarySection(doc, 'Summary', metrics);

        // Add expenses table
        if (data.expenses && data.expenses.length > 0) {
          const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
          const columnWidths = [80, 200, 100, 80, 80];
          const rows = data.expenses.map(expense => [
            this.formatDate(expense.submissionDate),
            expense.description || 'No description',
            expense.category || 'Other',
            this.formatCurrency(expense.amount),
            expense.submissionId ? 'Reimbursable' : 'Direct'
          ]);

          this.checkPageBreak(doc, 200);
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text('Detailed Expenses', { align: 'left' });

          this.addTable(doc, headers, rows, {
            columnWidths,
            cellAlign: ['left', 'left', 'left', 'right', 'center']
          });
        }

        this.addFooter(doc);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate donor summary report PDF
  async generateDonorSummaryReport(data, year) {
    return new Promise((resolve, reject) => {
      try {
        const doc = this.createDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add header
        this.addHeader(doc, 'Donor Summary Report', `Year ${year}`);

        // Calculate summary metrics
        const totalDonors = data.length;
        const totalAmount = data.reduce((sum, donor) => sum + parseFloat(donor.totalAmount || 0), 0);
        const averageGiving = totalDonors > 0 ? totalAmount / totalDonors : 0;
        const totalDonations = data.reduce((sum, donor) => sum + parseInt(donor.donationCount || 0), 0);

        // Add summary
        const metrics = [
          { label: 'Total Donors', value: totalDonors.toString() },
          { label: 'Total Giving', value: this.formatCurrency(totalAmount) },
          { label: 'Average per Donor', value: this.formatCurrency(averageGiving) },
          { label: 'Total Donations', value: totalDonations.toString() }
        ];
        this.addSummarySection(doc, 'Summary', metrics);

        // Add donor table
        if (data && data.length > 0) {
          const headers = ['Donor Name', 'Email', 'Total Amount', 'Donations', 'Average Gift'];
          const columnWidths = [140, 160, 90, 70, 80];
          const rows = data.map(donor => [
            donor.name || 'Unknown',
            donor.email || 'No email',
            this.formatCurrency(donor.totalAmount),
            donor.donationCount.toString(),
            this.formatCurrency(parseFloat(donor.totalAmount || 0) / parseInt(donor.donationCount || 1))
          ]);

          this.checkPageBreak(doc, 200);
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text('Donor Details', { align: 'left' });

          this.addTable(doc, headers, rows, {
            columnWidths,
            cellAlign: ['left', 'left', 'right', 'center', 'right']
          });
        }

        this.addFooter(doc);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate individual donor report PDF
  async generateIndividualDonorReport(data, year) {
    return new Promise((resolve, reject) => {
      try {
        const doc = this.createDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add header
        this.addHeader(doc, `Individual Donor Report: ${data.donorName}`, `Year ${year}`);

        // Add summary
        const metrics = [
          { label: 'Total Donations', value: this.formatCurrency(data.totalAmount) },
          { label: 'Number of Gifts', value: data.donationCount.toString() },
          { label: 'Average Gift', value: this.formatCurrency(data.averageGift) },
          { label: 'Tax Year', value: year.toString() }
        ];
        this.addSummarySection(doc, 'Annual Summary', metrics);

        // Add space before donations table
        doc.y += 20;

        // Add donations table
        if (data.donations && data.donations.length > 0) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .fill(this.primaryColor)
             .text('Donation History', { align: 'left' });

          doc.y += 10;

          const headers = ['Date', 'Amount', 'Payment Method', 'Purpose'];
          const columnWidths = [120, 100, 120, 200];
          const rows = data.donations.map(donation => [
            this.formatDate(donation.donationDate),
            this.formatCurrency(donation.amount),
            donation.paymentMethod || 'Unknown',
            donation.purpose || 'General'
          ]);

          this.addTable(doc, headers, rows, {
            columnWidths,
            cellAlign: ['left', 'right', 'center', 'left'],
            rowHeight: 22,
            fontSize: 9
          });
        }

        // Add tax deduction statement
        this.checkPageBreak(doc, 100);
        doc.y += 30;
        
        // Donor greeting and tax statement
        doc.fontSize(12)
           .fill(this.primaryColor)
           .font('Helvetica')
           .text(`Dear ${data.donorName}`, { align: 'left' });
        
        doc.y += 15;
        doc.fontSize(10)
           .fill('#333')
           .text(`Our records show that you have contributed to Atlanta Little Flock Church in the Year ${year}. Itemized contribution details are mentioned below.`, { align: 'left' });
           
        doc.y += 30;
        
        // Thank you message and tax deduction info
        doc.text(`Thank you for joining us to impact numerous lives and in expansion of God's kingdom through your donations. We praise and thank our Lord Jesus Christ for His provision and faithfulness. Your gift is a tax-deductible contribution through our nonprofit 501(c)(3) organization. Our nonprofit Employer Identification Number (EIN): 81-3421276.`, { align: 'justify' });
        
        doc.y += 20;
        doc.text('God bless you!', { align: 'left' });
        
        doc.y += 15;
        doc.text('Sincerely yours,', { align: 'left' });
        
        doc.y += 30;
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Vijay Kumar Suttakote', { align: 'left' });
           
        doc.y += 5;
        doc.fontSize(10)
           .font('Helvetica')
           .text('Treasurer', { align: 'left' });
           
        doc.y += 5;
        doc.text('Atlanta Little Flock Church', { align: 'left' });

        this.addFooter(doc);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Convert amount to words for check writing
  convertAmountToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Million', 'Billion'];

    if (amount === 0) return 'Zero Dollars and 00/100';

    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);

    function convertToWords(num) {
      if (num === 0) return '';
      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convertToWords(num % 100) : '');
      
      for (let i = 0; i < thousands.length; i++) {
        const unit = Math.pow(1000, i + 1);
        if (num < unit) {
          const quotient = Math.floor(num / Math.pow(1000, i));
          const remainder = num % Math.pow(1000, i);
          return convertToWords(quotient) + ' ' + thousands[i] + (remainder ? ' ' + convertToWords(remainder) : '');
        }
      }
      
      return num.toString();
    }

    const dollarWords = convertToWords(dollars);
    const centsPart = cents.toString().padStart(2, '0');
    
    return `${dollarWords} Dollars and ${centsPart}/100`;
  }

  // Generate Weekly Offering Summary PDF
  async generateWeeklyOfferingSummary(offeringData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = this.createDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Professional deposit slip format
        const pageWidth = doc.page.width;
        const marginLeft = this.pageMargin;
        const marginRight = this.pageMargin;
        const contentWidth = pageWidth - marginLeft - marginRight;

        // Church letterhead with border
        doc.rect(0, 0, pageWidth, 140).stroke('#2c3e50').lineWidth(2);
        
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fill(this.primaryColor)
           .text('Atlanta Little Flock Church', marginLeft, 30, { width: contentWidth, align: 'center' });

        doc.fontSize(12)
           .font('Helvetica')
           .fill('#666')
           .text('Fear Not, little flock', marginLeft, 55, { width: contentWidth, align: 'center' });

        doc.fontSize(10)
           .text('5465 Legacy Parkway, Suite 650, Plano, TX 75024', marginLeft, 75, { width: contentWidth, align: 'center' })
           .text('1-972-369-6300', marginLeft, 90, { width: contentWidth, align: 'center' });

        // Horizontal line
        doc.strokeColor('#ddd')
           .lineWidth(1)
           .moveTo(marginLeft, 110)
           .lineTo(pageWidth - marginRight, 110)
           .stroke();

        // Weekly Offering Summary header section
        doc.y = 160;
        
        // Handle date properly - avoid timezone issues
        let offeringDate, formattedDate, formattedTitle;
        
        try {
          // If date is string format like "2025-04-20", handle it properly
          if (typeof offeringData.date === 'string') {
            // Split the date string and create date manually to avoid timezone issues
            const dateParts = offeringData.date.split('T')[0].split('-');
            offeringDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          } else {
            offeringDate = new Date(offeringData.date);
          }
          
          formattedDate = offeringDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          // Create a more specific title that includes the date
          const dayOfWeek = offeringDate.toLocaleDateString('en-US', { weekday: 'long' });
          const monthDay = offeringDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          formattedTitle = `${dayOfWeek} Offering Summary - ${monthDay}`;
          
        } catch (error) {
          console.error('Date parsing error:', error);
          formattedDate = 'Invalid Date';
          formattedTitle = 'Weekly Offering Summary';
        }

        // Left side - Sunday Offering Summary title with date
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fill('black')
           .text(formattedTitle, marginLeft, 160, { width: contentWidth * 0.7 });

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Submission ID: #${offeringData.id || 'N/A'}`, marginLeft, 185);

        // Status badge
        const statusText = offeringData.status || 'PENDING';
        const statusColor = statusText.includes('PENDING') ? '#856404' : '#155724';
        const statusBg = statusText.includes('PENDING') ? '#fff3cd' : '#d4edda';
        
        doc.rect(marginLeft, 205, 180, 20)
           .fill(statusBg)
           .stroke(statusColor);
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fill(statusColor)
           .text(statusText.toUpperCase(), marginLeft + 10, 210);

        // Right side - Date and prepared by info
        const rightX = marginLeft + contentWidth * 0.7;
        doc.fontSize(10)
           .font('Helvetica')
           .fill('black')
           .text('Prepared By: Church Admin', rightX, 160, { align: 'right' })
           .text(`Prepared: ${new Date().toLocaleDateString('en-US')}`, rightX, 180, { align: 'right' });

        // Main content tables
        doc.y = 250;

        // Cash section - Left side
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fill(this.primaryColor)
           .text('Cash', marginLeft, doc.y);

        const cashTableY = doc.y + 20;
        const cashTableWidth = contentWidth * 0.48;
        
        // Cash table header
        doc.rect(marginLeft, cashTableY, cashTableWidth, 25)
           .fill('#f8f9fa')
           .stroke('#dee2e6');

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fill('black')
           .text('Verified', marginLeft + 5, cashTableY + 8)
           .text('Denomination', marginLeft + 60, cashTableY + 8)
           .text('Quantity', marginLeft + 150, cashTableY + 8)
           .text('Amount', marginLeft + 200, cashTableY + 8);

        let currentCashY = cashTableY + 25;
        let cashTotal = 0;

        // Cash denominations
        if (offeringData.cash && Array.isArray(offeringData.cash) && offeringData.cash.length > 0) {
          offeringData.cash.forEach(cashItem => {
            if (cashItem.count && cashItem.count > 0) {
              const amount = parseFloat(cashItem.denomination) * parseInt(cashItem.count);
              cashTotal += amount;

              // Row background (alternating)
              if ((currentCashY - cashTableY - 25) / 20 % 2 === 1) {
                doc.rect(marginLeft, currentCashY, cashTableWidth, 20)
                   .fill('#f8f9fa');
              }

              // Checkbox
              doc.rect(marginLeft + 10, currentCashY + 6, 8, 8)
                 .stroke('#333')
                 .fill('white');
              
              doc.fill('green')
                 .fontSize(6)
                 .text('✓', marginLeft + 11, currentCashY + 7);

              // Denomination name
              const denomName = parseInt(cashItem.denomination) === 100 ? 'Hundred ($100)' : 
                               parseInt(cashItem.denomination) === 50 ? 'Fifty ($50)' :
                               parseInt(cashItem.denomination) === 20 ? 'Twenty ($20)' :
                               parseInt(cashItem.denomination) === 10 ? 'Ten ($10)' :
                               parseInt(cashItem.denomination) === 5 ? 'Five ($5)' :
                               'One ($1)';

              doc.fontSize(9)
                 .font('Helvetica')
                 .fill('black')
                 .text(denomName, marginLeft + 25, currentCashY + 6)
                 .text(cashItem.count.toString(), marginLeft + 160, currentCashY + 6)
                 .text(this.formatCurrency(amount), marginLeft + 205, currentCashY + 6);

              currentCashY += 20;
            }
          });
        }

        // Add individual cash donations if any
        if (offeringData.individualCashDonations && Array.isArray(offeringData.individualCashDonations) && offeringData.individualCashDonations.length > 0) {
          offeringData.individualCashDonations.forEach(cashDonation => {
            const amount = parseFloat(cashDonation.amount);
            cashTotal += amount;

            if ((currentCashY - cashTableY - 25) / 20 % 2 === 1) {
              doc.rect(marginLeft, currentCashY, cashTableWidth, 20)
                 .fill('#f8f9fa');
            }

            doc.rect(marginLeft + 10, currentCashY + 6, 8, 8)
               .stroke('#333')
               .fill('white');
            
            doc.fill('green')
               .fontSize(6)
               .text('✓', marginLeft + 11, currentCashY + 7);

            doc.fontSize(9)
               .font('Helvetica')
               .fill('black')
               .text(`Cash - ${cashDonation.donorName}`, marginLeft + 25, currentCashY + 6)
               .text('1', marginLeft + 160, currentCashY + 6)
               .text(this.formatCurrency(amount), marginLeft + 205, currentCashY + 6);

            currentCashY += 20;
          });
        }

        // Checks section - Right side
        const checksX = marginLeft + contentWidth * 0.52;
        const checksTableWidth = contentWidth * 0.48;
        
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fill(this.primaryColor)
           .text('Checks', checksX, 250);

        const checksTableY = 270;
        
        // Checks table header
        doc.rect(checksX, checksTableY, checksTableWidth, 25)
           .fill('#f8f9fa')
           .stroke('#dee2e6');

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fill('black')
           .text('Verified', checksX + 5, checksTableY + 8)
           .text('Donor', checksX + 50, checksTableY + 8)
           .text('Check#', checksX + 120, checksTableY + 8)
           .text('Amount', checksX + 170, checksTableY + 8);

        let currentChecksY = checksTableY + 25;
        let checksTotal = 0;

        // Checks data
        if (offeringData.checks && Array.isArray(offeringData.checks) && offeringData.checks.length > 0) {
          offeringData.checks.forEach((check, index) => {
            if (check.name && check.amount) {
              const amount = parseFloat(check.amount);
              checksTotal += amount;

              // Row background
              if (index % 2 === 1) {
                doc.rect(checksX, currentChecksY, checksTableWidth, 20)
                   .fill('#f8f9fa');
              }

              // Checkbox
              doc.rect(checksX + 10, currentChecksY + 6, 8, 8)
                 .stroke('#333')
                 .fill('white');
              
              doc.fill('green')
                 .fontSize(6)
                 .text('✓', checksX + 11, currentChecksY + 7);

              doc.fontSize(9)
                 .font('Helvetica')
                 .fill('black')
                 .text(check.name.length > 12 ? check.name.substring(0, 12) + '...' : check.name, 
                       checksX + 25, currentChecksY + 6)
                 .text(check.checkNumber || 'N/A', checksX + 125, currentChecksY + 6)
                 .text(this.formatCurrency(amount), checksX + 175, currentChecksY + 6);

              currentChecksY += 20;
            }
          });
        }

        // Summary totals section
        const summaryY = Math.max(currentCashY, currentChecksY) + 30;
        doc.y = summaryY;

        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fill(this.primaryColor)
           .text('Summary', marginLeft, doc.y);

        const summaryTableY = doc.y + 20;
        const summaryTableHeight = 100;
        
        // Summary table border
        doc.rect(marginLeft, summaryTableY, contentWidth, summaryTableHeight)
           .stroke('#dee2e6')
           .lineWidth(1);

        // Table headers
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fill('black')
           .text('Currency Type', marginLeft + contentWidth * 0.2, summaryTableY + 15)
           .text('Total', marginLeft + contentWidth * 0.7, summaryTableY + 15);

        // Cash row
        doc.fontSize(12)
           .font('Helvetica')
           .fill('black')
           .text('Cash', marginLeft + contentWidth * 0.2, summaryTableY + 40)
           .text(this.formatCurrency(cashTotal), marginLeft + contentWidth * 0.7, summaryTableY + 40);

        // Checks row  
        doc.fontSize(12)
           .font('Helvetica')
           .fill('black')
           .text('Checks', marginLeft + contentWidth * 0.2, summaryTableY + 60)
           .text(this.formatCurrency(checksTotal), marginLeft + contentWidth * 0.7, summaryTableY + 60);

        // Pastor Gift row (if applicable)
        const pastorGift = parseFloat(offeringData.pastorGift || 0);
        let finalRowY = summaryTableY + 80;
        
        if (pastorGift > 0) {
          doc.fontSize(12)
             .font('Helvetica')
             .fill('#dc3545')
             .text('Pastor Gift (Cash Taken)', marginLeft + contentWidth * 0.2, finalRowY)
             .text(`-${this.formatCurrency(pastorGift)}`, marginLeft + contentWidth * 0.7, finalRowY);
          
          finalRowY += 20;
        }

        // Separator line
        doc.strokeColor('#333')
           .lineWidth(1)
           .moveTo(marginLeft + contentWidth * 0.2, finalRowY - 5)
           .lineTo(marginLeft + contentWidth, finalRowY - 5)
           .stroke();

        // Final total
        const finalTotal = cashTotal + checksTotal - pastorGift;
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fill('black')
           .text('Final Deposit', marginLeft + contentWidth * 0.2, finalRowY)
           .text(this.formatCurrency(finalTotal), marginLeft + contentWidth * 0.7, finalRowY);

        // Amount in words
        doc.y = summaryTableY + summaryTableHeight + 20;
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fill('black')
           .text('Amount in Words:', marginLeft, doc.y);
        
        doc.y += 15;
        doc.fontSize(10)
           .font('Helvetica')
           .text(this.convertAmountToWords(finalTotal), marginLeft, doc.y, { width: contentWidth });

        // Signature section
        doc.y += 40;
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fill(this.primaryColor)
           .text('Reviewed and Verified by:', marginLeft, doc.y);

        doc.y += 15;
        
        // Signature names first (above the lines)
        const sig1X = marginLeft;
        const sig2X = marginLeft + contentWidth * 0.55;
        const sigWidth = contentWidth * 0.4;
        
        doc.fontSize(10)
           .font('Helvetica')
           .fill('black')
           .text(offeringData.reviewer1 || 'Reviewer 1', sig1X, doc.y, { width: sigWidth, align: 'center' })
           .text(offeringData.reviewer2 || 'Reviewer 2', sig2X, doc.y, { width: sigWidth, align: 'center' });

        // Signature lines below the names
        doc.y += 15;
        doc.strokeColor('#333')
           .lineWidth(1)
           .moveTo(sig1X, doc.y)
           .lineTo(sig1X + sigWidth, doc.y)
           .stroke()
           .moveTo(sig2X, doc.y)
           .lineTo(sig2X + sigWidth, doc.y)
           .stroke();

        // Date
        doc.y += 20;
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Offering Date: ${formattedDate}`, marginLeft, doc.y);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate Weekly Offering Summary from DonationSession
  async generateWeeklyOfferingSummaryFromSession(session) {
    return new Promise((resolve, reject) => {
      try {
        const doc = this.createDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add church header
        this.addChurchHeader(doc, 'Weekly Offering Summary');

        // Session info
        const sessionDate = new Date(session.sessionDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(12)
           .text(`Service Date: ${sessionDate}`, 400, 95)
           .text(`Prepared by: Church Admin`, 400, 110)
           .text(`Date: ${new Date().toLocaleDateString('en-US')}`, 400, 125);

        // Main content area
        let yPos = 160;

        // Cash breakdown section
        doc.fontSize(16)
           .fillColor(this.primaryColor)
           .text('Cash Denominations', 50, yPos);

        yPos += 30;
        
        // Calculate total cash including both individual cash donations AND cash denominations
        const cashDonations = session.Donations.filter(d => d.paymentMethod === 'Cash');
        const individualCashTotal = cashDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        
        // Use the session's cashAmount which should include all cash sources
        const totalCash = parseFloat(session.cashAmount || 0);

        // Display cash breakdown
        doc.fontSize(12)
           .fillColor('black')
           .text('Total Cash Collected:', 70, yPos)
           .text(`$${totalCash.toFixed(2)}`, 200, yPos);

        // Show breakdown if there are individual cash donations
        if (cashDonations.length > 0) {
          yPos += 20;
          doc.fontSize(10)
             .fillColor('#666')
             .text('Individual Cash Donations:', 90, yPos);
          
          cashDonations.forEach((cash, index) => {
            yPos += 15;
            doc.text(`  • ${cash.donorName || 'Anonymous'}: $${parseFloat(cash.amount).toFixed(2)}`, 110, yPos);
          });
        }

        // Calculate anonymous cash (from denominations)
        const anonymousCash = totalCash - individualCashTotal;
        if (anonymousCash > 0) {
          yPos += 20;
          doc.fontSize(10)
             .fillColor('#666')
             .text('Anonymous Cash (From Denominations):', 90, yPos);
          yPos += 15;
          doc.text(`  • Offering Plate Cash: $${anonymousCash.toFixed(2)}`, 110, yPos);
        }

        yPos += 40;

        // Checks section
        doc.fontSize(16)
           .fillColor(this.primaryColor)
           .text('Checks', 300, 190);

        yPos = 220;
        const checkDonations = session.Donations.filter(d => d.paymentMethod === 'Check');
        const totalChecks = parseFloat(session.checkAmount || 0);
        
        if (checkDonations.length > 0) {
          checkDonations.forEach((check, index) => {
            doc.fontSize(10)
               .fillColor('black')
               .text(check.donorName || 'Anonymous', 320, yPos)
               .text(check.checkNumber || 'N/A', 420, yPos)
               .text(`$${parseFloat(check.amount).toFixed(2)}`, 480, yPos);
            yPos += 15;
          });
        } else {
          doc.fontSize(10)
             .fillColor('gray')
             .text('No checks received', 320, yPos);
        }

        // Summary section
        yPos = Math.max(yPos + 20, 400);
        
        doc.fontSize(16)
           .fillColor(this.primaryColor)
           .text('Summary', 50, yPos);

        yPos += 30;

        const totalAmount = parseFloat(session.totalDonations);
        const pastorGift = parseFloat(session.pastorGift || 0);
        const finalDeposit = totalAmount - pastorGift;

        doc.fontSize(12)
           .fillColor('black')
           .text('Total Cash:', 70, yPos)
           .text(`$${totalCash.toFixed(2)}`, 200, yPos);
        
        yPos += 20;
        doc.text('Total Checks:', 70, yPos)
           .text(`$${totalChecks.toFixed(2)}`, 200, yPos);

        if (pastorGift > 0) {
          yPos += 20;
          doc.fillColor(this.accentColor)
             .text('Pastor Gift (Cash Taken):', 70, yPos)
             .text(`$${pastorGift.toFixed(2)}`, 200, yPos);
        }

        yPos += 30;
        doc.fontSize(14)
           .fillColor(this.primaryColor)
           .text('Final Deposit Amount:', 70, yPos)
           .fontSize(18)
           .text(`$${finalDeposit.toFixed(2)}`, 250, yPos);

        // Amount in words
        yPos += 40;
        doc.fontSize(12)
           .fillColor('black')
           .text('Amount in Words:', 70, yPos);
        
        yPos += 15;
        doc.fontSize(10)
           .text(this.convertNumberToWords(finalDeposit), 70, yPos, { width: 400 });

        // Reviewer signatures
        yPos += 60;
        doc.fontSize(14)
           .fillColor(this.primaryColor)
           .text('Reviewed and Verified by:', 50, yPos);

        yPos += 30;
        doc.fontSize(12)
           .fillColor('black')
           .text(`Reviewer 1: ${session.reviewer1 || 'Not specified'}`, 70, yPos);

        yPos += 30;
        doc.text(`Reviewer 2: ${session.reviewer2 || 'Not specified'}`, 70, yPos);

        // Signature lines
        yPos += 40;
        doc.strokeColor('#333')
           .lineWidth(1)
           .moveTo(70, yPos)
           .lineTo(270, yPos)
           .stroke()
           .moveTo(320, yPos)
           .lineTo(520, yPos)
           .stroke();
        
        yPos += 20;
        doc.fontSize(10)
           .fillColor('gray')
           .text('Reviewer 1 Signature / Date', 70, yPos)
           .text('Reviewer 2 Signature / Date', 320, yPos);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Convert number to words for amount display
  convertNumberToWords(amount) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 
                  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
                  'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (amount === 0) return 'zero dollars';
    
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);
    
    const convertHundreds = (num) => {
      let result = '';
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' hundred ';
        num %= 100;
      }
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      }
      if (num > 0) {
        result += ones[num] + ' ';
      }
      return result;
    };
    
    let result = '';
    if (dollars >= 1000000) {
      result += convertHundreds(Math.floor(dollars / 1000000)) + 'million ';
      dollars %= 1000000;
    }
    if (dollars >= 1000) {
      result += convertHundreds(Math.floor(dollars / 1000)) + 'thousand ';
      dollars %= 1000;
    }
    if (dollars > 0) {
      result += convertHundreds(dollars);
    }
    
    result += dollars === 1 ? 'dollar' : 'dollars';
    
    if (cents > 0) {
      result += ' and ' + convertHundreds(cents) + (cents === 1 ? 'cent' : 'cents');
    }
    
    return result.trim();
  }

  // Add church header specifically for offering summary
  addChurchHeader(doc, title) {
    const pageWidth = doc.page.width;
    const marginLeft = this.pageMargin;
    const contentWidth = pageWidth - (marginLeft * 2);

    // Church name and info
    doc.fontSize(18)
       .fillColor(this.primaryColor)
       .font('Helvetica-Bold')
       .text('Atlanta Little Flock Church', marginLeft, 20, { width: contentWidth, align: 'center' });

    doc.fontSize(10)
       .fillColor('black')
       .font('Helvetica')
       .text('Fear Not, little flock', marginLeft, 40, { width: contentWidth, align: 'center' })
       .text('5465 Legacy Parkway, Suite 650, Plano, TX 75024', marginLeft, 52, { width: contentWidth, align: 'center' })
       .text('1-972-369-6300', marginLeft, 64, { width: contentWidth, align: 'center' });

    // Title
    doc.fontSize(16)
       .fillColor(this.primaryColor)
       .font('Helvetica-Bold')
       .text(title, marginLeft, 85, { width: contentWidth, align: 'center' });

    // Horizontal line
    doc.strokeColor('#cccccc')
       .lineWidth(1)
       .moveTo(marginLeft, 140)
       .lineTo(pageWidth - marginLeft, 140)
       .stroke();
  }

  // Convert number to words for church documents
  convertNumberToWords(amount) {
    if (amount === 0) return 'Zero Dollars';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertHundreds(num) {
      let result = '';
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result;
    }
    
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);
    
    let result = '';
    
    if (dollars >= 1000000) {
      result += convertHundreds(Math.floor(dollars / 1000000)) + 'Million ';
      dollars %= 1000000;
    }
    
    if (dollars >= 1000) {
      result += convertHundreds(Math.floor(dollars / 1000)) + 'Thousand ';
      dollars %= 1000;
    }
    
    if (dollars > 0) {
      result += convertHundreds(dollars);
    }
    
    result += dollars === 1 ? 'Dollar' : 'Dollars';
    
    if (cents > 0) {
      result += ' and ' + convertHundreds(cents).trim() + (cents === 1 ? ' Cent' : ' Cents');
    }
    
    return result.trim();
  }

  // Convert number to words for amount display
  numberToWords(amount) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    if (amount === 0) return 'zero dollars';

    let dollars = Math.floor(amount);
    let cents = Math.round((amount - dollars) * 100);

    let result = this.convertNumberToWords(dollars) + ' dollar' + (dollars !== 1 ? 's' : '');

    if (cents > 0) {
      result += ' and ' + this.convertNumberToWords(cents) + ' cent' + (cents !== 1 ? 's' : '');
    }

    return result;
  }

  convertNumberToWords(num) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    if (num === 0) return '';

    if (num < 10) {
      return ones[num];
    } else if (num < 20) {
      return teens[num - 10];
    } else if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    } else if (num < 1000) {
      return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' ' + this.convertNumberToWords(num % 100) : '');
    } else if (num < 1000000) {
      return this.convertNumberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 !== 0 ? ' ' + this.convertNumberToWords(num % 1000) : '');
    }

    return num.toString();
  }
}

module.exports = new PDFService();