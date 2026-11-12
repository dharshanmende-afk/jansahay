import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import { ShieldCheck, User, MapPin, GraduationCap, DollarSign, Briefcase, Sparkles, ArrowRight, Check, FileText, CheckCircle2, Plus, X } from 'lucide-react';

const COMMON_DOCUMENTS = [
  { name: 'Aadhaar Card', desc: 'UIDAI Identity & Address Proof', category: 'General' },
  { name: 'Income Certificate', desc: 'Issued by Tahsildar / Revenue Department', category: 'General' },
  { name: 'Domicile Certificate', desc: 'Age & Domicile Proof (Maharashtra / State)', category: 'General' },
  { name: 'Bank Passbook', desc: 'Aadhaar-seeded bank account statement', category: 'General' },
  { name: 'Ration Card', desc: 'BPL / Antyodaya / Yellow / Orange Card', category: 'General' },
  { name: 'PAN Card', desc: 'Income Tax Identity Document', category: 'General' },
  { name: 'Caste Certificate', desc: 'SC / ST / OBC / VJNT / SEBC Certificate', category: 'Caste & Social' },
  { name: 'Caste Validity Certificate', desc: 'Scrutiny Committee Verification', category: 'Caste & Social' },
  { name: 'Non-Creamy Layer (NCL)', desc: 'Valid Current Financial Year Certificate', category: 'Caste & Social' },
  { name: 'College Bonafide Certificate', desc: 'Current enrolled student verification', category: 'Education' },
  { name: 'College Fee Receipt', desc: 'Current academic year fee payment receipt', category: 'Education' },
  { name: 'CAP Allotment Letter', desc: 'Centralized Admission Process confirmation', category: 'Education' },
  { name: '10th & 12th Marksheets', desc: 'Board examination academic qualification', category: 'Education' },
  { name: '7/12 & 8A Land Extract (Satbara)', desc: 'Official digital land ownership record', category: 'Farmer' },
  { name: 'Crop Sowing Proof (e-Pik Pahani)', desc: 'Digital crop cultivation verification', category: 'Farmer' },
  { name: 'Udyam Registration Certificate', desc: 'MSME registration certificate', category: 'Business' },
  { name: 'Disability (UDID) Certificate', desc: 'Unique Disability ID certificate', category: 'Special' },
  { name: 'Voter ID (EPIC)', desc: 'Election Commission Voter Card', category: 'General' }
];

