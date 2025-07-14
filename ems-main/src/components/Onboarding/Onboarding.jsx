import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "./Onboarding.css";
import { API_ENDPOINTS, buildApiUrl } from '../../config/api';

const steps = [
  "Personal Information",
  "Contact Details",
  "Employment Details",
  "Banking Information",
  "Documents Upload",
];

const initialFormData = {
  firstName: "",
  lastName: "",
  dobAsPerCertificate: "",
  dobAsPerCelebration: "",
  gender: "",
  nationality: "",
  maritalStatus: "",
  bloodGroup: "",
  fatherName: "",
  fatherAge: "",
  motherName: "",
  motherAge: "",
  highestQualification: "",
  spouseName: "",
  spouseDateOfBirth: "",
  weddingDate: "",
  spouseEmail: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
  country: "",
  emergencyContact: [{ name: "", relationship: "", phone: "" }],
  experienceTotalYears: "",
  currentSalary: "",
  position: "",
  pfUanNumber: "",
  esiNumber: "",
  aadharNumber: "",
  namesAsOnAadhar: "",
  panNumber: "",
  namesAsOnPan: "",
  bankAccountNumber: "",
  namesAsPerBankDetails: "",
  bankName: "",
  branchName: "",
  ifscCode: "",
  photo: null,
  documents: [
    { type: "Resume", file: null, url: undefined, key: undefined },
    {
      type: "Latest Passport Photo ",
      file: null,
      url: undefined,
      key: undefined,
    },
    {
      type: "Last Appointment Letter",
      file: null,
      url: undefined,
      key: undefined,
    },
    { type: "Last Payslip", file: null, url: undefined, key: undefined },
    {
      type: "Last 6 months Bank Statement",
      file: null,
      url: undefined,
      key: undefined,
    },
    {
      type: "All Experience Letters",
      file: null,
      url: undefined,
      key: undefined,
    },
    { type: "SSC Certificate", file: null, url: undefined, key: undefined },
    {
      type: "Intermediate Certificate",
      file: null,
      url: undefined,
      key: undefined,
    },
    { type: "Degree Certificate", file: null, url: undefined, key: undefined },
    {
      type: "Post Graduate Certificate",
      file: null,
      url: undefined,
      key: undefined,
    },
    {
      type: "Any other Certifications/ Diplomas",
      file: null,
      url: undefined,
      key: undefined,
    },
    {
      type: "PAN Card ",
      file: null,
      url: undefined,
      key: undefined,
    },
    {
      type: "Aadhar Card ",
      file: null,
      url: undefined,
      key: undefined,
    },
    {
      type: "BankPass Book - 1stPage",
      file: null,
      url: undefined,
      key: undefined,
    },
    
  ],
  centerCode: "",
};

const educationOptions = [
  "High School",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Other",
];

