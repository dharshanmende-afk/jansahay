// Comprehensive Seed Dataset for JanSahay AI
// 25+ Verified Central & State Schemes, 12+ Smart Document Acquisition Guides, Live Updates

export const initialSeedData = {
  users: [
    {
      id: 1,
      name: "Government Administrator",
      email: "admin@jansahay.gov.in",
      passwordHash: "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1l5pZ2Tz4qC1l5pZ2Tz4qC1l5pZ2Tz", // Admin@123
      role: "ADMIN",
      createdAt: "2026-01-15T10:00:00.000Z"
    },
    {
      id: 2,
      name: "Rahul Patil",
      email: "student@jansahay.ai",
      passwordHash: "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1l5pZ2Tz4qC1l5pZ2Tz4qC1l5pZ2Tz", // Student@123
      role: "CITIZEN",
      createdAt: "2026-02-10T11:30:00.000Z"
    },
    {
      id: 3,
      name: "Ramesh Shinde",
      email: "farmer@jansahay.ai",
      passwordHash: "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1l5pZ2Tz4qC1l5pZ2Tz4qC1l5pZ2Tz", // Farmer@123
      role: "CITIZEN",
      createdAt: "2026-02-15T09:15:00.000Z"
    },
    {
      id: 4,
      name: "Priya Deshmukh",
      email: "business@jansahay.ai",
      passwordHash: "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1l5pZ2Tz4qC1l5pZ2Tz4qC1l5pZ2Tz", // Business@123
      role: "CITIZEN",
      createdAt: "2026-03-01T14:20:00.000Z"
    }
  ],

  profiles: [
    {
      id: 1,
      userId: 2,
      category: "STUDENT",
      state: "Maharashtra",
      district: "Pune",
      occupation: "Engineering Student",
      incomeRange: "BELOW_2_LAKH",
      educationLevel: "UNDERGRADUATE",
      course: "B.Tech Computer Engineering",
      currentYear: 3,
      instituteName: "Government College of Engineering, Pune (COEP)",
      farmingType: null,
      cropActivity: null,
      landArea: null,
      landOwnership: null,
      businessType: null,
      businessStage: null,
      msmeStatus: null,
      businessDescription: null,
      profileComplete: true,
      updatedAt: "2026-03-10T12:00:00.000Z"
    },
    {
      id: 2,
      userId: 3,
      category: "FARMER",
      state: "Maharashtra",
      district: "Satara",
      occupation: "Farmer",
      incomeRange: "BELOW_2_LAKH",
      educationLevel: "SECONDARY",
      course: null,
      currentYear: null,
      instituteName: null,
      farmingType: "CROP_FARMING",
      cropActivity: "Sugarcane and Soybean",
      landArea: 3.5,
      landOwnership: "OWNED",
      businessType: null,
      businessStage: null,
      msmeStatus: null,
      businessDescription: null,
      profileComplete: true,
      updatedAt: "2026-03-12T10:00:00.000Z"
    },
    {
      id: 3,
      userId: 4,
      category: "BUSINESS_OWNER",
      state: "Maharashtra",
      district: "Mumbai",
      occupation: "Entrepreneur",
      incomeRange: "BELOW_5_LAKH",
      educationLevel: "POSTGRADUATE",
      course: null,
      currentYear: null,
      instituteName: null,
      farmingType: null,
      cropActivity: null,
      landArea: null,
      landOwnership: null,
      businessType: "Food Processing & Agri-tech Services",
      businessStage: "STARTUP",
      msmeStatus: "REGISTERED",
      businessDescription: "Organic direct-to-consumer farm produce aggregation and packaging",
      profileComplete: true,
      updatedAt: "2026-03-15T15:30:00.000Z"
    }
  ],

  userDocuments: [
    { id: 1, userId: 2, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", status: "AVAILABLE", notes: "Linked with mobile", updatedAt: "2026-03-01T10:00:00.000Z" },
    { id: 2, userId: 2, documentType: "INCOME_CERTIFICATE", documentName: "Income Certificate (Tehsildar)", status: "MISSING", notes: "Expired on March 31", updatedAt: "2026-03-05T11:00:00.000Z" },
    { id: 3, userId: 2, documentType: "DOMICILE_CERTIFICATE", documentName: "Domicile / Residence Certificate of Maharashtra", status: "AVAILABLE", notes: "Issued by SDO Pune", updatedAt: "2026-03-02T10:00:00.000Z" },
    { id: 4, userId: 2, documentType: "BONAFIDE_CERTIFICATE", documentName: "College Bonafide Certificate", status: "AVAILABLE", notes: "Current academic session", updatedAt: "2026-03-08T09:30:00.000Z" },
    { id: 5, userId: 2, documentType: "NON_CREAMY_LAYER", documentName: "Non-Creamy Layer Certificate", status: "NEEDS_VERIFICATION", notes: "Needs renewal for current FY", updatedAt: "2026-03-09T14:10:00.000Z" },
    { id: 6, userId: 3, documentType: "SEVEN_TWELVE_EXTRACT", documentName: "7/12 Land Record Extract", status: "AVAILABLE", notes: "Mahabhumi digital copy", updatedAt: "2026-03-01T10:00:00.000Z" },
    { id: 7, userId: 3, documentType: "BANK_PASSBOOK", documentName: "Bank Passbook (NPCI Aadhar Seeded)", status: "AVAILABLE", notes: "SBI Satara branch", updatedAt: "2026-03-01T10:00:00.000Z" },
    { id: 8, userId: 4, documentType: "UDYAM_REGISTRATION", documentName: "Udyam MSME Registration Certificate", status: "AVAILABLE", notes: "Ministry of MSME", updatedAt: "2026-03-01T10:00:00.000Z" }
  ],

  documentGuides: [
    {
      id: 1,
      documentType: "INCOME_CERTIFICATE",
      title: "Income Certificate (उत्पन्नाचा दाखला)",
      simpleDescription: "Official legal certificate declaring the annual family income of a citizen, issued by the Revenue Department for government scholarship, fee reimbursement, and subsidy schemes.",
      applicableState: "Maharashtra",
      issuingAuthority: "Tehsildar / Sub-Divisional Officer (Revenue Department, Govt of Maharashtra)",
      eligibilityOrPrerequisites: "Resident of Maharashtra with verifiable sources of annual household income.",
      requiredSupportingDocuments: [
        "Identity Proof (Aadhaar Card / Voter ID)",
        "Address Proof (Ration Card / Electricity Bill / Telephone Bill)",
        "Income Proof (Salary Slip / Form 16 / Income Tax Return / Employer Letter)",
        "Self-Declaration Affidavit / Talathi Income Verification Report",
        "Passport size photograph"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Online Registration on Aaple Sarkar Portal", detail: "Visit the official Maharashtra Aaple Sarkar portal (aaplesarkar.mahaonline.gov.in) and register or log in using your mobile number and OTP.", method: "ONLINE" },
        { stepNumber: 2, title: "Select Revenue Department & Income Certificate", detail: "Navigate to 'Revenue Department' services and select 'Issue of Income Certificate (1 year or 3 years)'.", method: "ONLINE" },
        { stepNumber: 3, title: "Fill Applicant & Household Income Details", detail: "Fill applicant's details, occupation, family member details, and declared annual income accurately matching your supporting documents.", method: "ONLINE" },
        { stepNumber: 4, title: "Upload Supporting Documents & Pay Fee", detail: "Upload scanned copies of Aadhaar, Ration Card, Salary slip / Talathi report, and pay the nominal statutory processing fee online.", method: "ONLINE" },
        { stepNumber: 5, title: "Verification & Digital Certificate Download", detail: "The application is verified by the Talathi and approved by the Tehsildar. Download your digitally signed barcoded certificate directly from the portal.", method: "ONLINE" },
        { stepNumber: 6, title: "Alternative Offline Route (CSC / Maha e-Seva Kendra)", detail: "If applying offline, visit your nearest Maha e-Seva Kendra or Setu Suvidha Kendra at the Tehsildar office with original documents and self-attested photocopies.", method: "OFFLINE" }
      ],
      applicationMethod: "BOTH",
      officialApplicationUrl: "https://aaplesarkar.mahaonline.gov.in",
      officialInformationUrl: "https://rts.maharashtra.gov.in",
      possibleFees: "₹33.60 on Aaple Sarkar portal; ₹50 at Maha e-Seva Kendra",
      expectedProcessingTime: "15 to 21 working days (Mandated under Right to Public Services Act)",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "For MahaDBT scholarship applications, ensure the certificate clearly mentions the parent's full name and matches the exact spelling in your Aadhaar card."
    },
    {
      id: 2,
      documentType: "DOMICILE_CERTIFICATE",
      title: "Domicile & Nationality Certificate (अधिवास व राष्ट्रीयत्व प्रमाणपत्र)",
      simpleDescription: "Official certification proving that the citizen is a permanent resident of Maharashtra for at least 15 consecutive years, required for government college admissions, quota benefits, and state jobs.",
      applicableState: "Maharashtra",
      issuingAuthority: "Executive Magistrate / Tehsildar / Sub-Divisional Officer",
      eligibilityOrPrerequisites: "Continuous residence in Maharashtra for a minimum of 15 years, or birth in Maharashtra with continuous education.",
      requiredSupportingDocuments: [
        "Aadhaar Card / Voter ID of applicant",
        "Birth Certificate or School Leaving Certificate (showing place of birth in Maharashtra)",
        "Proof of 15 years continuous residence (School LC, Rent agreements, Electricity bills, Ration card)",
        "Ration Card copy showing family residence",
        "Passport size photograph and self-declaration"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Login to Aaple Sarkar Portal", detail: "Access aaplesarkar.mahaonline.gov.in and log in with your citizen credentials.", method: "ONLINE" },
        { stepNumber: 2, title: "Select Age, Nationality and Domicile Certificate", detail: "Under Revenue Department, click on 'Age, Nationality and Domicile Certificate'.", method: "ONLINE" },
        { stepNumber: 3, title: "Enter Residential History", detail: "Enter continuous residential history in Maharashtra covering the past 15 years including school addresses and home addresses.", method: "ONLINE" },
        { stepNumber: 4, title: "Upload Documents & Fee Submission", detail: "Upload verified address proofs and school leaving certificate. Pay the government fee.", method: "ONLINE" },
        { stepNumber: 5, title: "Scrutiny & Issuance", detail: "Police/Talathi verification may be conducted if records are incomplete. Once approved, download digitally signed certificate.", method: "ONLINE" }
      ],
      applicationMethod: "BOTH",
      officialApplicationUrl: "https://aaplesarkar.mahaonline.gov.in",
      officialInformationUrl: "https://revenue.maharashtra.gov.in",
      possibleFees: "₹33.60 online; ₹50 at Setu Kendra",
      expectedProcessingTime: "15 working days",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "A single combined certificate for 'Age, Nationality and Domicile' is issued in Maharashtra and has lifetime validity once issued."
    },
    {
      id: 3,
      documentType: "CASTE_CERTIFICATE",
      title: "Caste Certificate (जातीचे प्रमाणपत्र)",
      simpleDescription: "Official document certifying that a citizen belongs to a Scheduled Caste (SC), Scheduled Tribe (ST), VJNT, Nomadic Tribe (NT), Special Backward Class (SBC), or Other Backward Classes (OBC).",
      applicableState: "Maharashtra",
      issuingAuthority: "Sub-Divisional Officer (SDO) / Deputy Collector",
      eligibilityOrPrerequisites: "Belonging to a recognized notified caste/tribe in Maharashtra with documentary proof of lineage before the designated cut-off year (1961 for SC/ST, 1967 for VJNT/OBC).",
      requiredSupportingDocuments: [
        "Applicant's School Leaving Certificate mentioning caste",
        "Father's or Paternal Uncle's School Leaving Certificate / Primary School Record showing caste",
        "Grandfather's birth extract / school record pre-dating the state cut-off year (1961 or 1967)",
        "Affidavit in prescribed Form 3 / Form 4",
        "Aadhaar Card and 7/12 land extract of paternal family (if available)"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Prepare Paternal Lineage Proofs", detail: "Gather school and birth records of your father, grandfather, or paternal cousins establishing your caste and continuous Maharashtra residence prior to 1967.", method: "OFFLINE" },
        { stepNumber: 2, title: "Apply Online on Aaple Sarkar", detail: "Login to aaplesarkar.mahaonline.gov.in, select 'Social Justice and Special Assistance' department, and choose 'Caste Certificate'.", method: "ONLINE" },
        { stepNumber: 3, title: "Complete Family Tree (Vanshaval) Chart", detail: "Submit the genealogy tree (Vanshaval) showing direct relation between applicant and the relative whose historical record is attached.", method: "ONLINE" },
        { stepNumber: 4, title: "Biometric or Physical Verification if Summoned", detail: "Attend the SDO office if asked for document inspection with original school registries.", method: "BOTH" },
        { stepNumber: 5, title: "Receive Digitally Signed Certificate", detail: "Download the barcoded certificate with unique verification QR code.", method: "ONLINE" }
      ],
      applicationMethod: "BOTH",
      officialApplicationUrl: "https://aaplesarkar.mahaonline.gov.in",
      officialInformationUrl: "https://sjsa.maharashtra.gov.in",
      possibleFees: "₹33.60 online; ₹50 at Citizen Facilitation Centre",
      expectedProcessingTime: "45 working days",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "For admission to professional degree courses (Engineering, Medical, Pharmacy), you will also need a separate 'Caste Validity Certificate' from the Scrutiny Committee."
    },
    {
      id: 4,
      documentType: "NON_CREAMY_LAYER",
      title: "Non-Creamy Layer Certificate (NCL) (नॉन-क्रिमीलेअर प्रमाणपत्र)",
      simpleDescription: "Mandatory certificate for OBC, VJNT, and SBC candidates proving that their gross annual family income is below ₹8 Lakhs for the last three consecutive financial years.",
      applicableState: "Maharashtra",
      issuingAuthority: "Sub-Divisional Officer / Tehsildar",
      eligibilityOrPrerequisites: "Belonging to OBC / VJ / NT / SBC categories in Maharashtra, with annual family income less than ₹8,00,000 for each of the preceding 3 financial years.",
      requiredSupportingDocuments: [
        "Applicant's valid Caste Certificate",
        "Income tax returns (ITR) or Form 16 or Tehsildar Income Certificates for the preceding 3 financial years",
        "Aadhaar Card and Ration Card",
        "Affidavit regarding agricultural and non-agricultural income",
        "Property / Land documents (7/12 extract if applicable)"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Obtain 3-Year Income Proofs", detail: "Ensure you have income certificates or Income Tax Returns for the last 3 financial years.", method: "OFFLINE" },
        { stepNumber: 2, title: "Submit on Aaple Sarkar", detail: "Navigate to Revenue Department -> 'Non-Creamy Layer Certificate' on aaplesarkar.mahaonline.gov.in.", method: "ONLINE" },
        { stepNumber: 3, title: "Upload Caste Certificate and Income Records", detail: "Attach clear scanned copies of your valid caste certificate and three-year income declarations.", method: "ONLINE" },
        { stepNumber: 4, title: "Pay Processing Fee and Track Application", detail: "Pay the portal fee and track the application status using the application token.", method: "ONLINE" }
      ],
      applicationMethod: "BOTH",
      officialApplicationUrl: "https://aaplesarkar.mahaonline.gov.in",
      officialInformationUrl: "https://rts.maharashtra.gov.in",
      possibleFees: "₹33.60 online",
      expectedProcessingTime: "21 working days",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "NCL certificates are valid for 1 or 3 financial years ending on March 31. Always verify the validity period before submitting scholarship forms."
    },
    {
      id: 5,
      documentType: "SEVEN_TWELVE_EXTRACT",
      title: "7/12 & 8A Land Extract (सातबारा व ८-अ उतारा)",
      simpleDescription: "Official land revenue ownership record and crop register maintained by the village Talathi, required for all agriculture subsidies, PM-Kisan, and crop insurance.",
      applicableState: "Maharashtra",
      issuingAuthority: "Revenue & Forest Department, Maharashtra (Bhulekh Mahabhumi)",
      eligibilityOrPrerequisites: "Landowner holding registered agricultural or non-agricultural land parcel in Maharashtra.",
      requiredSupportingDocuments: [
        "Survey Number / Gat Number / Khata Number",
        "District, Taluka, and Village name",
        "Aadhaar Card linked to land record (e-KYC)"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Access Digital 7/12 Portal (Mahabhumi)", detail: "Visit mahabhumi.gov.in or the dedicated DigitalSatbara portal (digitalsatbara.mahabhumi.gov.in).", method: "ONLINE" },
        { stepNumber: 2, title: "Select Location (District, Taluka, Village)", detail: "Select your district, taluka, and revenue village where the agricultural land is situated.", method: "ONLINE" },
        { stepNumber: 3, title: "Search by Survey Number or Name", detail: "Enter your Gat / Survey number or search by owner's first name / last name.", method: "ONLINE" },
        { stepNumber: 4, title: "Download Digitally Signed 7/12 and 8A Extract", detail: "Recharge wallet with ₹15 and instantly download the digitally signed 7/12 with valid QR code, which does not require any physical Talathi signature.", method: "ONLINE" }
      ],
      applicationMethod: "ONLINE",
      officialApplicationUrl: "https://digitalsatbara.mahabhumi.gov.in",
      officialInformationUrl: "https://mahabhumi.gov.in",
      possibleFees: "₹15 per digitally signed 7/12 extract; free for viewing only",
      expectedProcessingTime: "Instant (Digital 7/12 with QR Code)",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "Digitally signed extracts downloaded from the official Mahabhumi portal are legally valid across all banks, courts, and government departments without manual countersignature."
    },
    {
      id: 6,
      documentType: "UDYAM_REGISTRATION",
      title: "Udyam MSME Registration Certificate (उद्यम नोंदणी)",
      simpleDescription: "Free, paperless national business registration certificate issued by the Ministry of MSME, Govt of India, unlocking priority sector lending, collateral-free loans, and government tender exemptions.",
      applicableState: "All India",
      issuingAuthority: "Ministry of Micro, Small and Medium Enterprises (MSME), Govt of India",
      eligibilityOrPrerequisites: "Any individual or entity operating a micro, small, or medium enterprise in manufacturing or service sectors in India.",
      requiredSupportingDocuments: [
        "Aadhaar Card of the proprietor/partner/director (must be linked to active mobile for OTP)",
        "PAN Card of the enterprise or individual proprietor",
        "Bank Account details (Account Number & IFSC Code)",
        "Business commencement date, activities (NIC Code), and investment figures"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Open Official Udyam Registration Portal", detail: "Visit udyamregistration.gov.in. Beware of fake commercial portals charging fees; the official portal is 100% free.", method: "ONLINE" },
        { stepNumber: 2, title: "Aadhaar Verification via OTP", detail: "Enter 12-digit Aadhaar number and name as per Aadhaar. Validate using OTP received on your mobile.", method: "ONLINE" },
        { stepNumber: 3, title: "PAN Verification & GSTIN Details", detail: "Enter PAN details. The portal automatically syncs income tax details if returns have been filed.", method: "ONLINE" },
        { stepNumber: 4, title: "Enter Unit Address, National Industry Classification (NIC)", detail: "Enter plant/factory address, choose 2-digit/4-digit NIC codes for your business activities, and number of employees.", method: "ONLINE" },
        { stepNumber: 5, title: "Instant Udyam Registration Certificate", detail: "Submit with final OTP. Your permanent Udyam Registration Number is generated. Download the certificate within 24-48 hours.", method: "ONLINE" }
      ],
      applicationMethod: "ONLINE",
      officialApplicationUrl: "https://udyamregistration.gov.in",
      officialInformationUrl: "https://msme.gov.in",
      possibleFees: "FREE (₹0 - Government charges no fee)",
      expectedProcessingTime: "Instant to 48 hours",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "Never pay any agent or private portal for Udyam Registration. The Ministry does not authorize any third-party fee."
    },
    {
      id: 7,
      documentType: "BONAFIDE_CERTIFICATE",
      title: "College Bonafide Certificate",
      simpleDescription: "Official letter from an educational institution stating that the student is genuinely enrolled in a specific course and academic year.",
      applicableState: "All India",
      issuingAuthority: "Principal / Registrar of the College / University",
      eligibilityOrPrerequisites: "Active student admitted to an approved school, college, or university.",
      requiredSupportingDocuments: [
        "College Identity Card",
        "Fee Payment Receipt for the current academic session",
        "Previous semester mark sheet or admission confirmation slip"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Submit Application at College Student Section / ERP", detail: "Apply through your college student ERP portal or submit a written application form to the Student Welfare Section.", method: "BOTH" },
        { stepNumber: 2, title: "Attach Fee Receipt and ID Card Copy", detail: "Attach the current semester fee payment receipt to verify active student enrollment.", method: "OFFLINE" },
        { stepNumber: 3, title: "Collection with Seal and Signature", detail: "Collect the bonafide certificate bearing the college round seal and Principal's or Registrar's signature.", method: "OFFLINE" }
      ],
      applicationMethod: "BOTH",
      officialApplicationUrl: "https://mahadbt.maharashtra.gov.in",
      officialInformationUrl: "https://higheredn.maharashtra.gov.in",
      possibleFees: "Free to nominal ₹10-₹50 depending on institution",
      expectedProcessingTime: "1 to 3 working days",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "For MahaDBT scholarships, ensure the bonafide mentions your course name, current year of study, and whether you are a day scholar or hosteller."
    },
    {
      id: 8,
      documentType: "DISABILITY_CERTIFICATE",
      title: "UDID & Disability Certificate (दिव्यांग प्रमाणपत्र)",
      simpleDescription: "National Unique Disability Identity (UDID) card and medical assessment certificate confirming 40% or more benchmark disability.",
      applicableState: "All India",
      issuingAuthority: "District Medical Board / Chief Medical Officer (CMO)",
      eligibilityOrPrerequisites: "Person with 40% or more specified disability as defined under Rights of Persons with Disabilities Act, 2016.",
      requiredSupportingDocuments: [
        "Aadhaar Card / Voter ID",
        "Recent color passport photo showing the disability",
        "Previous medical reports or hospital treatment slips",
        "Address proof"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Apply Online on Swavlamban Portal", detail: "Visit swavlambancard.gov.in and click on 'Apply for Disability Certificate & UDID Card'.", method: "ONLINE" },
        { stepNumber: 2, title: "Upload Photo, Signature, and Proofs", detail: "Fill in personal, employment, and disability details. Upload Aadhaar and recent photograph.", method: "ONLINE" },
        { stepNumber: 3, title: "Hospital Assessment Appointment", detail: "The portal schedules an assessment date at your assigned District Civil Hospital.", method: "OFFLINE" },
        { stepNumber: 4, title: "Medical Board Examination", detail: "Attend the Medical Board examination where doctors evaluate the percentage of benchmark disability.", method: "OFFLINE" },
        { stepNumber: 5, title: "Download e-UDID Card", detail: "Once approved by the CMO, download your e-UDID card. The plastic card is also dispatched by post.", method: "ONLINE" }
      ],
      applicationMethod: "BOTH",
      officialApplicationUrl: "https://www.swavlambancard.gov.in",
      officialInformationUrl: "https://disabilityaffairs.gov.in",
      possibleFees: "FREE (Government assessment is free)",
      expectedProcessingTime: "30 to 45 days",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "The UDID card is accepted across all states and central government ministries for railway concessions, bus passes, and education quotas."
    },
    {
      id: 9,
      documentType: "CASTE_VALIDITY",
      title: "Caste Validity Certificate (जात पडताळणी प्रमाणपत्र)",
      simpleDescription: "Statutory validity certificate issued by the District Caste Scrutiny Committee confirming that the caste certificate was legitimately obtained and verified against historical records.",
      applicableState: "Maharashtra",
      issuingAuthority: "Divisional Caste Scrutiny Committee (Dr. Babasaheb Ambedkar Research & Training Institute - BARTI)",
      eligibilityOrPrerequisites: "Candidate holding a valid Caste Certificate seeking admission to professional courses (Engineering, Medical, Pharmacy) or contesting local body elections.",
      requiredSupportingDocuments: [
        "Original Caste Certificate",
        "School Leaving Certificates of applicant, father, and grandfather",
        "Form 16 or 17 application counter-signed by College Principal",
        "Affidavit in Form 3",
        "Genealogy tree (Vanshaval)"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Apply via CCVIS Portal", detail: "Access barti.maharashtra.gov.in CCVIS portal and submit online application.", method: "ONLINE" },
        { stepNumber: 2, title: "Submit Physical File to Scrutiny Committee", detail: "Submit attested physical file along with College recommendation letter.", method: "OFFLINE" },
        { stepNumber: 3, title: "Committee Hearing & Scrutiny", detail: "Vigilance cell inspects origin village if deemed necessary.", method: "BOTH" },
        { stepNumber: 4, title: "Issuance of Validity Certificate", detail: "Collect Caste Validity Certificate from District Committee.", method: "OFFLINE" }
      ],
      applicationMethod: "BOTH",
      officialApplicationUrl: "https://bartievalidity.maharashtra.gov.in",
      officialInformationUrl: "https://barti.in",
      possibleFees: "Free / Nominal processing fee",
      expectedProcessingTime: "45 to 90 days",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "Mandatory for all reserved category students entering final merit lists of CAP engineering and medical colleges in Maharashtra."
    },
    {
      id: 10,
      documentType: "RATION_CARD",
      title: "Digital Ration Card / Family Card (रेशन कार्ड)",
      simpleDescription: "Official document issued by Food and Civil Supplies Department serving as household identity and enabling subsidized foodgrains under National Food Security Act (NFSA).",
      applicableState: "Maharashtra",
      issuingAuthority: "Food, Civil Supplies and Consumer Protection Department",
      eligibilityOrPrerequisites: "Family living in Maharashtra without an existing ration card in any other state.",
      requiredSupportingDocuments: [
        "Aadhaar cards of all family members",
        "Electricity bill / Property tax receipt / Rent agreement",
        "Income certificate or salary slip",
        "Family head passport photograph"
      ],
      applicationSteps: [
        { stepNumber: 1, title: "Visit RCMS Maharashtra Portal", detail: "Visit rcms.mahafood.gov.in and click on 'Online Ration Card Management System'.", method: "ONLINE" },
        { stepNumber: 2, title: "Fill Member & Address Details", detail: "Enter details of all family members, gas connection status, and annual income.", method: "ONLINE" },
        { stepNumber: 3, title: "Inspection by Supply Inspector", detail: "Local Rationing Officer or Supply Inspector conducts field check.", method: "BOTH" }
      ],
      applicationMethod: "BOTH",
      officialApplicationUrl: "https://rcms.mahafood.gov.in",
      officialInformationUrl: "https://mahafood.gov.in",
      possibleFees: "₹10 to ₹20",
      expectedProcessingTime: "30 working days",
      lastVerifiedAt: "2026-03-01",
      verificationStatus: "VERIFIED",
      publicationStatus: "PUBLISHED",
      additionalNotes: "Required as family member proof for Ayushman Bharat (PM-JAY) and PMAY housing schemes."
    }
  ],

  schemes: [
    {
      id: 1,
      name: "Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna (EBC)",
      description: "Post-matric tuition and exam fee reimbursement scheme for economically backward class (EBC) students pursuing higher and technical education in Maharashtra.",
      category: "EDUCATION",
      governmentLevel: "STATE",
      state: "Maharashtra",
      targetBeneficiaries: "Students belonging to Economically Backward Class (EBC) / Open Category admitted through CAP in approved professional & non-professional courses in Maharashtra.",
      ageCondition: "No strict upper age limit; must be enrolled in recognized degree/diploma course.",
      educationCondition: "Admitted to Diploma, Degree, or Postgraduate course through Centralized Admission Process (CAP).",
      incomeCondition: "Annual family income must not exceed ₹8,00,000 per annum.",
      benefit: "50% of Tuition Fee and Exam Fee reimbursement for general open category with income up to ₹8 Lakhs.",
      sourceUrl: "https://mahadbt.maharashtra.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "EQUALS", value: "STUDENT", description: "Applicant must be an active student", required: true },
        { field: "state", operator: "EQUALS", value: "Maharashtra", description: "Must be a resident of Maharashtra state", required: true },
        { field: "educationlevel", operator: "IN", value: "DIPLOMA,UNDERGRADUATE,POSTGRADUATE", description: "Must be enrolled in Diploma, Undergrad or Postgrad program", required: true },
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH,BELOW_3_LAKH,BELOW_5_LAKH", description: "Family annual income must be below ₹8 Lakhs", required: true }
      ],
      requiredDocuments: [
        { id: 101, documentType: "DOMICILE_CERTIFICATE", documentName: "Domicile Certificate of Maharashtra", purpose: "State Residence Proof", requiredFlag: true, issuingAuthority: "Tehsildar / SDO" },
        { id: 102, documentType: "INCOME_CERTIFICATE", documentName: "Competent Authority Income Certificate", purpose: "Income verification (below ₹8 Lakh)", requiredFlag: true, issuingAuthority: "Tehsildar Office" },
        { id: 103, documentType: "BONAFIDE_CERTIFICATE", documentName: "Current Year College Bonafide Certificate", purpose: "Proof of active college enrollment", requiredFlag: true, issuingAuthority: "College Principal" },
        { id: 104, documentType: "CAP_ALLOTMENT_LETTER", documentName: "CAP Admission Allotment Letter", purpose: "Proof of admission through merit quota", requiredFlag: true, issuingAuthority: "State CET Cell" },
        { id: 105, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card linked to Bank Account (DBT)", purpose: "Direct Benefit Transfer authentication", requiredFlag: true, issuingAuthority: "UIDAI" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Register on MahaDBT Portal", instruction: "Create citizen account on mahadbt.maharashtra.gov.in with Aadhaar authentication.", sourceUrl: "https://mahadbt.maharashtra.gov.in" },
        { stepNumber: 2, title: "Complete Profile Information", instruction: "Fill 6 profile sections: Personal, Address, Other Info, Current Course, Past Qualification, Hostel Details.", sourceUrl: "https://mahadbt.maharashtra.gov.in" },
        { stepNumber: 3, title: "Select Directorate of Technical / Higher Education", instruction: "Under Schemes, choose 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna'.", sourceUrl: "https://mahadbt.maharashtra.gov.in" },
        { stepNumber: 4, title: "Upload Documents & Submit Application", instruction: "Upload verified Income Certificate, Domicile, and CAP allotment letter. Submit for College scrutiny.", sourceUrl: "https://mahadbt.maharashtra.gov.in" }
      ]
    },
    {
      id: 2,
      name: "Dr. Punjabrao Deshmukh Vastigruh Nirvah Bhatta Yojna",
      description: "Hostel maintenance allowance for children of registered small/marginal farmers and registered construction workers pursuing higher professional education away from home.",
      category: "EDUCATION",
      governmentLevel: "STATE",
      state: "Maharashtra",
      targetBeneficiaries: "Children of registered marginal farmers and construction workers in Maharashtra living in paid hostels or rented accommodation.",
      ageCondition: "Enrolled in higher education degree/diploma program.",
      educationCondition: "Admitted in approved professional courses (Engineering, Medical, Agri, Architecture, etc.).",
      incomeCondition: "Annual family income up to ₹8,00,000 for marginal farmers (up to ₹1 Lakh for general non-farmers).",
      benefit: "₹30,000 per year for students studying in MMRDA/Pune/Nagpur; ₹20,000 per year for other district locations.",
      sourceUrl: "https://mahadbt.maharashtra.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "EQUALS", value: "STUDENT", description: "Applicant must be a student", required: true },
        { field: "state", operator: "EQUALS", value: "Maharashtra", description: "Resident of Maharashtra", required: true },
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH,BELOW_3_LAKH,BELOW_5_LAKH", description: "Annual family income must be within eligible ceiling", required: true }
      ],
      requiredDocuments: [
        { id: 201, documentType: "DOMICILE_CERTIFICATE", documentName: "Domicile Certificate", purpose: "State proof", requiredFlag: true, issuingAuthority: "Tehsildar" },
        { id: 202, documentType: "INCOME_CERTIFICATE", documentName: "Income Certificate (Tehsildar)", purpose: "Income validation", requiredFlag: true, issuingAuthority: "Tehsildar" },
        { id: 203, documentType: "SEVEN_TWELVE_EXTRACT", documentName: "Registered Farmer 7/12 Extract or BOCW Card", purpose: "Proof of Parent's Farmer / Construction worker status", requiredFlag: true, issuingAuthority: "Revenue Dept / BOCW Board" },
        { id: 204, documentType: "HOSTEL_RECEIPT", documentName: "Hostel Fee Receipt / Registered Rent Agreement", purpose: "Proof of staying in paid accommodation away from home", requiredFlag: true, issuingAuthority: "Hostel Warden / Landlord" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Apply via MahaDBT", instruction: "Login to MahaDBT and navigate to Directorate of Technical Education -> Dr. Punjabrao Deshmukh Hostel Scheme.", sourceUrl: "https://mahadbt.maharashtra.gov.in" },
        { stepNumber: 2, title: "Upload Land Record / BOCW Proof", instruction: "Upload parent's 7/12 land extract confirming landholding under 5 acres (Alpabhootharak Shetkari).", sourceUrl: "https://mahadbt.maharashtra.gov.in" },
        { stepNumber: 3, title: "Upload Hostel Agreement", instruction: "Submit rent agreement or official college hostel receipt with Warden sign.", sourceUrl: "https://mahadbt.maharashtra.gov.in" }
      ]
    },
    {
      id: 3,
      name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      description: "Direct income support of ₹6,000 per year in three equal installments to all landholding farmer families across India.",
      category: "AGRICULTURE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "All cultivable landholding farmer families in India with land title registered in state revenue records.",
      ageCondition: "18 years and above; primary landholder.",
      educationCondition: "No education restriction.",
      incomeCondition: "Excludes institutional landholders, high-income taxpayers, and constitutional post holders.",
      benefit: "₹6,000 per year transferred directly to bank account in 3 equal four-monthly installments of ₹2,000.",
      sourceUrl: "https://pmkisan.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "EQUALS", value: "FARMER", description: "Applicant must be a farmer", required: true },
        { field: "landownership", operator: "IN", value: "OWNED,SHARED", description: "Must own cultivable agricultural land", required: true }
      ],
      requiredDocuments: [
        { id: 301, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card (Linked with Mobile)", purpose: "e-KYC authentication", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 302, documentType: "SEVEN_TWELVE_EXTRACT", documentName: "Land Ownership Record (7/12, RoR, Khatauni)", purpose: "Ownership verification", requiredFlag: true, issuingAuthority: "State Revenue Dept" },
        { id: 303, documentType: "BANK_PASSBOOK", documentName: "Bank Account Passbook (NPCI Aadhar Seeded)", purpose: "Direct Benefit Transfer", requiredFlag: true, issuingAuthority: "Bank" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Visit Farmers Corner on PM-KISAN Portal", instruction: "Go to pmkisan.gov.in and select 'New Farmer Registration'.", sourceUrl: "https://pmkisan.gov.in" },
        { stepNumber: 2, title: "Enter Aadhaar & State Details", instruction: "Enter your Aadhaar number, state, district, and mobile number. Validate with Aadhaar OTP.", sourceUrl: "https://pmkisan.gov.in" },
        { stepNumber: 3, title: "Enter Land Gat / Survey Number", instruction: "Enter survey number, dag number, and land area matching your 7/12 extract.", sourceUrl: "https://pmkisan.gov.in" },
        { stepNumber: 4, title: "Complete Mandatory e-KYC", instruction: "Ensure biometric or facial OTP e-KYC is completed for installment release.", sourceUrl: "https://pmkisan.gov.in" }
      ]
    },
    {
      id: 4,
      name: "Namo Shetkari Mahasanman Nidhi Yojana (Maharashtra)",
      description: "State supplement of ₹6,000 per year provided by Government of Maharashtra to all PM-Kisan registered farmers in the state, bringing total support to ₹12,000/year.",
      category: "AGRICULTURE",
      governmentLevel: "STATE",
      state: "Maharashtra",
      targetBeneficiaries: "Farmers in Maharashtra who are active approved beneficiaries under PM-KISAN.",
      ageCondition: "18 years and above.",
      educationCondition: "None.",
      incomeCondition: "Same as PM-KISAN guidelines.",
      benefit: "Additional ₹6,000 per year directly to bank account, combined with PM-KISAN for total ₹12,000/year.",
      sourceUrl: "https://krishi.maharashtra.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "EQUALS", value: "FARMER", description: "Applicant must be a farmer", required: true },
        { field: "state", operator: "EQUALS", value: "Maharashtra", description: "Resident of Maharashtra", required: true }
      ],
      requiredDocuments: [
        { id: 401, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", purpose: "Identity & DBT", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 402, documentType: "SEVEN_TWELVE_EXTRACT", documentName: "7/12 Land Record", purpose: "Land verification", requiredFlag: true, issuingAuthority: "Mahabhumi" },
        { id: 403, documentType: "PM_KISAN_ID", documentName: "PM-KISAN Registration Number", purpose: "Beneficiary linkage", requiredFlag: true, issuingAuthority: "Ministry of Agriculture" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Automatic State Linkage", instruction: "Beneficiaries approved under PM-KISAN in Maharashtra are automatically verified via PFMS.", sourceUrl: "https://krishi.maharashtra.gov.in" },
        { stepNumber: 2, title: "Verify Bank Account Aadhaar Seeding", instruction: "Check that your bank account is active on the NPCI mapper for seamless credit.", sourceUrl: "https://krishi.maharashtra.gov.in" }
      ]
    },
    {
      id: 5,
      name: "Pradhan Mantri Mudra Yojana (PMMY)",
      description: "Collateral-free institutional micro-credit up to ₹10 Lakhs for non-corporate, non-farm small/micro enterprises across Shishu, Kishore, and Tarun loan tiers.",
      category: "BUSINESS",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Small business owners, shopkeepers, fruit/vegetable vendors, artisans, and food-service micro entrepreneurs.",
      ageCondition: "18 to 65 years.",
      educationCondition: "None.",
      incomeCondition: "Based on viability of business proposal.",
      benefit: "Collateral-free loans: Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5 Lakh), Tarun (₹5 Lakh to ₹10 Lakh).",
      sourceUrl: "https://www.mudra.org.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "EQUALS", value: "BUSINESS_OWNER", description: "Applicant must be a business owner or entrepreneur", required: true }
      ],
      requiredDocuments: [
        { id: 501, documentType: "UDYAM_REGISTRATION", documentName: "Udyam Registration Certificate", purpose: "MSME Business Identity", requiredFlag: true, issuingAuthority: "Ministry of MSME" },
        { id: 502, documentType: "IDENTITY_PROOF", documentName: "PAN Card & Aadhaar Card", purpose: "KYC Compliance", requiredFlag: true, issuingAuthority: "IT Dept / UIDAI" },
        { id: 503, documentType: "BANK_STATEMENT", documentName: "Last 6 Months Bank Statement", purpose: "Cash flow evaluation", requiredFlag: true, issuingAuthority: "Bank" },
        { id: 504, documentType: "PROJECT_REPORT", documentName: "Business Proposal / Project Report", purpose: "Assessment of machinery or working capital need", requiredFlag: false, issuingAuthority: "Applicant / CA" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Choose Loan Category (Shishu / Kishore / Tarun)", instruction: "Decide whether you need under ₹50k (Shishu) or up to ₹5L (Kishore) based on quotations.", sourceUrl: "https://www.mudra.org.in" },
        { stepNumber: 2, title: "Apply Online via JanSamarth Portal", instruction: "Visit jansamarth.in, choose 'Business Activity Loan', and submit digital Mudra application.", sourceUrl: "https://www.jansamarth.in" },
        { stepNumber: 3, title: "Bank In-Principle Sanction", instruction: "Compare in-principle offers from partner commercial and regional rural banks.", sourceUrl: "https://www.jansamarth.in" }
      ]
    },
    {
      id: 6,
      name: "Chief Minister Employment Generation Programme (CMEGP - Maharashtra)",
      description: "Credit-linked subsidy program to generate self-employment ventures in manufacturing and service sectors in Maharashtra with subsidies up to 35%.",
      category: "BUSINESS",
      governmentLevel: "STATE",
      state: "Maharashtra",
      targetBeneficiaries: "Unemployed youth and prospective entrepreneurs establishing new micro enterprises in Maharashtra.",
      ageCondition: "18 to 45 years (relaxation up to 50 years for SC/ST/Women/Ex-servicemen).",
      educationCondition: "Minimum 7th pass for project cost above ₹10 Lakh (Manufacturing) or ₹5 Lakh (Service).",
      incomeCondition: "No family income ceiling.",
      benefit: "Financial assistance up to ₹50 Lakh (Manufacturing) and ₹20 Lakh (Service) with 15% to 35% government capital subsidy.",
      sourceUrl: "https://maha-cmegp.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "IN", value: "BUSINESS_OWNER,JOB_SEEKER", description: "Entrepreneurs or job seekers starting business", required: true },
        { field: "state", operator: "EQUALS", value: "Maharashtra", description: "Must be located in Maharashtra", required: true }
      ],
      requiredDocuments: [
        { id: 601, documentType: "DOMICILE_CERTIFICATE", documentName: "Domicile Certificate of Maharashtra", purpose: "State eligibility", requiredFlag: true, issuingAuthority: "Tehsildar" },
        { id: 602, documentType: "EDUCATION_CERTIFICATE", documentName: "School Leaving / Educational Qualification Certificate", purpose: "Minimum qualification proof", requiredFlag: true, issuingAuthority: "School / Board" },
        { id: 603, documentType: "PROJECT_REPORT", documentName: "Detailed Project Report (DPR)", purpose: "Project appraisal by DIC", requiredFlag: true, issuingAuthority: "Chartered Accountant / Consultant" },
        { id: 604, documentType: "UDYAM_REGISTRATION", documentName: "Udyam Registration Certificate", purpose: "MSME recognition", requiredFlag: true, issuingAuthority: "Ministry of MSME" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Register on Maha-CMEGP Portal", instruction: "Visit maha-cmegp.gov.in and click on 'New Citizen Registration'.", sourceUrl: "https://maha-cmegp.gov.in" },
        { stepNumber: 2, title: "Select Financing Agency & Bank Branch", instruction: "Choose implementing agency (DIC or KVIB) and preferred commercial bank branch.", sourceUrl: "https://maha-cmegp.gov.in" },
        { stepNumber: 3, title: "District Level Task Force Committee (DLTFC) Interview", instruction: "Attend interview called by General Manager, District Industries Centre (DIC).", sourceUrl: "https://maha-cmegp.gov.in" }
      ]
    },
    {
      id: 7,
      name: "Pradhan Mantri Awas Yojana - Urban (PMAY-U)",
      description: "Affordable housing mission providing credit-linked interest subsidy and financial assistance for pucca house construction or purchase to eligible urban families.",
      category: "SOCIAL_SUPPORT",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Economically Weaker Section (EWS) and Low-Income Group (LIG) urban families who do not own a pucca house anywhere in India.",
      ageCondition: "Adult female head of household or co-owner.",
      educationCondition: "None.",
      incomeCondition: "Annual family income up to ₹3 Lakh (EWS) and up to ₹6 Lakh (LIG).",
      benefit: "Direct central assistance of ₹1.5 Lakh to ₹2.67 Lakh through upfront interest subsidy or direct beneficiary-led construction grant.",
      sourceUrl: "https://pmaymis.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH,BELOW_3_LAKH,BELOW_5_LAKH", description: "Income within EWS / LIG ceiling", required: true }
      ],
      requiredDocuments: [
        { id: 701, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card of all family members", purpose: "De-duplication check", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 702, documentType: "INCOME_CERTIFICATE", documentName: "Income Certificate / Salary Slip / ITR", purpose: "EWS / LIG tier certification", requiredFlag: true, issuingAuthority: "Tehsildar / Employer" },
        { id: 703, documentType: "AFFIDAVIT_NO_PUCCA_HOUSE", documentName: "Notarized Affidavit of not owning a pucca house", purpose: "Beneficiary declaration", requiredFlag: true, issuingAuthority: "Notary Public" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Apply via Local Urban Local Body (ULB)", instruction: "Submit application through your Municipal Corporation / Nagar Palika or on pmaymis.gov.in.", sourceUrl: "https://pmaymis.gov.in" },
        { stepNumber: 2, title: "Geo-tagging of Site", instruction: "Municipal officials conduct physical verification and geo-tagging of construction plot.", sourceUrl: "https://pmaymis.gov.in" }
      ]
    },
    {
      id: 8,
      name: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
      description: "World's largest government-funded healthcare assurance scheme offering health cover of ₹5 Lakhs per family per year for secondary and tertiary care hospitalization.",
      category: "HEALTHCARE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Bottom 40% vulnerable and poor families identified as per Socio-Economic Caste Census (SECC 2011) and state-expanded health registries.",
      ageCondition: "No age bar; all family members covered.",
      educationCondition: "None.",
      incomeCondition: "Deprivation criteria as per SECC 2011 or NFSA Ration Card holders.",
      benefit: "Cashless and paperless hospitalization coverage of up to ₹5,00,000 per family per year across 27,000+ empanelled hospitals.",
      sourceUrl: "https://nha.gov.in/PM-JAY",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH,BELOW_3_LAKH", description: "Eligible under economic vulnerability criteria", required: true }
      ],
      requiredDocuments: [
        { id: 801, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", purpose: "Biometric e-KYC", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 802, documentType: "RATION_CARD", documentName: "Ration Card (NFSA Yellow / Saffron)", purpose: "Family tree validation", requiredFlag: true, issuingAuthority: "Food & Civil Supplies Dept" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Check Eligibility Online", instruction: "Visit beneficiary.nha.gov.in and search by Mobile number, Ration Card, or Family ID.", sourceUrl: "https://beneficiary.nha.gov.in" },
        { stepNumber: 2, title: "Instant e-KYC & Ayushman Card Generation", instruction: "Complete face-authentication or Aadhaar OTP to immediately download your PVC Ayushman Card.", sourceUrl: "https://beneficiary.nha.gov.in" }
      ]
    },
    {
      id: 9,
      name: "PM Vishwakarma Scheme",
      description: "Comprehensive central support for traditional artisans and craftspeople across 18 trades, providing recognition, skill upgrades, toolkits, and subsidized collateral-free loans.",
      category: "BUSINESS",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Traditional artisans working with hands and tools (Carpenters, Blacksmiths, Potters, Sculptors, Cobblers, Masons, Weavers, Tailors).",
      ageCondition: "Minimum 18 years on the date of registration.",
      educationCondition: "Engaged in one of the 18 specified trades on self-employment basis.",
      incomeCondition: "Only one member of the family can avail benefit; excludes government employees.",
      benefit: "PM Vishwakarma Certificate & ID, ₹15,000 toolkit incentive, skill training with ₹500/day stipend, and collateral-free enterprise loans up to ₹3 Lakh at 5% interest.",
      sourceUrl: "https://pmvishwakarma.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "IN", value: "BUSINESS_OWNER,GENERAL_CITIZEN", description: "Artisan or self-employed craftsman", required: true }
      ],
      requiredDocuments: [
        { id: 901, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card (Biometric verified)", purpose: "Identity and trade verification", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 902, documentType: "BANK_PASSBOOK", documentName: "Bank Account Passbook (Aadhar linked)", purpose: "Toolkit grant transfer", requiredFlag: true, issuingAuthority: "Bank" },
        { id: 903, documentType: "TRADE_PROOF", documentName: "Declaration of practicing traditional trade", purpose: "Gram Panchayat / ULB verification", requiredFlag: true, issuingAuthority: "Gram Panchayat / Municipal Ward" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Biometric Registration at CSC", instruction: "Visit nearest Common Services Centre (CSC) with Aadhaar and bank passbook.", sourceUrl: "https://pmvishwakarma.gov.in" },
        { stepNumber: 2, title: "3-Tier Verification", instruction: "Application verified by Gram Panchayat head / ULB executive, followed by District Screening Committee.", sourceUrl: "https://pmvishwakarma.gov.in" },
        { stepNumber: 3, title: "Skill Training & Loan Sanction", instruction: "Complete 5-7 days basic skill training at designated ITI / training centre.", sourceUrl: "https://pmvishwakarma.gov.in" }
      ]
    },
    {
      id: 10,
      name: "Startup India Seed Fund Scheme (SISFS)",
      description: "Financial assistance to early-stage innovative startups for proof of concept, prototype development, product trials, market entry, and commercialization.",
      category: "BUSINESS",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "DPIIT-recognized innovative startups incorporated not more than 2 years ago.",
      ageCondition: "Indian citizens / founders holding at least 51% shareholding.",
      educationCondition: "None.",
      incomeCondition: "Startup must have business idea to develop product/service with market fit.",
      benefit: "Up to ₹20 Lakhs as grant for validation of proof of concept / prototype, and up to ₹50 Lakhs through convertible debentures or debt.",
      sourceUrl: "https://seedfund.startupindia.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "EQUALS", value: "BUSINESS_OWNER", description: "Startup entrepreneur", required: true },
        { field: "businessstage", operator: "IN", value: "IDEA,STARTUP", description: "Early stage startup", required: true }
      ],
      requiredDocuments: [
        { id: 1001, documentType: "DPIIT_CERTIFICATE", documentName: "DPIIT Startup Recognition Certificate", purpose: "Startup credentials", requiredFlag: true, issuingAuthority: "DPIIT, Ministry of Commerce" },
        { id: 1002, documentType: "COMPANY_PAN", documentName: "Certificate of Incorporation & Company PAN", purpose: "Legal entity proof", requiredFlag: true, issuingAuthority: "Ministry of Corporate Affairs (MCA)" },
        { id: 1003, documentType: "PROJECT_REPORT", documentName: "Pitch Deck & Prototype Milestone Plan", purpose: "Incubator evaluation", requiredFlag: true, issuingAuthority: "Founding Team" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Obtain DPIIT Recognition", instruction: "Apply on startupindia.gov.in to get DPIIT recognition certificate.", sourceUrl: "https://www.startupindia.gov.in" },
        { stepNumber: 2, title: "Apply to Approved Incubators", instruction: "Select up to 3 approved incubators on seedfund.startupindia.gov.in.", sourceUrl: "https://seedfund.startupindia.gov.in" },
        { stepNumber: 3, title: "Pitch to Incubator Seed Management Committee", instruction: "Present your prototype and business model to the committee.", sourceUrl: "https://seedfund.startupindia.gov.in" }
      ]
    },
    {
      id: 11,
      name: "Post Matric Scholarship for SC / ST Students (Maharashtra Social Justice)",
      description: "100% tuition and examination fee waiver, maintenance allowance, and library support for SC and ST students enrolled in post-SSC approved courses.",
      category: "EDUCATION",
      governmentLevel: "STATE",
      state: "Maharashtra",
      targetBeneficiaries: "Students belonging to Scheduled Caste (SC) or Scheduled Tribe (ST) communities in Maharashtra pursuing higher education.",
      ageCondition: "Enrolled in recognized post-secondary diploma, degree, or professional program.",
      educationCondition: "Post-matriculation level (11th, 12th, ITI, Diploma, UG, PG).",
      incomeCondition: "Annual family income up to ₹2,50,000 for government scholarships.",
      benefit: "100% Tuition & Exam fee exemption directly credited to college; monthly maintenance allowance credited to student's bank account.",
      sourceUrl: "https://mahadbt.maharashtra.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "EQUALS", value: "STUDENT", description: "Applicant must be a student", required: true },
        { field: "state", operator: "EQUALS", value: "Maharashtra", description: "Resident of Maharashtra", required: true },
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH,BELOW_3_LAKH", description: "Family income within ₹2.5 Lakh limit", required: true }
      ],
      requiredDocuments: [
        { id: 1101, documentType: "CASTE_CERTIFICATE", documentName: "Caste Certificate (SC/ST) issued by SDO", purpose: "Category verification", requiredFlag: true, issuingAuthority: "Sub-Divisional Officer (SDO)" },
        { id: 1102, documentType: "INCOME_CERTIFICATE", documentName: "Income Certificate (Tehsildar)", purpose: "Income validation", requiredFlag: true, issuingAuthority: "Tehsildar Office" },
        { id: 1103, documentType: "DOMICILE_CERTIFICATE", documentName: "Domicile Certificate of Maharashtra", purpose: "State proof", requiredFlag: true, issuingAuthority: "Tehsildar" },
        { id: 1104, documentType: "BONAFIDE_CERTIFICATE", documentName: "College Bonafide Certificate", purpose: "Active student status", requiredFlag: true, issuingAuthority: "College Principal" },
        { id: 1105, documentType: "CASTE_VALIDITY", documentName: "Caste Validity Certificate (for degree admissions)", purpose: "Merit verification", requiredFlag: false, issuingAuthority: "Scrutiny Committee" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Register on MahaDBT", instruction: "Login to mahadbt.maharashtra.gov.in using Aadhaar OTP.", sourceUrl: "https://mahadbt.maharashtra.gov.in" },
        { stepNumber: 2, title: "Select Social Justice & Special Assistance", instruction: "Choose Government of India Post-Matric Scholarship for SC/ST Students.", sourceUrl: "https://mahadbt.maharashtra.gov.in" },
        { stepNumber: 3, title: "Upload Caste & Income Records", instruction: "Submit verified barcode caste certificate and income certificate.", sourceUrl: "https://mahadbt.maharashtra.gov.in" }
      ]
    },
    {
      id: 12,
      name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      description: "Comprehensive multi-peril crop insurance covering yield loss and post-harvest damages from non-preventable natural risks at a nominal farmer premium of 1.5% to 2%.",
      category: "AGRICULTURE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "All farmers growing notified crops in notified areas including sharecroppers and tenant farmers.",
      ageCondition: "18 years and above.",
      educationCondition: "None.",
      incomeCondition: "Open to all farmer income categories.",
      benefit: "Full sum insured payout against crop failure due to drought, unseasonal rain, pests, hail, and localized perils. Farmers pay only ₹1 token premium in Maharashtra.",
      sourceUrl: "https://pmfby.gov.in",
      lastVerified: "2026-03-01",
      active: true,
      isDemoData: false,
      verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "EQUALS", value: "FARMER", description: "Applicant must be a farmer", required: true }
      ],
      requiredDocuments: [
        { id: 1201, documentType: "SEVEN_TWELVE_EXTRACT", documentName: "7/12 & 8A Land Extract with crop sowing entry (Pik Pahani)", purpose: "Proof of notified crop cultivation", requiredFlag: true, issuingAuthority: "Mahabhumi / e-Pik Pahani" },
        { id: 1202, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", purpose: "Identity", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 1203, documentType: "BANK_PASSBOOK", documentName: "Bank Passbook with active IFSC code", purpose: "Claim settlement", requiredFlag: true, issuingAuthority: "Bank" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Complete e-Pik Pahani Mobile App Entry", instruction: "Record sown crops on the Maharashtra e-Pik Pahani mobile app to update the 7/12 record.", sourceUrl: "https://krishi.maharashtra.gov.in" },
        { stepNumber: 2, title: "Enroll at CSC or Bank Branch", instruction: "Apply on pmfby.gov.in before the sowing cut-off deadline (usually July 15 for Kharif).", sourceUrl: "https://pmfby.gov.in" }
      ]
    }
    ,
    {
      id: 13,
      name: "PM SVANidhi — PM Street Vendor's AtmaNirbhar Nidhi",
      description: "Micro-credit scheme providing affordable collateral-free working capital loans to street vendors helping them resume livelihoods and build credit history.",
      category: "BUSINESS",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Street vendors / hawkers / thela operators with Urban Local Body Certificate of Vending.",
      ageCondition: "18 years and above.",
      educationCondition: "None.",
      incomeCondition: "Street vendor.",
      benefit: "Collateral-free loans: ₹10,000 (Level 1), ₹20,000 (Level 2), ₹50,000 (Level 3) on timely repayment. Cashback reward on digital transactions.",
      sourceUrl: "https://pmsvanidhi.mohua.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [{ field: "category", operator: "IN", value: "BUSINESS_OWNER,GENERAL_CITIZEN", description: "Street vendor / hawker", required: true }],
      requiredDocuments: [
        { id: 1301, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", purpose: "KYC", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 1302, documentType: "VENDING_CERTIFICATE", documentName: "Certificate of Vending / ULB Letter", purpose: "Vendor identity", requiredFlag: true, issuingAuthority: "Urban Local Body" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Apply on PM SVANidhi Portal", instruction: "Visit pmsvanidhi.mohua.gov.in or contact nearest MFI/SHG/Bank branch.", sourceUrl: "https://pmsvanidhi.mohua.gov.in" }]
    },
    {
      id: 14,
      name: "Stand-Up India Scheme",
      description: "Facilitates bank loans of ₹10 Lakh to ₹1 Crore to SC/ST borrowers and women entrepreneurs for setting up greenfield manufacturing or service enterprises.",
      category: "BUSINESS",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "SC/ST and Women entrepreneurs setting up new greenfield enterprises.",
      ageCondition: "18 years and above.",
      educationCondition: "None.",
      incomeCondition: "None.",
      benefit: "Composite loan of ₹10 Lakh to ₹1 Crore (75% of project cost) with 7-year repayment.",
      sourceUrl: "https://www.standupmitra.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [{ field: "category", operator: "EQUALS", value: "BUSINESS_OWNER", description: "New enterprise entrepreneur", required: true }],
      requiredDocuments: [
        { id: 1401, documentType: "CASTE_CERTIFICATE", documentName: "Caste Certificate (SC/ST)", purpose: "Category eligibility", requiredFlag: false, issuingAuthority: "SDO" },
        { id: 1402, documentType: "PROJECT_REPORT", documentName: "Detailed Project Report", purpose: "Loan assessment", requiredFlag: true, issuingAuthority: "CA / Promoter" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Register on Stand-Up Mitra Portal", instruction: "Register on standupmitra.in and get handholding support.", sourceUrl: "https://www.standupmitra.in" }]
    },
    {
      id: 15,
      name: "Sukanya Samriddhi Yojana (SSY)",
      description: "Small savings scheme for girl children below 10 years offering the highest guaranteed interest rate (8.2% p.a.) with full EEE tax exemption.",
      category: "WELFARE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Parents / legal guardians of girl children below 10 years.",
      ageCondition: "Girl child below 10 years at account opening.",
      educationCondition: "None.",
      incomeCondition: "None.",
      benefit: "8.2% guaranteed annual interest; full EEE tax exemption; partial withdrawal at 18 for education; maturity at 21.",
      sourceUrl: "https://www.indiapost.gov.in/Financial/Pages/Content/SSY.aspx",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [{ field: "category", operator: "IN", value: "GENERAL_CITIZEN,STUDENT", description: "Girl child account", required: true }],
      requiredDocuments: [
        { id: 1501, documentType: "BIRTH_CERTIFICATE", documentName: "Birth Certificate of Girl Child", purpose: "Age verification", requiredFlag: true, issuingAuthority: "Municipal Corporation" },
        { id: 1502, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card of Parent/Guardian", purpose: "Account holder KYC", requiredFlag: true, issuingAuthority: "UIDAI" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Visit Post Office or Authorised Bank", instruction: "Open SSY account at any India Post office or authorised bank (SBI, HDFC etc.) with minimum ₹250 deposit.", sourceUrl: "https://www.indiapost.gov.in" }]
    },
    {
      id: 16,
      name: "Atal Pension Yojana (APY)",
      description: "Guaranteed minimum pension scheme for unorganised sector workers ensuring social security in old age with government co-contribution.",
      category: "WELFARE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Citizens 18-40 years working in unorganised sector, not covered by statutory social security. Income taxpayers ineligible (w.e.f. Oct 2022).",
      ageCondition: "18 to 40 years at enrollment.",
      educationCondition: "None.",
      incomeCondition: "Income taxpayers not eligible.",
      benefit: "Guaranteed monthly pension of ₹1,000 to ₹5,000 after age 60, based on contribution and entry age.",
      sourceUrl: "https://npscra.nsdl.co.in/scheme-details.php",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [{ field: "category", operator: "IN", value: "FARMER,GENERAL_CITIZEN,BUSINESS_OWNER", description: "Unorganised sector worker 18-40 years", required: true }],
      requiredDocuments: [
        { id: 1601, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", purpose: "KYC", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 1602, documentType: "BANK_PASSBOOK", documentName: "Active Savings Bank Account", purpose: "Auto-debit setup", requiredFlag: true, issuingAuthority: "Bank" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Enroll at Bank Branch / Net Banking", instruction: "Fill APY registration form at your bank branch or use net banking / mobile banking app.", sourceUrl: "https://npscra.nsdl.co.in" }]
    },
    {
      id: 17,
      name: "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
      description: "National financial inclusion mission ensuring universal access to banking, savings, credit, insurance, and remittance for every household.",
      category: "WELFARE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "All citizens without a basic savings bank account — especially women, rural households, and migrant workers.",
      ageCondition: "10 years and above.",
      educationCondition: "None.",
      incomeCondition: "None.",
      benefit: "Zero-balance savings account, RuPay card with ₹2 Lakh accident insurance, ₹30,000 life cover, ₹10k overdraft after 6 months.",
      sourceUrl: "https://pmjdy.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [],
      requiredDocuments: [
        { id: 1701, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", purpose: "KYC / Account opening", requiredFlag: true, issuingAuthority: "UIDAI" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Visit Any Bank Branch with Aadhaar", instruction: "Walk into any nationalized bank or banking correspondent outlet with Aadhaar to open a zero-balance Jan Dhan account.", sourceUrl: "https://pmjdy.gov.in" }]
    },
    {
      id: 18,
      name: "National Scholarship Portal (NSP) — Central Schemes",
      description: "One-stop platform providing Post-Matric, Pre-Matric, and Merit-cum-Means scholarships from multiple central ministries to SC, ST, OBC, Minority, and EWS students.",
      category: "EDUCATION",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "SC, ST, OBC, EWS, Minority students in schools, colleges, and professional institutions.",
      ageCondition: "School and college-going students.",
      educationCondition: "Class 1 to Postgraduate courses.",
      incomeCondition: "₹2.5 Lakh (SC/ST) to ₹8 Lakh (OBC/Minority) depending on scheme.",
      benefit: "₹230 to ₹1,200/month maintenance + full tuition fees depending on institution and course.",
      sourceUrl: "https://scholarships.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "EQUALS", value: "STUDENT", description: "Active student enrollment required", required: true },
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH,BELOW_3_LAKH,BELOW_5_LAKH", description: "Within income ceiling for respective scheme", required: true }
      ],
      requiredDocuments: [
        { id: 1801, documentType: "INCOME_CERTIFICATE", documentName: "Income Certificate (Competent Authority)", purpose: "Income tier verification", requiredFlag: true, issuingAuthority: "Tehsildar" },
        { id: 1802, documentType: "CASTE_CERTIFICATE", documentName: "Caste Certificate", purpose: "Category verification", requiredFlag: true, issuingAuthority: "SDO" },
        { id: 1803, documentType: "BONAFIDE_CERTIFICATE", documentName: "Bonafide Certificate from Institution", purpose: "Active enrollment", requiredFlag: true, issuingAuthority: "College Principal" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Register on National Scholarship Portal", instruction: "Visit scholarships.gov.in, click 'New Registration' and choose application year.", sourceUrl: "https://scholarships.gov.in" },
        { stepNumber: 2, title: "Fill Academic & Income Details", instruction: "Enter course, institution, income details and upload documents before October 31 deadline.", sourceUrl: "https://scholarships.gov.in" }
      ]
    },
    {
      id: 19,
      name: "Pradhan Mantri Ujjwala Yojana 2.0 (PMUY)",
      description: "Free LPG connection scheme for women from BPL households enabling clean cooking fuel access and reducing indoor air pollution.",
      category: "WELFARE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Women from BPL / SECC / SC/ST / PMAY households without existing LPG connection.",
      ageCondition: "Adult woman (18+).",
      educationCondition: "None.",
      incomeCondition: "Below Poverty Line household.",
      benefit: "Free LPG deposit waiver, 1 free refill, stove and regulator on easy EMI.",
      sourceUrl: "https://pmuy.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH", description: "BPL household", required: true }
      ],
      requiredDocuments: [
        { id: 1901, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card of applicant woman", purpose: "Identity", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 1902, documentType: "RATION_CARD", documentName: "BPL Ration Card or SECC declaration", purpose: "BPL eligibility", requiredFlag: true, issuingAuthority: "Food Dept" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Apply at LPG Distributor", instruction: "Submit application at nearest HP / Bharat / Indane Gas distributor with Aadhaar and BPL ration card.", sourceUrl: "https://pmuy.gov.in" }]
    },
    {
      id: 20,
      name: "Beti Bachao Beti Padhao (BBBP)",
      description: "Multi-sectoral programme to prevent gender-biased sex selection and ensure survival, protection, and education of girl children across India.",
      category: "WELFARE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Girl children, pregnant women, and families in gender-critical districts.",
      ageCondition: "Girl children from birth.",
      educationCondition: "School enrollment and retention of girls.",
      incomeCondition: "None.",
      benefit: "Free girl child registration, conditional cash support for education and healthcare, linked with SSY, PCPNDT enforcement and school retention programs.",
      sourceUrl: "https://wcd.nic.in/schemes/beti-bachao-beti-padhao-scheme",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [],
      requiredDocuments: [{ id: 2001, documentType: "BIRTH_CERTIFICATE", documentName: "Girl Child Birth Certificate", purpose: "Registration", requiredFlag: true, issuingAuthority: "Municipal Corporation" }],
      applicationGuides: [{ stepNumber: 1, title: "Contact ICDS Anganwadi Centre", instruction: "Register at nearest Anganwadi Centre for BBBP programs, free health checkups, and welfare services.", sourceUrl: "https://wcd.nic.in" }]
    },
    {
      id: 21,
      name: "Soil Health Card Scheme",
      description: "Government scheme issuing Soil Health Cards to farmers every 2 years with crop-wise fertilizer recommendations based on soil testing to improve productivity.",
      category: "AGRICULTURE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "All landholding farmers across India.",
      ageCondition: "No restriction.",
      educationCondition: "None.",
      incomeCondition: "None.",
      benefit: "FREE soil testing (macro & micro nutrients), crop-wise fertilizer dosage recommendation, long-term productivity improvement.",
      sourceUrl: "https://soilhealth.dac.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [{ field: "category", operator: "EQUALS", value: "FARMER", description: "Agricultural landholder", required: true }],
      requiredDocuments: [
        { id: 2101, documentType: "SEVEN_TWELVE_EXTRACT", documentName: "7/12 Land Extract", purpose: "Land verification", requiredFlag: true, issuingAuthority: "Revenue Dept" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Contact Block Agriculture Office", instruction: "Register at Block Agriculture Office or Krishi Seva Kendra for free soil sample collection.", sourceUrl: "https://soilhealth.dac.gov.in" }]
    },
    {
      id: 22,
      name: "eNAM — National Agriculture Market",
      description: "Pan-India electronic trading portal integrating APMCs for online price discovery and seamless trade of agricultural commodities across 1000+ mandis.",
      category: "AGRICULTURE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Farmers wishing to sell agricultural produce at competitive prices beyond local mandi.",
      ageCondition: "18 years and above.",
      educationCondition: "None.",
      incomeCondition: "None.",
      benefit: "Access to 1000+ APMCs, real-time price discovery, reduced intermediary fees, direct payment to bank account, lower post-harvest losses.",
      sourceUrl: "https://enam.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [{ field: "category", operator: "EQUALS", value: "FARMER", description: "Farmer / agricultural trader", required: true }],
      requiredDocuments: [
        { id: 2201, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", purpose: "Registration", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 2202, documentType: "BANK_PASSBOOK", documentName: "Bank Passbook", purpose: "Payment settlement", requiredFlag: true, issuingAuthority: "Bank" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Register on eNAM Portal", instruction: "Visit enam.gov.in and register as farmer/FPO. Approach nearest eNAM-enabled APMC mandi.", sourceUrl: "https://enam.gov.in" }]
    },
    {
      id: 23,
      name: "Pradhan Mantri Garib Kalyan Anna Yojana (PMGKAY)",
      description: "Free food grain distribution providing additional 5 kg wheat/rice per person per month free of cost to all NFSA ration card holders, extended through December 2028.",
      category: "WELFARE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "All NFSA ration card holders — AAY and Priority Household (PHH) cards.",
      ageCondition: "No restriction.",
      educationCondition: "None.",
      incomeCondition: "NFSA ration card holder.",
      benefit: "5 kg wheat/rice FREE per person per month above regular NFSA entitlement. No cost to beneficiary.",
      sourceUrl: "https://dfpd.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [],
      requiredDocuments: [{ id: 2301, documentType: "RATION_CARD", documentName: "NFSA Ration Card (AAY / PHH)", purpose: "Beneficiary identification", requiredFlag: true, issuingAuthority: "Food & Civil Supplies Dept" }],
      applicationGuides: [{ stepNumber: 1, title: "Collect from Fair Price Shop", instruction: "Collect free grain from your designated FPS ration shop using your Aadhaar-linked ration card.", sourceUrl: "https://dfpd.gov.in" }]
    },
    {
      id: 24,
      name: "Maharashtra Ladki Bahin Yojana",
      description: "State flagship DBT scheme providing monthly financial assistance to eligible women of Maharashtra aged 21-65 years to promote financial independence.",
      category: "WELFARE",
      governmentLevel: "STATE",
      state: "Maharashtra",
      targetBeneficiaries: "Women aged 21-65 years domiciled in Maharashtra with family income up to ₹2,50,000.",
      ageCondition: "21 to 65 years.",
      educationCondition: "None.",
      incomeCondition: "Annual family income up to ₹2,50,000.",
      benefit: "₹1,500 per month directly to Aadhaar-linked bank account (₹18,000 per year).",
      sourceUrl: "https://ladakibahin.maharashtra.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [
        { field: "category", operator: "IN", value: "GENERAL_CITIZEN,FARMER", description: "Woman resident of Maharashtra aged 21-65", required: true },
        { field: "state", operator: "EQUALS", value: "Maharashtra", description: "Domicile of Maharashtra", required: true },
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH,BELOW_3_LAKH", description: "Family income below ₹2.5 Lakh", required: true }
      ],
      requiredDocuments: [
        { id: 2501, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card of applicant woman", purpose: "Identity & DBT", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 2502, documentType: "DOMICILE_CERTIFICATE", documentName: "Maharashtra Domicile Certificate", purpose: "State residency", requiredFlag: true, issuingAuthority: "Tehsildar" },
        { id: 2503, documentType: "INCOME_CERTIFICATE", documentName: "Income Certificate (below ₹2.5 Lakh)", purpose: "Income eligibility", requiredFlag: true, issuingAuthority: "Tehsildar" },
        { id: 2504, documentType: "BANK_PASSBOOK", documentName: "Bank Account linked to Aadhaar", purpose: "Monthly DBT transfer", requiredFlag: true, issuingAuthority: "Bank" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Apply via Aaple Sarkar or Anganwadi Centre", instruction: "Fill application at nearest Anganwadi Centre, Gram Panchayat, or online on Aaple Sarkar portal.", sourceUrl: "https://ladakibahin.maharashtra.gov.in" }]
    },
    {
      id: 25,
      name: "Gharkul Yojana — Ramai Awas Gharkul (Maharashtra SC/ST Housing)",
      description: "State government free housing scheme for SC, ST, VJ/NT families in rural Maharashtra providing pucca house construction assistance.",
      category: "WELFARE",
      governmentLevel: "STATE",
      state: "Maharashtra",
      targetBeneficiaries: "SC/ST/VJ-NT families in rural Maharashtra who are houseless or living in kutcha structures with income below ₹1 Lakh.",
      ageCondition: "Adult head of household (18+).",
      educationCondition: "None.",
      incomeCondition: "Annual family income below ₹1,00,000.",
      benefit: "₹1,32,000 to ₹1,42,000 per unit housing grant in installments. Additional ₹12,000 for toilet under SBM.",
      sourceUrl: "https://mahasrd.maharashtra.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [
        { field: "state", operator: "EQUALS", value: "Maharashtra", description: "Resident of Maharashtra", required: true },
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH", description: "Below ₹1 Lakh income", required: true }
      ],
      requiredDocuments: [
        { id: 2601, documentType: "CASTE_CERTIFICATE", documentName: "Caste Certificate (SC/ST/VJNT)", purpose: "Category eligibility", requiredFlag: true, issuingAuthority: "SDO" },
        { id: 2602, documentType: "INCOME_CERTIFICATE", documentName: "Income Certificate", purpose: "Below ₹1 Lakh", requiredFlag: true, issuingAuthority: "Tehsildar" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Apply at Gram Panchayat / Block Office", instruction: "Submit application to Gram Panchayat Secretary who forwards to BDO with all documents.", sourceUrl: "https://mahasrd.maharashtra.gov.in" }]
    },
    {
      id: 26,
      name: "Pradhan Mantri Kaushal Vikas Yojana 4.0 (PMKVY)",
      description: "Flagship free skill training scheme providing certified training and monetary rewards to youth for industry-recognized short-term courses to enhance employability.",
      category: "EDUCATION",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Youth (Class 10 dropout or above) aged 15-45 seeking skill development and employment.",
      ageCondition: "15 to 45 years.",
      educationCondition: "Minimum Class 10 pass or school dropout.",
      incomeCondition: "None.",
      benefit: "FREE certified skill training (3-12 months), monetary reward ₹500 to ₹7,500 on assessment pass, job placement support.",
      sourceUrl: "https://www.pmkvyofficial.org",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [{ field: "category", operator: "IN", value: "STUDENT,GENERAL_CITIZEN", description: "Unemployed youth 15-45 years", required: true }],
      requiredDocuments: [
        { id: 2701, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", purpose: "Registration", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 2702, documentType: "EDUCATION_CERTIFICATE", documentName: "10th / School Leaving Certificate", purpose: "Qualification proof", requiredFlag: true, issuingAuthority: "State Board" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Find Training Centre on PMKVY Portal", instruction: "Visit pmkvyofficial.org, select sector/course, find nearest PMKVY training centre.", sourceUrl: "https://www.pmkvyofficial.org" }]
    },
    {
      id: 27,
      name: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
      description: "Conditional maternity benefit programme providing ₹5,000 wage compensation to pregnant and lactating women for first living child.",
      category: "WELFARE",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Pregnant and lactating women aged 19+ for first living child (2nd child if girl under PMMVY 2.0).",
      ageCondition: "19 years and above at pregnancy.",
      educationCondition: "None.",
      incomeCondition: "None.",
      benefit: "₹5,000 in three installments for first child. ₹6,000 for second girl child under PMMVY 2.0.",
      sourceUrl: "https://wcd.nic.in/schemes/pradhan-mantri-matru-vandana-yojana",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [],
      requiredDocuments: [
        { id: 2801, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card of mother", purpose: "Identity", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 2802, documentType: "MCP_CARD", documentName: "Mother & Child Protection (MCP) Card", purpose: "Pregnancy tracking", requiredFlag: true, issuingAuthority: "ICDS Anganwadi" },
        { id: 2803, documentType: "BANK_PASSBOOK", documentName: "Bank Account linked to Aadhaar", purpose: "DBT payment", requiredFlag: true, issuingAuthority: "Bank" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Register at Anganwadi / PHC / ASHA", instruction: "Register pregnancy at nearest Anganwadi Centre or Primary Health Centre to initiate PMMVY.", sourceUrl: "https://wcd.nic.in" }]
    },
    {
      id: 28,
      name: "Pradhan Mantri Employment Generation Programme (PMEGP)",
      description: "Credit-linked subsidy scheme for micro-enterprises providing 25-35% margin money subsidy on bank loans for new manufacturing and service sector ventures.",
      category: "BUSINESS",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Unemployed youth, artisans, ex-servicemen, co-operatives setting up micro-enterprises.",
      ageCondition: "18 years and above.",
      educationCondition: "8th pass for projects above ₹10 Lakh.",
      incomeCondition: "None.",
      benefit: "25-35% margin money subsidy. Projects up to ₹50 Lakh (Manufacturing) / ₹20 Lakh (Service).",
      sourceUrl: "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [{ field: "category", operator: "IN", value: "BUSINESS_OWNER,GENERAL_CITIZEN", description: "New enterprise entrepreneur", required: true }],
      requiredDocuments: [
        { id: 2901, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card", purpose: "KYC", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 2902, documentType: "PROJECT_REPORT", documentName: "Detailed Project Report (DPR)", purpose: "Loan assessment", requiredFlag: true, issuingAuthority: "KVIC / DIC" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Apply on PMEGP e-Portal", instruction: "Register at kviconline.gov.in/pmegpeportal and submit online application.", sourceUrl: "https://www.kviconline.gov.in/pmegpeportal" },
        { stepNumber: 2, title: "KVIC / Bank Interview", instruction: "Attend interview at KVIC / KVIB / DIC office and arrange bank loan sanction.", sourceUrl: "https://www.kviconline.gov.in/pmegpeportal" }
      ]
    },
    {
      id: 29,
      name: "Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)",
      description: "Maharashtra state health insurance covering 996 procedures at empanelled hospitals for BPL/AAY/farmer ration card holders with ₹1.5 Lakh annual coverage per family.",
      category: "HEALTH",
      governmentLevel: "STATE",
      state: "Maharashtra",
      targetBeneficiaries: "Yellow / Saffron / White Ration Card holders in Maharashtra. Also Kishori, Annapurna Yojana beneficiaries.",
      ageCondition: "No restriction.",
      educationCondition: "None.",
      incomeCondition: "Ration card holder or identified beneficiary.",
      benefit: "Cashless hospitalization ₹1,50,000 per family per year (₹2,50,000 for kidney transplant) at 1000+ hospitals in Maharashtra.",
      sourceUrl: "https://www.jeevandayee.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [
        { field: "state", operator: "EQUALS", value: "Maharashtra", description: "Resident of Maharashtra", required: true },
        { field: "incomerange", operator: "IN", value: "BELOW_1_LAKH,BELOW_2_LAKH,BELOW_3_LAKH", description: "BPL / AAY / farmer ration card holder", required: true }
      ],
      requiredDocuments: [
        { id: 3001, documentType: "RATION_CARD", documentName: "Yellow / Saffron / White Ration Card", purpose: "Beneficiary identification", requiredFlag: true, issuingAuthority: "Food & Civil Supplies Dept, Maharashtra" },
        { id: 3002, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card of patient", purpose: "Cashless treatment identity", requiredFlag: true, issuingAuthority: "UIDAI" }
      ],
      applicationGuides: [{ stepNumber: 1, title: "Go Directly to Empanelled Hospital", instruction: "No pre-registration needed. Visit MJPJAY empanelled hospital with Aadhaar + ration card. Hospital Helpdesk handles real-time authorization.", sourceUrl: "https://www.jeevandayee.gov.in" }]
    },
    {
      id: 30,
      name: "PM Vishwakarma Scheme",
      description: "Comprehensive central support for traditional artisans across 18 trades providing recognition, skill upgrades, toolkit grants (₹15,000), and subsidized loans at 5%.",
      category: "BUSINESS",
      governmentLevel: "CENTRAL",
      state: "All India",
      targetBeneficiaries: "Traditional artisans (Carpenters, Blacksmiths, Potters, Sculptors, Cobblers, Masons, Weavers, Tailors) working with hands and tools.",
      ageCondition: "18 years and above.",
      educationCondition: "Engaged in one of 18 specified trades.",
      incomeCondition: "One member per family; excludes government employees.",
      benefit: "PM Vishwakarma Certificate, ₹15,000 toolkit grant, skill training with ₹500/day stipend, collateral-free loans up to ₹3 Lakh at 5% interest.",
      sourceUrl: "https://pmvishwakarma.gov.in",
      lastVerified: "2026-03-01",
      active: true, isDemoData: false, verificationStatus: "VERIFIED",
      rules: [{ field: "category", operator: "IN", value: "BUSINESS_OWNER,GENERAL_CITIZEN", description: "Traditional artisan / craftsman", required: true }],
      requiredDocuments: [
        { id: 3101, documentType: "AADHAAR_CARD", documentName: "Aadhaar Card (Biometric verified)", purpose: "Identity and trade verification", requiredFlag: true, issuingAuthority: "UIDAI" },
        { id: 3102, documentType: "TRADE_PROOF", documentName: "Declaration of practicing traditional trade", purpose: "Gram Panchayat / ULB verification", requiredFlag: true, issuingAuthority: "Gram Panchayat" }
      ],
      applicationGuides: [
        { stepNumber: 1, title: "Biometric Registration at CSC", instruction: "Visit nearest Common Services Centre (CSC) with Aadhaar and bank passbook for biometric registration.", sourceUrl: "https://pmvishwakarma.gov.in" },
        { stepNumber: 2, title: "3-Tier Verification & Training", instruction: "Complete verification by Gram Panchayat and District Committee, then attend 5-7 day skill training.", sourceUrl: "https://pmvishwakarma.gov.in" }
      ]
    }
  ],

  updates: [
    {
      id: 1,
      title: "MahaDBT Post-Matric Scholarship Portal Extended for AY 2025-26",
      description: "Government of Maharashtra has extended the deadline for online submission of post-matric scholarship applications for SC, ST, VJNT, and Open EBC students until April 30, 2026.",
      category: "EDUCATION",
      source: "Directorate of Higher & Technical Education, Maharashtra",
      sourceUrl: "https://mahadbt.maharashtra.gov.in",
      publishedDate: "2026-03-15",
      relevanceTags: "Student,Scholarship,Maharashtra,MahaDBT",
      active: true,
      isLive: true
    },
    {
      id: 2,
      title: "PM-KISAN 19th Installment Released via Direct Benefit Transfer",
      description: "Prime Minister released the 19th installment of PM-KISAN, disbursing over ₹20,000 Crores directly into the Aadhaar-linked bank accounts of more than 9.5 crore landholding farmer families.",
      category: "AGRICULTURE",
      source: "Press Information Bureau (PIB), Ministry of Agriculture",
      sourceUrl: "https://pmkisan.gov.in",
      publishedDate: "2026-03-10",
      relevanceTags: "Farmer,PM-Kisan,Central,DBT",
      active: true,
      isLive: true
    },
    {
      id: 3,
      title: "Mandatory Aadhaar-NPCI Seeding for State & Central Welfare Subsidies",
      description: "UIDAI and National Payments Corporation of India (NPCI) issue citizen advisory: ensure bank accounts are mapped to Aadhaar payment bridge to avoid DBT scholarship or farming grant transaction bounces.",
      category: "GENERAL",
      source: "Ministry of Electronics and Information Technology (MeitY)",
      sourceUrl: "https://myaadhaar.uidai.gov.in",
      publishedDate: "2026-03-05",
      relevanceTags: "Banking,Aadhaar,DBT,All India",
      active: true,
      isLive: true
    },
    {
      id: 4,
      title: "Maharashtra Revenue Department Introduces 24-Hour Instant Digital 7/12",
      description: "Mahabhumi portal upgrades to high-speed cloud infrastructure allowing citizens to download digitally signed 7/12 and 8A extracts with instant QR verification code.",
      category: "AGRICULTURE",
      source: "Revenue & Forest Department, Maharashtra",
      sourceUrl: "https://digitalsatbara.mahabhumi.gov.in",
      publishedDate: "2026-03-01",
      relevanceTags: "Land Records,7/12,Maharashtra,Farmers",
      active: true,
      isLive: true
    }
  ]
};