export const ProfileWizardPage = () => {
  const { user, isAuthenticated, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customDocInput, setCustomDocInput] = useState('');
  const [formData, setFormData] = useState({
    category: 'STUDENT',
    state: 'Maharashtra',
    district: 'Pune',
    occupation: 'Student',
    incomeRange: 'BELOW_2_LAKH',
    // In-hand documentation inventory
    inHandDocuments: ['Aadhaar Card', 'Income Certificate', 'Domicile Certificate', 'Bank Passbook'],
    // Student specifics
    educationLevel: 'UNDERGRADUATE',
    course: 'B.Tech Computer Engineering',
    currentYear: '3',
    instituteName: 'Government College of Engineering, Pune (COEP)',
    // Farmer specifics
    farmingType: 'CROP_FARMING',
    cropActivity: 'Sugarcane, Wheat and Vegetables',
    landArea: '3.5',
    landOwnership: 'OWNED',
    // Business specifics
    businessType: 'Food Processing / Tech Startup',
    businessStage: 'STARTUP',
    msmeStatus: 'REGISTERED',
    businessDescription: 'Micro agro-processing enterprise'
  });

  useEffect(() => {
    // If user has existing profile, pre-populate; otherwise restore anonymous draft
    if (isAuthenticated) {
      profileService.getProfile().then(res => {
        if (res.success && res.data) {
          setFormData(prev => ({
            ...prev,
            ...res.data,
            inHandDocuments: (res.data.inHandDocuments && res.data.inHandDocuments.length > 0)
              ? res.data.inHandDocuments
              : prev.inHandDocuments
          }));
        }
      }).catch(err => console.log('No prior profile'));
    } else {
      try {
        const anonSaved = localStorage.getItem('jansahay_anon_profile');
        if (anonSaved) {
          const parsed = JSON.parse(anonSaved);
          setFormData(prev => ({
            ...prev,
            ...parsed,
            inHandDocuments: (parsed.inHandDocuments && parsed.inHandDocuments.length > 0)
              ? parsed.inHandDocuments
              : prev.inHandDocuments
          }));
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [isAuthenticated]);

  const toggleDocument = (docName) => {
    setFormData(prev => {
      const exists = prev.inHandDocuments.includes(docName);
      const updated = exists
        ? prev.inHandDocuments.filter(d => d !== docName)
        : [...prev.inHandDocuments, docName];
      return { ...prev, inHandDocuments: updated };
    });
  };

  const addCustomDocument = () => {
    const trimmed = customDocInput.trim();
    if (!trimmed) return;
    if (!formData.inHandDocuments.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        inHandDocuments: [...prev.inHandDocuments, trimmed]
      }));
    }
    setCustomDocInput('');
  };

  const selectAllCategoryDocs = () => {
    const allNames = COMMON_DOCUMENTS.map(d => d.name);
    setFormData(prev => ({
      ...prev,
      inHandDocuments: Array.from(new Set([...prev.inHandDocuments, ...allNames]))
    }));
  };

  const clearAllDocs = () => {
    setFormData(prev => ({
      ...prev,
      inHandDocuments: []
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!isAuthenticated) {
        // Anonymous mode: evaluate schemes directly without forcing account creation
        localStorage.setItem('jansahay_anon_profile', JSON.stringify(formData));
        navigate('/recommendations');
        return;
      }
      await profileService.saveProfile(formData);
      navigate('/recommendations');
    } catch (err) {
      alert('Error saving profile: ' + (err.message || 'Please verify fields'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3rem 0', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <ShieldCheck size={14} /> Data Minimization Guaranteed
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Personalized Citizen Profile
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Answer only the questions needed for scheme discovery. We never ask for Aadhaar numbers, bank details, or passwords.
          </p>
        </div>

        {/* Step Wizard Container */}
        <div className="card" style={{ padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            <button
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: step === 1 ? '#1e3a8a' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '9999px', background: step === 1 ? '#1e3a8a' : '#e2e8f0', color: step === 1 ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
              Citizen Category
            </button>

            <button
              onClick={() => setStep(2)}
              style={{ background: 'none', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: step === 2 ? '#1e3a8a' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '9999px', background: step === 2 ? '#1e3a8a' : '#e2e8f0', color: step === 2 ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
              Location & Income
            </button>

            <button
              onClick={() => setStep(3)}
              style={{ background: 'none', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: step === 3 ? '#1e3a8a' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '9999px', background: step === 3 ? '#1e3a8a' : '#e2e8f0', color: step === 3 ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span>
              Category Details
            </button>

            <button
              onClick={() => setStep(4)}
              style={{ background: 'none', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: step === 4 ? '#1e3a8a' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '9999px', background: step === 4 ? '#1e3a8a' : '#e2e8f0', color: step === 4 ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>4</span>
              Documents In Hand ({formData.inHandDocuments.length})
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Category */}
            {step === 1 && (
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
                  Select Your Primary Beneficiary Category:
                </h3>
                <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
                  {[
                    { id: 'STUDENT', label: 'Student / Scholar', icon: '🎓', desc: 'Higher education scholarships, fee reimbursement, hostel allowance' },
                    { id: 'FARMER', label: 'Farmer / Cultivator', icon: '🌾', desc: 'PM-Kisan, Namo Shetkari, crop insurance, solar pumps' },
                    { id: 'BUSINESS_OWNER', label: 'Business Owner / MSME', icon: '💼', desc: 'Mudra loans, CMEGP subsidy, collateral-free credit, Udyam' },
                    { id: 'JOB_SEEKER', label: 'Job Seeker / Youth', icon: '🎯', desc: 'Skill India training, apprenticeships, employment subsidies' },
                    { id: 'GENERAL_CITIZEN', label: 'General Citizen / Family', icon: '🏡', desc: 'Housing (PMAY), Ayushman healthcare, social pension' }
                  ].map(cat => (
                    <div
                      key={cat.id}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        border: formData.category === cat.id ? '2px solid #1e3a8a' : '1px solid #cbd5e1',
                        backgroundColor: formData.category === cat.id ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                        {cat.desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setStep(2)} className="btn btn-primary">
                    Next: Location & Income <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location & Income */}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>
                  State of Residence & Income Ceiling:
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                  {/* State */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      State / Union Territory
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Other">Other State</option>
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      District / Region
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="e.g. Pune, Satara, Mumbai Suburban, Nagpur"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  {/* Income Range */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Approximate Annual Family Income (from all sources)
                    </label>
                    <select
                      name="incomeRange"
                      value={formData.incomeRange}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                      <option value="BELOW_1_LAKH">Below ₹1,00,000 per annum (BPL / EWS priority)</option>
                      <option value="BELOW_2_LAKH">₹1,00,000 to ₹2,50,000 per annum</option>
                      <option value="BELOW_3_LAKH">₹2,50,000 to ₹5,00,000 per annum</option>
                      <option value="BELOW_5_LAKH">₹5,00,000 to ₹8,00,000 per annum (OBC / EBC ceiling)</option>
                      <option value="ABOVE_5_LAKH">Above ₹8,00,000 per annum</option>
                    </select>
                  </div>

                  {/* Occupation */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Specific Occupation / Role
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      placeholder="e.g. Engineering Student, Sugarcane Farmer, Retail Shopkeeper"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" onClick={() => setStep(1)} className="btn btn-outline">
                    Back
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="btn btn-primary">
                    Next: Category Specifics <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Progressive Category-Specific Questions */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>
                  Specific Details for {formData.category.replace('_', ' ')}:
                </h3>

                {/* If Student */}
                {formData.category === 'STUDENT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Current Education Level
                      </label>
                      <select
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                        <option value="UNDERGRADUATE">Undergraduate (Degree - B.E., B.Tech, B.Sc, B.Com, B.A., MBBS)</option>
                        <option value="POSTGRADUATE">Postgraduate (M.Tech, M.S., MBA, M.A., M.Sc)</option>
                        <option value="DIPLOMA">Polytechnic Diploma</option>
                        <option value="HIGHER_SECONDARY">Higher Secondary (11th / 12th)</option>
                        <option value="SECONDARY">Secondary (10th / High School)</option>
                        <option value="ITI">ITI / Vocational</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Course Name
                      </label>
                      <input
                        type="text"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        placeholder="e.g. B.Tech Computer Engineering"
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          Current Year of Study
                        </label>
                        <select
                          name="currentYear"
                          value={formData.currentYear}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          College / University Name
                        </label>
                        <input
                          type="text"
                          name="instituteName"
                          value={formData.instituteName}
                          onChange={handleChange}
                          placeholder="e.g. Government College of Engineering, Pune"
                          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* If Farmer */}
                {formData.category === 'FARMER' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          Total Landholding (in Acres)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="landArea"
                          value={formData.landArea}
                          onChange={handleChange}
                          placeholder="e.g. 3.5"
                          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          Land Ownership Type
                        </label>
                        <select
                          name="landOwnership"
                          value={formData.landOwnership}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                          <option value="OWNED">Own Land (7/12 in own/family name)</option>
                          <option value="SHARED">Joint Family Land Parcel</option>
                          <option value="LEASED">Tenant / Leased Cultivator</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Primary Crops / Farming Activity
                      </label>
                      <input
                        type="text"
                        name="cropActivity"
                        value={formData.cropActivity}
                        onChange={handleChange}
                        placeholder="e.g. Sugarcane, Cotton, Soybean, Onion, Dairy"
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* If Business */}
                {formData.category === 'BUSINESS_OWNER' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          Business Venture Stage
                        </label>
                        <select
                          name="businessStage"
                          value={formData.businessStage}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                          <option value="IDEA">Idea Stage (Planning new enterprise)</option>
                          <option value="STARTUP">Startup (Under 3 years operations)</option>
                          <option value="GROWING">Growing (Expanding operations)</option>
                          <option value="ESTABLISHED">Established Enterprise</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          Udyam MSME Status
                        </label>
                        <select
                          name="msmeStatus"
                          value={formData.msmeStatus}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                          <option value="REGISTERED">Already Registered (Have Udyam number)</option>
                          <option value="IN_PROGRESS">Application in Progress</option>
                          <option value="NOT_REGISTERED">Not Yet Registered</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Business Type / Sector
                      </label>
                      <input
                        type="text"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        placeholder="e.g. Agro-processing, IT services, Textile, Retail"
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* If Job Seeker or General */}
                {(formData.category === 'JOB_SEEKER' || formData.category === 'GENERAL_CITIZEN') && (
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem', marginBottom: '2rem' }}>
                    Your location and income criteria are sufficient to discover relevant social support, skill training, and health insurance schemes.
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" onClick={() => setStep(2)} className="btn btn-outline">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Next: Documents In Hand ({formData.inHandDocuments.length}) <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Documents In Hand (Citizen Readiness Inventory) */}
            {step === 4 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                      Which Documents Do You Have Right Now in Hand?
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      Select all certificates and identity documents in your possession. JanSahay uses this to calculate your real-time application readiness.
                    </p>
                  </div>
                </div>

                {/* Live In-Hand Counter Banner */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '9999px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={24} color="#16a34a" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#166534', fontSize: '1rem' }}>
                        {formData.inHandDocuments.length} Document{formData.inHandDocuments.length === 1 ? '' : 's'} Ready in Hand
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#15803d' }}>
                        {formData.inHandDocuments.length > 0 
                          ? `Declared: ${formData.inHandDocuments.slice(0, 3).join(', ')}${formData.inHandDocuments.length > 3 ? ` + ${formData.inHandDocuments.length - 3} more` : ''}` 
                          : 'No documents selected yet. Click any card below to add.'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={selectAllCategoryDocs}
                      style={{ background: '#ffffff', border: '1px solid #86efac', color: '#166534', borderRadius: '0.375rem', padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllDocs}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '0.375rem', padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      Clear
                    </button>
                  </div>
                </div>

                {/* Document Selection Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {COMMON_DOCUMENTS.map((doc) => {
                    const isSelected = formData.inHandDocuments.includes(doc.name);
                    return (
                      <div
                        key={doc.name}
                        onClick={() => toggleDocument(doc.name)}
                        style={{
                          border: isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0fdf4' : '#ffffff',
                          borderRadius: '0.5rem',
                          padding: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isSelected ? '0 1px 3px rgba(22, 163, 74, 0.15)' : 'none'
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '4px', background: isSelected ? '#dcfce7' : '#f1f5f9', color: isSelected ? '#166534' : '#64748b' }}>
                            {doc.category}
                          </span>
                          <span style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '9999px',
                            background: isSelected ? '#16a34a' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#94a3b8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {isSelected ? '✓' : '+'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? '#14532d' : '#1e293b', marginBottom: '0.2rem' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.3 }}>
                          {doc.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom In-Hand Document */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                    HAVE ANOTHER CERTIFICATE OR DOCUMENT IN HAND?
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. Electricity Bill, Gap Certificate, Employer NOC..."
                      value={customDocInput}
                      onChange={(e) => setCustomDocInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomDocument(); } }}
                      style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={addCustomDocument}
                      className="btn btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                      <Plus size={14} /> Add Document
                    </button>
                  </div>

                  {/* Custom Added Badges */}
                  {formData.inHandDocuments.filter(d => !COMMON_DOCUMENTS.some(c => c.name === d)).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
                      {formData.inHandDocuments.filter(d => !COMMON_DOCUMENTS.some(c => c.name === d)).map(customDoc => (
                        <span
                          key={customDoc}
                          style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                          {customDoc}
                          <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleDocument(customDoc)} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" onClick={() => setStep(3)} className="btn btn-outline">
                    Back to Category Details
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ background: '#15803d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {loading ? 'Evaluating Rules...' : (
                      <>
                        <Sparkles size={16} /> Save Profile & Discover Schemes Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