function Onboarding() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [filteredEducationOptions, setFilteredEducationOptions] =
    useState(educationOptions);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.status || '';
  });
  const navigate = useNavigate();

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const filteredBloodGroups = bloodGroups.filter((group) =>
    group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBloodGroupSelect = (group) => {
    setFormData((prev) => ({ ...prev, bloodGroup: group }));
    setSearchTerm(group);
    setShowDropdown(false);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleEmergencyContactChange = (index, field, value) => {
    const updatedContacts = [...formData.emergencyContact];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      emergencyContact: updatedContacts,
    }));
  };

  const addEmergencyContact = () => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: [
        ...prev.emergencyContact,
        { name: "", relationship: "", phone: "" },
      ],
    }));
  };

  const removeEmergencyContact = (index) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: prev.emergencyContact.filter((_, i) => i !== index),
    }));
  };

  const handleDocumentUpload = async (e, index) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index ? { ...doc, uploading: true } : doc
      ),
    }));
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    // Use passport endpoint for passport photo, onboarding for others
    const isPassportPhoto =
      formData.documents[index].type.toLowerCase().includes('passport photo');
    const endpoint = isPassportPhoto
      ? API_ENDPOINTS.UPLOAD_PASSPORT
      : API_ENDPOINTS.UPLOAD_ONBOARDING;
    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        body: formDataToSend,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        documents: prev.documents.map((doc, i) =>
          i === index
            ? {
                ...doc,
                url: data.url,
                key: data.key,
                file: null,
                uploading: false,
              }
            : doc
        ),
      }));
    } catch (err) {
      setFormData((prev) => ({
        ...prev,
        documents: prev.documents.map((doc, i) =>
          i === index ? { ...doc, uploading: false } : doc
        ),
      }));
      alert('Failed to upload file. Please try again.');
    }
  };

  const handleDocumentRemove = async (index) => {
    const doc = formData.documents[index];
    if (doc.url && doc.key) {
      setFormData((prev) => ({
        ...prev,
        documents: prev.documents.map((d, i) =>
          i === index ? { ...d, deleting: true } : d
        ),
      }));
      // Use passport endpoint for passport photo, onboarding for others
      const isPassportPhoto =
        formData.documents[index].type.toLowerCase().includes('passport photo');
      const endpoint = isPassportPhoto
        ? API_ENDPOINTS.DELETE_PASSPORT
        : API_ENDPOINTS.DELETE_ONBOARDING;
      try {
        const response = await fetch(buildApiUrl(endpoint), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: doc.key }),
        });
        if (!response.ok) throw new Error('Delete failed');
        setFormData((prev) => ({
          ...prev,
          documents: prev.documents.map((d, i) =>
            i === index
              ? { ...d, url: undefined, key: undefined, deleting: false }
              : d
          ),
        }));
      } catch (err) {
        setFormData((prev) => ({
          ...prev,
          documents: prev.documents.map((d, i) =>
            i === index ? { ...d, deleting: false } : d
          ),
        }));
        alert('Failed to delete file from S3. Please try again.');
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        documents: prev.documents.map((d, i) =>
          i === index ? { ...d, file: null } : d
        ),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { documents, currentSalary, ...rest } = formData;
      const dataToSubmit = { ...rest };
      if (currentSalary) {
        dataToSubmit.currentSalary = Number(currentSalary);
      }
      // Only include documents with a url (uploaded)
      dataToSubmit.documents = documents
        .filter((doc) => doc.url)
        .map((doc) => ({ type: doc.type, url: doc.url, key: doc.key }));

      // Add employeeId from localStorage.user
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.employeeId) {
        dataToSubmit.employeeId = user.employeeId;
      }
      const token = localStorage.getItem('token');

      const response = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSubmit),
      });

      const result = await response.json();
      console.log(result);
      console.log(response);

      if (!response.ok) {
        // Extract the specific error message from the server response
        const errorMessage = result.error || "Something went wrong while submitting the form";
        throw new Error(errorMessage);
      }

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData(initialFormData);
        setTimeout(() => navigate('/'), 1000);
      } else {
        setSubmitError("Failed to submit form. Please try again.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      
      // Handle different types of errors
      let errorMessage = "Something went wrong while submitting the form";
      
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Network error: Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlur = (e) => {};

  // Auto-populate form if onboarding record exists
  useEffect(() => {
    async function fetchEmployeeRecord() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.employeeId && !user?.username) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/employee/record?employeeId=${user.employeeId || ''}&username=${user.username || ''}`);
        if (res.ok) {
          const data = await res.json();
          // Only set if record exists
          if (data) {
            // Convert date fields to yyyy-mm-dd for input fields
            const dateFields = ['dobAsPerCertificate', 'dobAsPerCelebration', 'spouseDateOfBirth', 'weddingDate'];
            const formattedData = { ...initialFormData, ...data };
            dateFields.forEach(field => {
              if (formattedData[field]) {
                formattedData[field] = new Date(formattedData[field]).toISOString().split('T')[0];
              }
            });
            // Merge default documents with user's uploaded documents
            const defaultDocs = initialFormData.documents;
            const userDocs = Array.isArray(data.documents) ? data.documents : [];
            const mergedDocs = defaultDocs.map(defDoc => {
              const found = userDocs.find(d => d.type === defDoc.type);
              return found ? { ...defDoc, ...found } : defDoc;
            });
            formattedData.documents = mergedDocs;
            setFormData(formattedData);
          }
        }
      } catch {}
      setLoading(false);
    }
    fetchEmployeeRecord();
    // eslint-disable-next-line
  }, []);

  // Optionally, update userStatus from backend if needed
  useEffect(() => {
    async function fetchUserStatus() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.employeeId && !user?.username) return;
      try {
        const res = await fetch(`http://localhost:5000/api/employee/info?employeeId=${user.employeeId || ''}&username=${user.username || ''}`);
        if (res.ok) {
          const data = await res.json();
          setUserStatus(data.status);
        }
      } catch {}
    }
    fetchUserStatus();
  }, []);

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.firstName ? "error" : ""}`}
              />
              {/* {errors.firstName && <div className="error-message">{errors.firstName}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.lastName ? "error" : ""}`}
              />
              {/* {errors.lastName && <div className="error-message">{errors.lastName}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Father's Name</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.fatherName ? "error" : ""}`}
              />
              {/* {errors.fatherName && <div className="error-message">{errors.fatherName}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Mother's Name</label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.motherName ? "error" : ""}`}
              />
              {/* {errors.motherName && <div className="error-message">{errors.motherName}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">
                Education (Highest Qualification)
              </label>
              <select
                name="highestQualification"
                value={formData.highestQualification}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${
                  errors.highestQualification ? "error" : ""
                }`}
              >
                <option value="">Select Highest Qualification</option>
                <option value="High School">High School</option>
                <option value="Associate's Degree">Associate's Degree</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Doctorate">Doctorate</option>
                <option value="Other">Other</option>
              </select>
              {/* {errors.highestQualification && <div className="error-message">{errors.highestQualification}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">
                Date of Birth (As per Certificate)
              </label>
              <input
                type="date"
                name="dobAsPerCertificate"
                value={formData.dobAsPerCertificate}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${
                  errors.dobAsPerCertificate ? "error" : ""
                }`}
              />
              {/* {errors.dobAsPerCertificate && <div className="error-message">{errors.dobAsPerCertificate}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">
                Date of Birth (As per Celebration)
              </label>
              <input
                type="date"
                name="dobAsPerCelebration"
                value={formData.dobAsPerCelebration}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${
                  errors.dobAsPerCelebration ? "error" : ""
                }`}
              />
              {/* {errors.dobAsPerCelebration && <div className="error-message">{errors.dobAsPerCelebration}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Married (Y/N)</label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.maritalStatus ? "error" : ""}`}
              >
                <option value="">Select</option>
                <option value="Married">Yes</option>
                <option value="Single">No</option>
              </select>
              {/* {errors.maritalStatus && <div className="error-message">{errors.maritalStatus}</div>} */}
            </div>
            {formData.maritalStatus === "Married" && (
              <>
                <div className="form-group">
                  <label className="form-label">Spouse's Name</label>
                  <input
                    type="text"
                    name="spouseName"
                    value={formData.spouseName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`form-input ${errors.spouseName ? "error" : ""}`}
                  />
                  {/* {errors.spouseName && <div className="error-message">{errors.spouseName}</div>} */}
                </div>
                <div className="form-group">
                  <label className="form-label">Spouse's Date of Birth</label>
                  <input
                    type="date"
                    name="spouseDateOfBirth"
                    value={formData.spouseDateOfBirth}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`form-input ${errors.spouseDateOfBirth ? "error" : ""}`}
                  />
                  {/* {errors.spouseDateOfBirth && <div className="error-message">{errors.spouseDateOfBirth}</div>} */}
                </div>
                <div className="form-group">
                  <label className="form-label">Spouse's Mail ID</label>
                  <input
                    type="email"
                    name="spouseEmail"
                    value={formData.spouseEmail}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`form-input ${errors.spouseEmail ? "error" : ""}`}
                  />
                  {/* {errors.spouseEmail && <div className="error-message">{errors.spouseEmail}</div>} */}
                </div>
                <div className="form-group">
                  <label className="form-label">Wedding Date</label>
                  <input
                    type="date"
                    name="weddingDate"
                    value={formData.weddingDate}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`form-input ${errors.weddingDate ? "error" : ""}`}
                  />
                  {/* {errors.weddingDate && <div className="error-message">{errors.weddingDate}</div>} */}
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className={`form-input ${errors.bloodGroup ? "error" : ""}`}
                />
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredBloodGroups.length > 0 ? (
                      filteredBloodGroups.map((group) => (
                        <div
                          key={group}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                          onClick={() => handleBloodGroupSelect(group)}
                        >
                          {group}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No blood groups found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* {errors.bloodGroup && <div className="error-message">{errors.bloodGroup}</div>} */}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.email ? "error" : ""}`}
              />
              {/* {errors.email && <div className="error-message">{errors.email}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.phone ? "error" : ""}`}
              />
              {/* {errors.phone && <div className="error-message">{errors.phone}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.address ? "error" : ""}`}
              />
              {/* {errors.address && <div className="error-message">{errors.address}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.city ? "error" : ""}`}
              />
              {/* {errors.city && <div className="error-message">{errors.city}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.state ? "error" : ""}`}
              />
              {/* {errors.state && <div className="error-message">{errors.state}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.pincode ? "error" : ""}`}
              />
              {/* {errors.pincode && <div className="error-message">{errors.pincode}</div>} */}
            </div>
            <div className="form-group full-width">
              <label className="form-label">Emergency Contact Numbers</label>
              {formData.emergencyContact.map((contact, idx) => (
                <div key={idx} style={{ marginBottom: 12, border: '1px solid #eee', borderRadius: 6, padding: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Person's name"
                      value={contact.name}
                      onChange={e => handleEmergencyContactChange(idx, 'name', e.target.value)}
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="Relationship "
                      value={contact.relationship}
                      onChange={e => handleEmergencyContactChange(idx, 'relationship', e.target.value)}
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="Contact Number"
                      value={contact.phone}
                      onChange={e => handleEmergencyContactChange(idx, 'phone', e.target.value)}
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={() => removeEmergencyContact(idx)} className="remove-contact-button" style={{ marginLeft: 8 }}>Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addEmergencyContact} className="add-contact-button" style={{ marginTop: 8 }}>Add Emergency Contact</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Experience (Total Years)</label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.experience ? "error" : ""}`}
              />
              {/* {errors.experience && <div className="error-message">{errors.experience}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Current Salary</label>
              <input
                type="text"
                name="currentSalary"
                value={formData.currentSalary}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.currentSalary ? "error" : ""}`}
              />
              {/* {errors.currentSalary && <div className="error-message">{errors.currentSalary}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.position ? "error" : ""}`}
              />
              {/* {errors.position && <div className="error-message">{errors.position}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label"> UAN Number</label>
              <input
                type="text"
                name="uanNumber"
                value={formData.uanNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.uanNumber ? "error" : ""}`}
              />
              {/* {errors.uanNumber && <div className="error-message">{errors.uanNumber}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">ESI Number</label>
              <input
                type="text"
                name="esiNumber"
                value={formData.esiNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.esiNumber ? "error" : ""}`}
              />
              {/* {errors.esiNumber && <div className="error-message">{errors.esiNumber}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Aadhar Number</label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.aadharNumber ? "error" : ""}`}
              />
              {/* {errors.aadharNumber && <div className="error-message">{errors.aadharNumber}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Names as on Aadhar</label>
              <input
                type="text"
                name="namesAsOnAadhar"
                value={formData.namesAsOnAadhar}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${
                  errors.namesAsOnAadhar ? "error" : ""
                }`}
              />
              {/* {errors.namesAsOnAadhar && <div className="error-message">{errors.namesAsOnAadhar}</div>} */}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">PAN </label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.panNumber ? "error" : ""}`}
              />
              {/* {errors.panNumber && <div className="error-message">{errors.panNumber}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Names as on PAN</label>
              <input
                type="text"
                name="namesAsOnPan"
                value={formData.namesAsOnPan}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.namesAsOnPan ? "error" : ""}`}
              />
              {/* {errors.namesAsOnPan && <div className="error-message">{errors.namesAsOnPan}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Bank Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${
                  errors.bankAccountNumber ? "error" : ""
                }`}
              />
              {/* {errors.bankAccountNumber && <div className="error-message">{errors.bankAccountNumber}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Names as per Bank details</label>
              <input
                type="text"
                name="namesAsPerBankDetails"
                value={formData.namesAsPerBankDetails}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${
                  errors.namesAsPerBankDetails ? "error" : ""
                }`}
              />
              {/* {errors.namesAsPerBankDetails && <div className="error-message">{errors.namesAsPerBankDetails}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.bankName ? "error" : ""}`}
              />
              {/* {errors.bankName && <div className="error-message">{errors.bankName}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">Branch Name</label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.branchName ? "error" : ""}`}
              />
              {/* {errors.branchName && <div className="error-message">{errors.branchName}</div>} */}
            </div>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.ifscCode ? "error" : ""}`}
              />
              {/* {errors.ifscCode && <div className="error-message">{errors.ifscCode}</div>} */}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="document-upload-section">
            <h3>Documents Upload</h3>
            <div className="document-list">
          
              {/* Existing document items */}
              {formData.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <label className="document-label">{doc.type}{doc.type === 'All Experience Letters' && (
                    <div style={{ fontSize: '0.95em', color: '#1976d2', marginBottom: 6 }}>
                      Please upload all your experience certificates as a single PDF document.
                    </div>
                  )}</label> 
                  
                  <div className="document-controls">
                    <input
                      type="file"
                      onChange={(e) => handleDocumentUpload(e, index)}
                      className="file-input"
                      id={`document-upload-${index}`}
                      accept=".pdf, .doc, .docx, .jpg, .jpeg, .png"
                      disabled={doc.uploading}
                    />
                    <label
                      htmlFor={`document-upload-${index}`}
                      className="button button-outlined"
                    >
                      {doc.url
                        ? "Change File"
                        : doc.file
                        ? "Change File"
                        : "Choose File"}
                    </label>
                    {doc.uploading && (
                      <span className="file-status uploading">
                        Uploading...
                      </span>
                    )}
                    {doc.url && !doc.uploading && (
                      <>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          View Uploaded File
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDocumentRemove(index)}
                          className="button button-secondary button-remove"
                          disabled={doc.deleting}
                        >
                          {doc.deleting ? "Removing..." : "Remove"}
                        </button>
                      </>
                    )}
                    {doc.file && !doc.uploading && !doc.url && (
                      <span className="file-name">{doc.file.name}</span>
                    )}
                    {doc.file && !doc.uploading && !doc.url && (
                      <button
                        type="button"
                        onClick={() => handleDocumentRemove(index)}
                        className="button button-secondary button-remove"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      {loading && <div style={{margin: 16}}>Loading...</div>}
      <div className="onboarding-paper">
        <h1 className="onboarding-title">Employee Onboarding</h1>
        {submitError && (
          <div className="error-message global-error">{submitError}</div>
        )}
        {submitSuccess && (
          <div className="success-message">Form submitted successfully!</div>
        )}
        <div className="stepper">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`step ${index === activeStep ? "active" : ""}`}
            >
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>
        {activeStep === steps.length - 1 ? (
          <form onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}
            <div className="button-group">
              <button
                type="button"
                className="button button-secondary"
                disabled={activeStep === 0 || isSubmitting}
                onClick={handleBack}
              >
                Back
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting || userStatus === 'Approved'}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        ) : (
          <>
            {renderStepContent(activeStep)}
            <div className="button-group">
              <button
                type="button"
                className="button button-secondary"
                disabled={activeStep === 0 || isSubmitting}
                onClick={handleBack}
              >
                Back
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
