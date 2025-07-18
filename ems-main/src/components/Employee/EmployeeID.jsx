import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FaPhoneAlt } from 'react-icons/fa';
import { GiWaterDrop } from 'react-icons/gi';

const generateEmployeeID = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EMP${dateStr}-${random}`;
};

// Simple barcode representation (text-based, for demo)
const Barcode = ({ value }) => (
  <div style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 4, marginTop: 8, background: '#eee', padding: '4px 0', borderRadius: 4 }}>
    {value ? `| ${value.split('').join(' ')} |` : ''}
  </div>
);

// Helper to get cropped image as data URL (with rotation and circular mask)
function getCroppedImg(imageSrc, croppedAreaPixels, rotation = 0) {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const { width, height, x, y } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;
      ctx.save();
      // Move to center for rotation
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-width / 2, -height / 2);
      // Draw circular mask
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();
      // Draw image
      ctx.drawImage(
        image,
        x, y, width, height, // source crop
        0, 0, width, height  // destination
      );
      ctx.restore();
      resolve(canvas.toDataURL('image/png'));
    };
  });
}

const EmployeeID = () => {
  const [employeeID, setEmployeeID] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState('');
  const [originalPhotoURL, setOriginalPhotoURL] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef();
  const [guardianType, setGuardianType] = useState('Father');
  const [guardianName, setGuardianName] = useState('');
  const [gender, setGender] = useState('');
  const [croppedImgURL, setCroppedImgURL] = useState('');
  const [centerCode, setCenterCode] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  const handleGenerate = () => {
    setEmployeeID(generateEmployeeID());
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const url = URL.createObjectURL(file);
      setPhotoURL(url);
      setOriginalPhotoURL(url);
      setCroppedImgURL(''); // Clear previous cropped image
      setCropModalOpen(true);
    }
  };

  const handleEditPhoto = () => {
    setCropModalOpen(true);
  };

  const handleResetPhoto = () => {
    setPhotoURL(originalPhotoURL);
    setCroppedImgURL(''); // Clear cropped image on reset
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!photoURL || !croppedAreaPixels) return;
    const croppedImg = await getCroppedImg(photoURL, croppedAreaPixels, rotation);
    setPhotoURL(croppedImg);
    setCroppedImgURL(croppedImg);
    setCropModalOpen(false);
  };

  // Download cropped photo
  const handleDownloadPhoto = () => {
    if (!croppedImgURL) return;
    const link = document.createElement('a');
    link.href = croppedImgURL;
    link.download = 'employee-photo.png';
    link.click();
  };

  return (
    <div>
      <div style={{ maxWidth: 520, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8, textAlign: 'center', background: '#f8f9fa' }}>
        <h2>Employee ID Generator</h2>
        <div style={{ margin: '1rem 0' }}>
          <button onClick={handleGenerate} style={{ padding: '0.5rem 1.5rem', fontSize: 16, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Generate Employee ID
          </button>
        </div>
        <form className="employee-id-form" style={{ margin: '1rem 0', textAlign: 'left', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ marginBottom: 14, textAlign: 'center' }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
            <button type="button" className="photo-upload-btn" onClick={() => fileInputRef.current.click()}>
              {photo ? 'Change Photo' : 'Upload Photo'}
            </button>
            {photoURL && (
              <>
                <div><img src={photoURL} alt="Employee" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', border: '2px solid #1976d2', marginTop: 8 }} /></div>
                <button type="button" onClick={handleEditPhoto} style={{ marginTop: 6, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '0.2rem 1rem', fontSize: 14, cursor: 'pointer' }}>Edit Photo</button>
              </>
            )}
          </div>
          <div style={{ marginBottom: 14 }}>
            <input type="text" placeholder="Employee Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <input type="text" placeholder="Position" value={position} onChange={e => setPosition(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <input type="text" placeholder="Center Code" value={centerCode} onChange={e => setCenterCode(e.target.value)} />
          </div>
          {/* <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
            <select value={guardianType} onChange={e => setGuardianType(e.target.value)}>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
            </select>
            <input type="text" placeholder={`Enter ${guardianType} Name`} value={guardianName} onChange={e => setGuardianName(e.target.value)} />
          </div> */}
         
          {/* <div style={{ marginBottom: 14 }}>
            <input type="text" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
          </div> */}
         
          
          <div style={{ marginBottom: 14 }}>
            <input type="text" placeholder="Emergency Contact" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <select value={bloodType} onChange={e => setBloodType(e.target.value)}>
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
           <div style={{ marginBottom: 14 }}>
            <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          {/* <div style={{ marginBottom: 14 }}>
            <select value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div> */}
          
          <div style={{ marginBottom: 14 }}>
            <input type="text" placeholder="Company Email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} />
          </div>
        </form>
        {/* Cropper Modal */}
        {cropModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 10, minWidth: 340, minHeight: 380, position: 'relative' }}>
              <h3 style={{ marginBottom: 12 }}>Edit Photo</h3>
              <div style={{ position: 'relative', width: 300, height: 300, background: '#222', borderRadius: '50%', overflow: 'hidden', margin: '0 auto' }}>
                <Cropper
                  image={photoURL}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  minZoom={1}
                  maxZoom={3}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <label>Zoom: <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
                <label>Rotate: <input type="range" min={-180} max={180} step={1} value={rotation} onChange={e => setRotation(Number(e.target.value))} /></label>
                <div>
                  <button onClick={handleResetPhoto} style={{ marginRight: 8, background: '#bbb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.3rem 1rem', cursor: 'pointer' }}>Reset</button>
                  <button onClick={() => setCropModalOpen(false)} style={{ marginRight: 8, background: '#bbb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.3rem 1rem', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleCropSave} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '0.3rem 1rem', cursor: 'pointer' }}>Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ID Card Preview and Print Button OUTSIDE the main box */}
      <div style={{ margin: '3rem auto 0', maxWidth: 900 }}>
        <h3 style={{ margin: '2rem 0 1rem', textAlign: 'center' }}>ID Card Preview</h3>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {croppedImgURL && (
            <>
              <button onClick={handleEditPhoto} style={{ marginRight: 12, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '0.4rem 1.2rem', fontSize: 15, cursor: 'pointer' }}>Re-crop Photo</button>
              <button onClick={handleDownloadPhoto} style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 4, padding: '0.4rem 1.2rem', fontSize: 15, cursor: 'pointer' }}>Download Photo</button>
            </>
          )}
        </div>
        <div style={{
          width: 700,
          margin: '0 auto',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'row',
          gap: 32,
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              color: '#1976d2',
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 8,
              textAlign: 'center',
              letterSpacing: 1,
            }}>ID Card</div>
            <div style={{
              width: 340,
              minHeight: 220,
              background: '#fff',
              border: '2px solid #1976d2',
              borderRadius: 14,
              boxShadow: '0 2px 12px rgba(25,118,210,0.13)',
              padding: 12,
              textAlign: 'left',
              position: 'relative',
              fontFamily: 'sans-serif',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <img src="/logo_synchro.png" alt="SynchroServe Logo" style={{ height: 38, width: 'auto', marginBottom: 2 }} />
              </div>
              {croppedImgURL ? (
                <img src={croppedImgURL} alt="Employee" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', border: '2px solid #1976d2', background: '#fff', marginBottom: 12 }} />
              ) : (
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#e3e3e3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 40, border: '2px solid #bbb', marginBottom: 12 }}>?</div>
              )}
              <div style={{ fontWeight: 700, fontSize: 20, color: '#1976d2', marginBottom: 8 }}>
                {/* <b>Employee Name:</b> {name || 'N/A'} */}
              </div>
              {/* ID Card Fields - styled */}
              <div className="id-card-fields">
                <div className="id-card-field id-card-name">{name || 'N/A'}</div>
                <div className="id-card-field id-card-id">{employeeID || 'Not generated'}</div>
                <div className="id-card-field id-card-position">{position || 'N/A'}</div>
                <div className="id-card-field id-card-center">{centerCode || 'N/A'}</div>
                <div className="id-card-field id-card-contact">
                  <FaPhoneAlt style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {typeof emergencyContact === 'string' ? emergencyContact : 'N/A'}
                </div>
                <div className="id-card-field id-card-blood">
                  <GiWaterDrop style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {bloodType ? String(bloodType) : 'N/A'}
                </div>
                <div className="id-card-field id-card-address">{address || 'N/A'}</div>
                {/* <div className="id-card-field id-card-email">{companyEmail || 'N/A'}</div> */}
              </div>
              {/* <div style={{ marginTop: 16, marginBottom: 16 }}><Barcode value={employeeID} /></div> */}
              <div style={{ position: 'absolute', bottom: 10, right: 16, fontSize: 10, color: '#d32f2f' }}>SYNCHROSERVE@GMAIL.COM</div>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          style={{ margin: '2rem auto 0', display: 'block', padding: '0.6rem 2rem', fontSize: 16, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          className="print-hide"
        >
          Print ID Card
        </button>
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .id-card-print-area, .id-card-print-area * {
              visibility: visible !important;
            }
            .id-card-print-area {
              position: absolute !important;
              left: 0; right: 0; top: 0; margin: 0 auto !important;
              box-shadow: none !important;
              background: #fff !important;
              width: 700px !important;
              z-index: 9999 !important;
            }
            .print-hide {
              display: none !important;
            }
          }
        `}</style>
      </div>
      <style>{`
        .employee-id-form input, .employee-id-form select {
          width: 100%;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1.5px solid #cfd8dc;
          background: #fff;
          margin-bottom: 18px;
          font-size: 16px;
          box-shadow: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .employee-id-form input:focus, .employee-id-form select:focus {
          border-color: #1976d2;
          outline: none;
          box-shadow: 0 0 0 2px #e3f2fd;
          background: #f5faff;
        }
        .employee-id-form input:hover, .employee-id-form select:hover {
          border-color: #90caf9;
        }
        .employee-id-form button[type="button"] {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1.4rem;
          font-size: 16px;
          cursor: pointer;
          margin-bottom: 10px;
          box-shadow: 0 1px 4px rgba(25, 118, 210, 0.08);
          transition: background 0.2s, box-shadow 0.2s;
        }
        .employee-id-form button[type="button"]:hover {
          background: #1565c0;
          box-shadow: 0 2px 8px rgba(25, 118, 210, 0.13);
        }
        .employee-id-form button.photo-upload-btn {
          color: #d32f2f !important;
          background: #fff;
          border: 1.5px solid #d32f2f;
          border-radius: 6px;
          padding: 0.5rem 1.4rem;
          font-size: 16px;
          cursor: pointer;
          margin-bottom: 10px;
          box-shadow: 0 1px 4px rgba(211, 47, 47, 0.08);
          transition: background 0.2s, box-shadow 0.2s, color 0.2s;
        }
        .employee-id-form button.photo-upload-btn:hover {
          background: #ffebee;
          color: #b71c1c !important;
          border-color: #b71c1c;
        }
        .id-card-fields {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin: 10px 0 0 0;
        }
        .id-card-field { color: #1976d2; background: #fff; font-size: 16px; font-weight: 700; padding: 7px 10px; border-radius: 7px; letter-spacing: 0.2px; text-align: center; margin-bottom: 2px; }
        .id-card-name { color: #1976d2; }
        .id-card-id { color: #388e3c; }
        .id-card-position { color: #fbc02d;  }
        .id-card-center { color: #7b1fa2; }
        .id-card-contact { color: #0288d1; }
        .id-card-blood { color: #d32f2f; }
        .id-card-address { color: #5d4037; }
        .id-card-email { color: #c2185b; }
      `}</style>
    </div>
  );
};

export default EmployeeID; 