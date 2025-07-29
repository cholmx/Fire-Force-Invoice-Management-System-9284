import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiDownload, FiPrinter } = FiIcons;

const InvoicePreview = ({ invoiceData, onClose }) => {
  const componentRef = useRef();

  // Hardcoded office information
  const officeInfo = {
    companyName: 'Fire Force',
    address: 'P.O. Box 552, Columbiana Ohio 44408',
    ohPhone: '330-482-9300',
    ohEmail: 'Lizfireforce@yahoo.com',
    paPhone: '724-586-6577',
    paEmail: 'fireforcebutler@gmail.com'
  };

  const getDocumentTitle = () => {
    const type = invoiceData.transactionType || 'Invoice';
    const poNumber = invoiceData.poNumber || 'Draft';
    return `Fire Force ${type} - ${poNumber}`;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Sales Order': return '#DC2626'; // red-600
      case 'Service Order': return '#16A34A'; // green-600
      case 'Quote': return '#F59E0B'; // amber-500
      default: return '#4B5563'; // gray-600
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: getDocumentTitle(),
    pageStyle: `
      @page {
        size: 8.5in 11in;
        margin: 0.5in;
      }
      @media print {
        body {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
        }
        .print-page {
          width: 7.5in;
          min-height: 10in;
          margin: 0 auto;
          background: white;
        }
      }
    `,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-title font-bold text-gray-900">
            {invoiceData.transactionType || 'Invoice'} Preview
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg transition-all duration-300"
            >
              <SafeIcon icon={FiPrinter} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <SafeIcon icon={FiX} />
              <span>Close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div ref={componentRef} className="print-page bg-white p-8 mx-auto shadow-lg">
            {/* Invoice Template */}
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', lineHeight: '1.3', width: '100%' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '3px solid #DC2725', paddingBottom: '12px' }}>
                <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: '28px', fontWeight: 'bold', color: '#DC2725', marginBottom: '6px' }}>
                  {officeInfo.companyName.toUpperCase()}
                </div>
                <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  FIRE SAFETY EQUIPMENT SALES AND SERVICE
                </div>
                <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#666' }}>
                  {officeInfo.address}<br />
                  OH: {officeInfo.ohPhone} | {officeInfo.ohEmail}<br />
                  PA: {officeInfo.paPhone} | {officeInfo.paEmail}
                </div>
              </div>

              {/* Document Type Header */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ 
                  fontFamily: '"Inter Tight", sans-serif', 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#fff', 
                  background: `${getTypeColor(invoiceData.transactionType)}`, 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  display: 'inline-block' 
                }}>
                  {invoiceData.transactionType?.toUpperCase() || 'SALES ORDER'}
                </div>
              </div>

              {/* Invoice Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '8px 0' }}>
                <div style={{ fontSize: '11px' }}>
                  <div style={{ marginBottom: '4px' }}><strong>Date:</strong> {new Date(invoiceData.date).toLocaleDateString()}</div>
                  <div><strong>P.O.#:</strong> {invoiceData.poNumber || 'N/A'}</div>
                </div>
                <div style={{ fontSize: '11px', textAlign: 'right' }}>
                  <div style={{ marginBottom: '4px' }}><strong>Sales Rep:</strong> {invoiceData.salesRep}</div>
                  <div><strong>Transaction Type:</strong> {invoiceData.transactionType}</div>
                </div>
              </div>

              {/* Customer Information */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                  CUSTOMER INFORMATION
                </div>
                <div style={{ fontSize: '10px', marginBottom: '8px' }}>
                  <div style={{ marginBottom: '2px' }}><strong>Name:</strong> {invoiceData.customerName}</div>
                  <div style={{ marginBottom: '2px' }}><strong>Email:</strong> {invoiceData.customerEmail}</div>
                  <div style={{ marginBottom: '2px' }}><strong>Phone:</strong> {invoiceData.customerPhone}</div>
                  <div><strong>Accounts Payable:</strong> {invoiceData.accountsPayableEmail}</div>
                </div>
              </div>

              {/* Addresses */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', marginBottom: '6px', fontSize: '11px' }}>BILL TO:</div>
                  <div style={{ whiteSpace: 'pre-line', border: '1px solid #ccc', padding: '8px', minHeight: '50px', fontSize: '10px', backgroundColor: '#fafafa' }}>
                    {invoiceData.billToAddress}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', marginBottom: '6px', fontSize: '11px' }}>SHIP TO:</div>
                  <div style={{ whiteSpace: 'pre-line', border: '1px solid #ccc', padding: '8px', minHeight: '50px', fontSize: '10px', backgroundColor: '#fafafa' }}>
                    {invoiceData.shipToAddress}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left', fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', fontSize: '10px' }}>MFG</th>
                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left', fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', fontSize: '10px' }}>Part #</th>
                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left', fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', fontSize: '10px' }}>Product Description</th>
                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', fontSize: '10px' }}>QTY</th>
                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right', fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', fontSize: '10px' }}>Unit Price</th>
                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', fontSize: '10px' }}>Tax</th>
                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right', fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', fontSize: '10px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ border: '1px solid #ccc', padding: '5px', fontSize: '10px' }}>{item.mfg}</td>
                      <td style={{ border: '1px solid #ccc', padding: '5px', fontSize: '10px' }}>{item.partNumber}</td>
                      <td style={{ border: '1px solid #ccc', padding: '5px', fontSize: '10px' }}>{item.description}</td>
                      <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontSize: '10px' }}>{item.qty}</td>
                      <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right', fontSize: '10px' }}>${item.unitPrice.toFixed(2)}</td>
                      <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontSize: '10px' }}>
                        {item.taxable ? '✓' : ''}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right', fontSize: '10px', fontWeight: 'bold' }}>
                        ${(item.qty * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <div style={{ width: '250px', border: '1px solid #ccc', backgroundColor: '#f8f9fa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #eee', fontSize: '10px' }}>
                    <span>Subtotal:</span>
                    <span style={{ fontWeight: 'bold' }}>${invoiceData.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #eee', fontSize: '10px' }}>
                    <span>Tax ({invoiceData.taxRate}%):</span>
                    <span style={{ fontWeight: 'bold' }}>${invoiceData.tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #eee', fontSize: '10px' }}>
                    <span>Shipping:</span>
                    <span style={{ fontWeight: 'bold' }}>${invoiceData.shippingCost.toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '10px 12px', 
                    background: getTypeColor(invoiceData.transactionType), 
                    color: 'white', 
                    fontWeight: 'bold', 
                    fontSize: '12px', 
                    fontFamily: '"Inter Tight", sans-serif' 
                  }}>
                    <span>GRAND TOTAL:</span>
                    <span>${invoiceData.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {invoiceData.additionalInfo && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 'bold', marginBottom: '6px', fontSize: '11px' }}>ADDITIONAL INFORMATION/COMMENTS:</div>
                  <div style={{ border: '1px solid #ccc', padding: '8px', whiteSpace: 'pre-line', fontSize: '10px', backgroundColor: '#fafafa' }}>
                    {invoiceData.additionalInfo}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '9px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '12px' }}>
                <div style={{ backgroundColor: '#f8f9fa', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <strong>Thank you for your business!</strong> Please contact us with any questions or concerns regarding this {invoiceData.transactionType?.toLowerCase() || 'document'}.
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InvoicePreview;