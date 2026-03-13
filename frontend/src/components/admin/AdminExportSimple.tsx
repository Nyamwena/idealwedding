'use client';

import React from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';

interface AdminExportSimpleProps {
  data: any[];
  filename: string;
  headers?: string[];
}

export function AdminExportSimple({ data, filename, headers }: AdminExportSimpleProps) {
  const exportToCsv = () => {
    if (data.length === 0) {
      alert('No data to export.');
      return;
    }
    
    try {
      const ws = utils.json_to_sheet(data, { header: headers });
      const csv = utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('Failed to export CSV file.');
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      alert('No data to export.');
      return;
    }
    
    try {
      const ws = utils.json_to_sheet(data, { header: headers });
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Data');
      writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Failed to export Excel file.');
    }
  };

  const exportToPdf = () => {
    if (data.length === 0) {
      alert('No data to export.');
      return;
    }
    
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(filename.replace(/-/g, ' ').toUpperCase(), 14, 15);
      
      // Prepare table data
      const tableColumn = headers || Object.keys(data[0]);
      const tableRows = data.map(item => 
        tableColumn.map(col => {
          const value = item[col];
          if (typeof value === 'number') {
            return value.toLocaleString();
          }
          return String(value || '');
        })
      );

      // Create simple table without autoTable dependency
      let yPosition = 25;
      const lineHeight = 6;
      const colWidth = 35;
      const maxWidth = 180;
      
      // Headers
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(59, 130, 246); // Blue color for headers
      
      tableColumn.forEach((col, index) => {
        const xPosition = 14 + (index * colWidth);
        if (xPosition < maxWidth) {
          doc.text(col, xPosition, yPosition);
        }
      });
      yPosition += lineHeight + 2;
      
      // Add line under headers
      doc.setDrawColor(59, 130, 246);
      doc.line(14, yPosition - 1, maxWidth, yPosition - 1);
      yPosition += 2;
      
      // Data rows
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0); // Black color for data
      
      tableRows.forEach((row, rowIndex) => {
        if (yPosition > 280) { // New page if needed
          doc.addPage();
          yPosition = 20;
        }
        
        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, yPosition - 4, maxWidth - 14, lineHeight + 2, 'F');
        }
        
        row.forEach((cell, index) => {
          const xPosition = 14 + (index * colWidth);
          if (xPosition < maxWidth) {
            // Truncate long text
            const cellText = String(cell).length > 15 ? String(cell).substring(0, 15) + '...' : String(cell);
            doc.text(cellText, xPosition, yPosition);
          }
        });
        yPosition += lineHeight + 2;
      });
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Generated on ${new Date().toLocaleDateString()}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }
      
      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF file. Please try again.');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-700 text-sm">Export:</span>
      <button 
        onClick={exportToCsv} 
        className="btn-sm btn-secondary-outline"
        title="Export to CSV"
      >
        📊 CSV
      </button>
      <button 
        onClick={exportToExcel} 
        className="btn-sm btn-secondary-outline"
        title="Export to Excel"
      >
        📈 Excel
      </button>
      <button 
        onClick={exportToPdf} 
        className="btn-sm btn-secondary-outline"
        title="Export to PDF"
      >
        📄 PDF
      </button>
    </div>
  );
}
