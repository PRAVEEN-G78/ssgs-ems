import React, { useState } from 'react';
import { format } from 'date-fns';
import './PayrollPreview.css';

// Import SVG icons
import DownloadIcon from '../../assets/icons/download.svg';
import ReceiptIcon from '../../assets/icons/receipt.svg';

const PayrollPreview = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPayslipDialog, setShowPayslipDialog] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const [payrollItems] = useState([
    {
      id: 1,
      description: 'Basic Salary',
      amount: 5000,
      type: 'Earning',
      category: 'Regular',
      taxable: true,
    },
    {
      id: 2,
      description: 'House Rent Allowance',
      amount: 2000,
      type: 'Earning',
      category: 'Allowance',
      taxable: true,
    },
    {
      id: 3,
      description: 'Transport Allowance',
      amount: 1000,
      type: 'Earning',
      category: 'Allowance',
      taxable: true,
    },
    {
      id: 4,
      description: 'Overtime Pay',
      amount: 500,
      type: 'Earning',
      category: 'Overtime',
      taxable: true,
    },
    {
      id: 5,
      description: 'Performance Bonus',
      amount: 1000,
      type: 'Earning',
      category: 'Bonus',
      taxable: true,
    },
    {
      id: 6,
      description: 'Federal Tax',
      amount: 800,
      type: 'Deduction',
      category: 'Tax',
      taxable: false,
    },
    {
      id: 7,
      description: 'State Tax',
      amount: 400,
      type: 'Deduction',
      category: 'Tax',
      taxable: false,
    },
    {
      id: 8,
      description: 'Health Insurance',
      amount: 200,
      type: 'Deduction',
      category: 'Insurance',
      taxable: false,
    },
    {
      id: 9,
      description: '401(k) Contribution',
      amount: 500,
      type: 'Deduction',
      category: 'Retirement',
      taxable: false,
    },
  ]);

  const [payrollPeriods] = useState([
    {
      id: 1,
      startDate: '2024-03-01',
      endDate: '2024-03-15',
      status: 'Completed',
      paymentDate: '2024-03-20',
    },
    {
      id: 2,
      startDate: '2024-03-16',
      endDate: '2024-03-31',
      status: 'Processing',
      paymentDate: '2024-04-05',
    },
  ]);

  const [payslips] = useState([
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      period: 'Mar 1-15, 2024',
      netAmount: 7000,
      status: 'Paid',
      paymentMethod: 'Direct Deposit',
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      period: 'Mar 1-15, 2024',
      netAmount: 7500,
      status: 'Paid',
      paymentMethod: 'Check',
    },
  ]);

  const calculateSummary = () => {
    const earnings = payrollItems
      .filter((item) => item.type === 'Earning')
      .reduce((sum, item) => sum + item.amount, 0);
    const deductions = payrollItems
      .filter((item) => item.type === 'Deduction')
      .reduce((sum, item) => sum + item.amount, 0);
    const taxableIncome = payrollItems
      .filter((item) => item.taxable)
      .reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = payrollItems
      .filter((item) => item.category === 'Tax')
      .reduce((sum, item) => sum + item.amount, 0);
    const overtimePay = payrollItems
      .filter((item) => item.category === 'Overtime')
      .reduce((sum, item) => sum + item.amount, 0);
    const bonus = payrollItems
      .filter((item) => item.category === 'Bonus')
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      basicSalary: payrollItems.find((item) => item.description === 'Basic Salary')?.amount || 0,
      allowances: payrollItems
        .filter((item) => item.category === 'Allowance')
        .reduce((sum, item) => sum + item.amount, 0),
      deductions,
      netSalary: earnings - deductions,
      taxableIncome,
      taxAmount,
      overtimePay,
      bonus,
    };
  };

  const summary = calculateSummary();

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  const handlePayslipClick = (payslip) => {
    setSelectedPayslip(payslip);
    setShowPayslipDialog(true);
  };

  const renderPayslipDialog = () => (
    <div className="dialog-overlay" onClick={() => setShowPayslipDialog(false)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <img src={ReceiptIcon} alt="" className="icon" />
          <h2 className="dialog-title">Payslip Details</h2>
        </div>
        <div className="dialog-content">
          {selectedPayslip && (
            <div>
              <div>
                <h3>Employee Information</h3>
                <p>Name: {selectedPayslip.employeeName}</p>
                <p>ID: {selectedPayslip.employeeId}</p>
                <p>Period: {selectedPayslip.period}</p>
              </div>
              <hr />
              <div>
                <h3>Payment Details</h3>
                <p>Net Amount: ${selectedPayslip.netAmount}</p>
                <p>Status: {selectedPayslip.status}</p>
                <p>Payment Method: {selectedPayslip.paymentMethod}</p>
              </div>
            </div>
          )}
        </div>
        <div className="dialog-footer">
          <button className="button button-secondary" onClick={() => setShowPayslipDialog(false)}>
            Close
          </button>
          <button className="button button-primary">
            <img src={DownloadIcon} alt="" className="icon" />
            Download
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="payroll-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => handleTabChange(0)}
        >
          Payroll Summary
        </button>
        <button
          className={`tab ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => handleTabChange(1)}
        >
          Payslips
        </button>
        <button
          className={`tab ${activeTab === 2 ? 'active' : ''}`}
          onClick={() => handleTabChange(2)}
        >
          History
        </button>
      </div>

      {activeTab === 0 && (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-title">Basic Salary</div>
              <div className="summary-value">${summary.basicSalary}</div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Allowances</div>
              <div className="summary-value">${summary.allowances}</div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Deductions</div>
              <div className="summary-value">${summary.deductions}</div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Net Salary</div>
              <div className="summary-value">${summary.netSalary}</div>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Taxable</th>
                </tr>
              </thead>
              <tbody>
                {payrollItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>${item.amount}</td>
                    <td>{item.type}</td>
                    <td>{item.category}</td>
                    <td>{item.taxable ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 1 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Net Amount</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((payslip) => (
                <tr key={payslip.id}>
                  <td>
                    <div>{payslip.employeeName}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {payslip.employeeId}
                    </div>
                  </td>
                  <td>{payslip.period}</td>
                  <td>${payslip.netAmount}</td>
                  <td>
                    <span className={`status-chip status-${payslip.status.toLowerCase()}`}>
                      {payslip.status}
                    </span>
                  </td>
                  <td>{payslip.paymentMethod}</td>
                  <td>
                    <button
                      className="button button-secondary"
                      onClick={() => handlePayslipClick(payslip)}
                    >
                      <img src={ReceiptIcon} alt="" className="icon" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 2 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollPeriods.map((period) => (
                <tr key={period.id}>
                  <td>
                    {format(new Date(period.startDate), 'MMM d')} -{' '}
                    {format(new Date(period.endDate), 'MMM d, yyyy')}
                  </td>
                  <td>{format(new Date(period.startDate), 'MMM d, yyyy')}</td>
                  <td>{format(new Date(period.endDate), 'MMM d, yyyy')}</td>
                  <td>
                    <span className={`status-chip status-${period.status.toLowerCase()}`}>
                      {period.status}
                    </span>
                  </td>
                  <td>{format(new Date(period.paymentDate), 'MMM d, yyyy')}</td>
                  <td>
                    <button className="button button-secondary">
                      <img src={DownloadIcon} alt="" className="icon" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPayslipDialog && renderPayslipDialog()}
    </div>
  );
};

export default PayrollPreview; 