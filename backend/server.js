// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database (in production, use MongoDB, PostgreSQL, etc.)


let patients = [
  {
    id: 1, name: "Amina Nakato", age: 8, location: "Kampala, Uganda",
    condition: "Cardiac Surgery", urgency: "Critical", targetAmount: 5000,
    raisedAmount: 2300, donorCount: 45, verified: true, daysLeft: 15,
    hospital: "Mulago Hospital", lastUpdate: new Date().toISOString(),
    walletAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // ADD THIS
    story: "Amina was born with a congenital heart defect. She needs urgent cardiac surgery to survive."
  },
  {
    id: 2, name: "Joseph Okello", age: 45, location: "Gulu, Uganda",
    condition: "Cancer Treatment", urgency: "High", targetAmount: 8000,
    raisedAmount: 4500, donorCount: 62, verified: true, daysLeft: 30,
    hospital: "Uganda Cancer Institute", lastUpdate: new Date().toISOString(),
    walletAddress: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", // ADD THIS
    story: "Joseph is a father of four battling stage 3 cancer. He needs chemotherapy treatment."
  },
  {
    id: 3, name: "Grace Achieng", age: 12, location: "Nairobi, Kenya",
    condition: "Kidney Transplant", urgency: "Critical", targetAmount: 15000,
    raisedAmount: 8900, donorCount: 128, verified: true, daysLeft: 10,
    hospital: "Kenyatta Hospital", lastUpdate: new Date().toISOString(),
    walletAddress: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy", // ADD THIS
    story: "Grace's kidneys are failing rapidly. She needs a kidney transplant urgently."
  },
  {
    id: 4, name: "Kelly Joramz", age: 42, location: "Abuja, Nigeria",
    condition: "HIV/AIDS", urgency: "Critical", targetAmount: 18000,
    raisedAmount: 7900, donorCount: 128, verified: true, daysLeft: 30,
    hospital: "Niger International Hospital", lastUpdate: new Date().toISOString(),
    walletAddress: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw", // ADD THIS
    story: "Kelly needs urgent HIV/AIDS treatment and medication to survive."
  }
];




let donations = [];
let stats = {
  totalRaised: 15700,
  totalDonors: 235,
  activeCases: 3,
  livesSaved: 28
};

// Routes

// Get all patients
app.get('/api/patients', (req, res) => {
  const { urgency, search } = req.query;
  
  let filtered = patients;
  
  if (urgency && urgency !== 'all') {
    filtered = filtered.filter(p => p.urgency === urgency);
  }
  
  if (search) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json(filtered);
});

// Get single patient
app.get('/api/patients/:id', (req, res) => {
  const patient = patients.find(p => p.id === parseInt(req.params.id));
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(patient);
});

// Create donation
app.post('/api/donate', (req, res) => {
  const { patientId, amount, walletAddress } = req.body;
  
  if (!patientId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid donation data' });
  }
  
  const patient = patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  
  // Create donation record
  const donation = {
    id: donations.length + 1,
    patientId,
    amount: parseFloat(amount),
    walletAddress,
    timestamp: new Date().toISOString(),
    txHash: '0x' + Math.random().toString(36).substring(2, 15)
  };
  
  donations.push(donation);
  
  // Update patient
  patient.raisedAmount += parseFloat(amount);
  patient.donorCount += 1;
  patient.lastUpdate = new Date().toISOString();
  
  // Update stats
  stats.totalRaised += parseFloat(amount);
  stats.totalDonors += 1;
  
  res.json({
    success: true,
    donation,
    patient
  });
});

// Get stats
app.get('/api/stats', (req, res) => {
  res.json(stats);
});

// Get recent donations
app.get('/api/donations/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const recent = donations
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
    .map(d => {
      const patient = patients.find(p => p.id === d.patientId);
      return {
        ...d,
        patientName: patient?.name
      };
    });
  res.json(recent);
});

// Get donations for a specific patient
app.get('/api/donations/patient/:id', (req, res) => {
  const patientDonations = donations.filter(d => d.patientId === parseInt(req.params.id));
  res.json(patientDonations);
});

// Admin: Create new patient (protected route - add auth in production)
app.post('/api/patients', (req, res) => {
  const newPatient = {
    id: patients.length + 1,
    ...req.body,
    raisedAmount: 0,
    donorCount: 0,
    verified: false,
    lastUpdate: new Date().toISOString()
  };
  
  patients.push(newPatient);
  stats.activeCases += 1;
  
  res.status(201).json(newPatient);
});

// Admin: Update patient
app.put('/api/patients/:id', (req, res) => {
  const index = patients.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  
  patients[index] = {
    ...patients[index],
    ...req.body,
    lastUpdate: new Date().toISOString()
  };
  
  res.json(patients[index]);
});

// Admin: Delete patient
app.delete('/api/patients/:id', (req, res) => {
  const index = patients.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  
  patients.splice(index, 1);
  stats.activeCases -= 1;
  
  res.json({ success: true, message: 'Patient removed' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PolkaHealth Backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});