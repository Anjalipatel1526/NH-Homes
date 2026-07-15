import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import {
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineChartPie,
  HiOutlineBriefcase,
  HiOutlineCreditCard,
  HiOutlineWrench
} from 'react-icons/hi2';

type ReportType = 'revenue' | 'inventory' | 'rentals' | 'clients' | 'maintenance';

export const Reports: React.FC = () => {
  const { clients, inventory, rentalRequests } = useData();
  const [reportType, setReportType] = useState<ReportType>('revenue');

  // CSV Generator Utility
  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Generator Utility (Excel-compatible XML/HTML Spreadsheet)
  const downloadExcel = (headers: string[], rows: string[][], filename: string) => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"/><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet 1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
    html += `<body><table border="1">`;
    
    // Headers
    html += `<tr>`;
    headers.forEach(h => {
      html += `<th style="background-color: #ffe7d3; font-weight: bold;">${h}</th>`;
    });
    html += `</tr>`;
    
    // Rows
    rows.forEach(row => {
      html += `<tr>`;
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += `</tr>`;
    });
    
    html += `</table></body></html>`;
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Generator Utility
  const downloadPDF = (headers: string[], rows: string[][], filename: string) => {
    const doc = new jsPDF();
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("NH Homes Civil Equipment Rental", 14, 20);
    
    doc.setFontSize(12);
    doc.setFont("Helvetica", "normal");
    doc.text(`Report: ${filename.replace(/_/g, ' ')}`, 14, 28);
    doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 34);
    
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);
    
    let y = 46;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    
    const colWidth = 182 / headers.length;
    headers.forEach((h, i) => {
      doc.text(h, 14 + (i * colWidth), y);
    });
    
    y += 6;
    doc.line(14, y - 2, 196, y - 2);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    
    rows.forEach((row) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        headers.forEach((h, i) => {
          doc.text(h, 14 + (i * colWidth), y);
        });
        y += 6;
        doc.line(14, y - 2, 196, y - 2);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
      }
      
      row.forEach((cell, i) => {
        const val = String(cell || '');
        const maxChars = Math.max(10, Math.floor(colWidth / 1.5));
        const text = val.length > maxChars ? val.substring(0, maxChars - 2) + ".." : val;
        doc.text(text, 14 + (i * colWidth), y);
      });
      y += 6;
    });
    
    doc.save(`${filename}.pdf`);
  };

  const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
    toast.info(`Preparing ${reportType} report in ${format} format...`);
    
    // Generate data based on active report type
    let headers: string[] = [];
    let rows: string[][] = [];
    
    if (reportType === 'revenue') {
      headers = ['Invoice Number', 'Client Name', 'Billed Date', 'GST Tax', 'Discounts', 'Grand Total', 'Amount Paid', 'Balance Due'];
      rows = rentalRequests.filter(r => r.status === 'Approved').map(r => [
        r.invoiceNumber,
        r.clientName,
        r.invoiceDate || '',
        `INR ${r.gstTotal}`,
        `INR ${r.discountTotal}`,
        `INR ${r.grandTotal}`,
        `INR ${r.amountPaid}`,
        `INR ${r.grandTotal - r.amountPaid}`
      ]);
    } else if (reportType === 'inventory') {
      headers = ['Equipment ID', 'Asset Name', 'Category', 'Brand & Model', 'Status', 'Daily Rate', 'Purchase Price', 'Location'];
      rows = inventory.map(i => [
        i.equipmentId,
        i.name,
        i.category,
        `${i.brand} ${i.model}`,
        i.status,
        `INR ${i.rentalPriceDay}`,
        `INR ${i.purchasePrice}`,
        i.currentLocation
      ]);
    } else if (reportType === 'rentals') {
      headers = ['Rental Number', 'Client Name', 'Company Name', 'Start Date', 'Expected Return', 'Total Items', 'Grand Total', 'Status'];
      rows = rentalRequests.map(r => [
        r.rentalNumber || 'Pending',
        r.clientName,
        r.companyName,
        r.startDate,
        r.expectedReturnDate,
        r.items.length.toString(),
        `INR ${r.grandTotal}`,
        r.status
      ]);
    } else if (reportType === 'clients') {
      headers = ['Client ID', 'Client Name', 'Company Name', 'GSTIN', 'Phone', 'Email', 'City', 'Status'];
      rows = clients.map(c => [
        c.id,
        c.name,
        c.companyName,
        c.gstNumber || 'N/A',
        c.phone,
        c.email,
        c.city || 'N/A',
        c.status
      ]);
    } else if (reportType === 'maintenance') {
      headers = ['Equipment ID', 'Asset Name', 'Maintenance Date', 'Service Action', 'Technician', 'Repair Cost (INR)'];
      rows = [];
      inventory.forEach(item => {
        item.maintenanceHistory.forEach(log => {
          rows.push([
            item.equipmentId,
            item.name,
            log.date,
            log.type,
            log.technician,
            log.cost.toString()
          ]);
        });
      });
    }

    const filename = `NH_Homes_${reportType}_Report_${Date.now()}`;

    if (format === 'CSV') {
      downloadCSV(headers, rows, filename);
      toast.success(`${reportType} CSV exported successfully!`);
    } else if (format === 'Excel') {
      downloadExcel(headers, rows, filename);
      toast.success(`${reportType} Excel exported successfully!`);
    } else if (format === 'PDF') {
      downloadPDF(headers, rows, filename);
      toast.success(`${reportType} PDF compiled and downloaded successfully!`);
    }
  };

  return (
    <div className="space-y-6 text-left text-xs">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-lg font-extrabold text-brand-text tracking-tight m-0">Corporate Reports & Analytics</h1>
          <p className="text-xs text-brand-dark-grey mt-0.5">Export operational metrics, maintenance schedules, tax invoices, and accounting audits.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('CSV')} leftIcon={<HiOutlineArrowDownTray />}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('Excel')}>
            Export Excel
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleExport('PDF')} leftIcon={<HiOutlineDocumentText />}>
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* Selector Side Panel + Visualizer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left selector */}
        <div className="space-y-1.5">
          <button
            onClick={() => setReportType('revenue')}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-3 ${
              reportType === 'revenue'
                ? 'bg-orange-50 border-orange-100 text-primary'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineCreditCard className="h-5 w-5" />
            <span>Revenue Report</span>
          </button>
          
          <button
            onClick={() => setReportType('inventory')}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-3 ${
              reportType === 'inventory'
                ? 'bg-orange-50 border-orange-100 text-primary'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineChartPie className="h-5 w-5" />
            <span>Inventory Status</span>
          </button>
          
          <button
            onClick={() => setReportType('rentals')}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-3 ${
              reportType === 'rentals'
                ? 'bg-orange-50 border-orange-100 text-primary'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineDocumentText className="h-5 w-5" />
            <span>Rental Activity Report</span>
          </button>

          <button
            onClick={() => setReportType('clients')}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-3 ${
              reportType === 'clients'
                ? 'bg-orange-50 border-orange-100 text-primary'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineBriefcase className="h-5 w-5" />
            <span>Clients Ledger Report</span>
          </button>

          <button
            onClick={() => setReportType('maintenance')}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-3 ${
              reportType === 'maintenance'
                ? 'bg-orange-50 border-orange-100 text-primary'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineWrench className="h-5 w-5" />
            <span>Maintenance Expenses</span>
          </button>
        </div>

        {/* Right Details Table */}
        <Card className="md:col-span-3">
          <CardHeader>
            <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider capitalize">{reportType} Report Analysis</h3>
            <span className="text-[10px] text-brand-dark-grey font-medium">Real-time entries in active database</span>
          </CardHeader>
          <CardBody className="p-0 overflow-x-auto">
            {reportType === 'revenue' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Invoice No</th>
                    <th className="px-4 py-3">Client Representative</th>
                    <th className="px-4 py-3">GST Tax</th>
                    <th className="px-4 py-3">Grand Total</th>
                    <th className="px-4 py-3">Paid Amount</th>
                    <th className="px-4 py-3">Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {rentalRequests.filter(r => r.status === 'Approved').map(r => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-bold text-brand-text font-mono">{r.invoiceNumber}</td>
                      <td className="px-4 py-3 font-semibold text-brand-text">{r.clientName}</td>
                      <td className="px-4 py-3 font-medium text-brand-text">₹{r.gstTotal.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-brand-text">₹{r.grandTotal.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-green-600">₹{r.amountPaid.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-red-600">₹{(r.grandTotal - r.amountPaid).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'inventory' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Equipment ID</th>
                    <th className="px-4 py-3">Asset Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Daily Rent Rate</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {inventory.map(i => (
                    <tr key={i.id}>
                      <td className="px-4 py-3 font-bold text-brand-text font-mono">{i.equipmentId}</td>
                      <td className="px-4 py-3 font-semibold text-brand-text">{i.name}</td>
                      <td className="px-4 py-3 font-medium text-brand-dark-grey">{i.category}</td>
                      <td className="px-4 py-3 font-bold text-primary">₹{i.rentalPriceDay.toLocaleString()}/day</td>
                      <td className="px-4 py-3"><Badge variant={i.status === 'Available' ? 'success' : 'brand'}>{i.status}</Badge></td>
                      <td className="px-4 py-3 font-medium text-brand-text">{i.currentLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'rentals' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Rental Number</th>
                    <th className="px-4 py-3">Client Representative</th>
                    <th className="px-4 py-3">Company Name</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">Expected Return</th>
                    <th className="px-4 py-3">Grand Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {rentalRequests.map(r => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-bold text-brand-text font-mono">{r.rentalNumber || 'Pending Approval'}</td>
                      <td className="px-4 py-3 font-semibold text-brand-text">{r.clientName}</td>
                      <td className="px-4 py-3 font-medium text-brand-dark-grey">{r.companyName}</td>
                      <td className="px-4 py-3 font-semibold text-brand-text">{r.startDate}</td>
                      <td className="px-4 py-3 font-semibold text-brand-text">{r.expectedReturnDate}</td>
                      <td className="px-4 py-3 font-bold text-primary">₹{r.grandTotal.toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'danger'}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'clients' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Client Representative Name</th>
                    <th className="px-4 py-3">Company Name</th>
                    <th className="px-4 py-3">GSTIN Tax Registration</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">City</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {clients.map(c => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-bold text-brand-text">{c.name}</td>
                      <td className="px-4 py-3 font-semibold text-brand-text">{c.companyName}</td>
                      <td className="px-4 py-3 font-bold text-brand-text font-mono">{c.gstNumber}</td>
                      <td className="px-4 py-3 font-medium text-brand-dark-grey">{c.phone}</td>
                      <td className="px-4 py-3 font-medium text-brand-dark-grey">{c.email}</td>
                      <td className="px-4 py-3 font-medium text-brand-text">{c.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'maintenance' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Equipment ID</th>
                    <th className="px-4 py-3">Asset Name</th>
                    <th className="px-4 py-3">Service Action Type</th>
                    <th className="px-4 py-3">Maintenance Date</th>
                    <th className="px-4 py-3">Technician</th>
                    <th className="px-4 py-3 text-right">Repair Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {(() => {
                    const rows: React.ReactNode[] = [];
                    inventory.forEach(item => {
                      item.maintenanceHistory.forEach(log => {
                        rows.push(
                          <tr key={log.id}>
                            <td className="px-4 py-3 font-bold text-brand-text font-mono">{item.equipmentId}</td>
                            <td className="px-4 py-3 font-semibold text-brand-text">{item.name}</td>
                            <td className="px-4 py-3 font-semibold text-brand-text">{log.type}</td>
                            <td className="px-4 py-3 font-medium text-brand-dark-grey">{log.date}</td>
                            <td className="px-4 py-3 font-medium text-brand-dark-grey">{log.technician}</td>
                            <td className="px-4 py-3 text-right font-bold text-primary">₹{log.cost.toLocaleString()}</td>
                          </tr>
                        );
                      });
                    });
                    return rows.length > 0 ? rows : (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-brand-dark-grey italic">No maintenance actions recorded.</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
export default Reports;
