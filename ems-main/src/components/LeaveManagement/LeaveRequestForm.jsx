import React, { useState } from "react";
import "./LeaveRequestForm.css";

export default function LeaveRequestForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    leaveType: "Sick Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResultMessage("");
    try {
      // Only send leave request to backend
      const leavePayload = {
        employeeId: formData.employeeId,
        employeeName: formData.name,
        type: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'Pending',
        reason: formData.reason,
        appliedDate: new Date().toISOString().slice(0, 10),
        duration: (new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24) + 1,
        comments: '',
      };
      await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leavePayload),
      });
      setResultMessage("Your leave request has been submitted.");
        setFormData({
          name: "",
          employeeId: "",
          leaveType: "Sick Leave",
          startDate: "",
          endDate: "",
          reason: "",
        });
      if (onClose) onClose();
    } catch (error) {
      setResultMessage("An error occurred. Please try again later.");
    }
    setSubmitting(false);
  };

  return (
    <div className="leave-form-container">
      <h2 className="leave-form-title">Leave Request Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Employee Name</label>
          <input
            type="text"
            className="form-input"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Employee ID</label>
          <input
            type="text"
            className="form-input"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Leave Type</label>
          <select
            className="form-select"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
          >
            <option value="Sick Leave">Sick Leave</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Earned Leave">Earned Leave</option>
            <option value="Maternity Leave">Maternity Leave</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-input"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-input"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reason for Leave</label>
          <textarea
            className="form-textarea"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Leave Request"}
        </button>
        {resultMessage && (
          <div className="result-message">{resultMessage}</div>
        )}
      </form>
    </div>
  );
} 