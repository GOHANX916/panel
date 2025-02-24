const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());

const PAYMENT_FILE = 'payment.json';
const ID_FILE = 'id.json';

// Load payments
function loadPayments() {
    if (fs.existsSync(PAYMENT_FILE)) {
        return JSON.parse(fs.readFileSync(PAYMENT_FILE));
    }
    return [];
}

// Save payments
function savePayments(payments) {
    fs.writeFileSync(PAYMENT_FILE, JSON.stringify(payments, null, 2));
}

// Load IDs
function loadIDs() {
    if (fs.existsSync(ID_FILE)) {
        return JSON.parse(fs.readFileSync(ID_FILE));
    }
    return [];
}

// Save IDs
function saveIDs(ids) {
    fs.writeFileSync(ID_FILE, JSON.stringify(ids, null, 2));
}

// Submit a transaction
app.post('/submit-transaction', (req, res) => {
    const { transactionId } = req.body;
    let payments = loadPayments();
    
    if (payments.some(p => p.transactionId === transactionId)) {
        return res.json({ message: 'Transaction ID already exists.' });
    }
    
    payments.push({ transactionId, verified: false, ffAccount: null });
    savePayments(payments);
    res.json({ message: 'Transaction ID submitted successfully, awaiting verification.' });
});

// Get all payments
app.get('/get-payments', (req, res) => {
    res.json(loadPayments());
});

// Verify a transaction and assign an FF ID
app.post('/verify-transaction', (req, res) => {
    const { transactionId } = req.body;
    let payments = loadPayments();
    let ids = loadIDs();
    
    let payment = payments.find(p => p.transactionId === transactionId);
    if (!payment) {
        return res.status(400).json({ message: 'Transaction ID not found.' });
    }
    if (payment.verified) {
        return res.json({ message: 'Transaction already verified.' });
    }
    
    if (ids.length === 0) {
        return res.status(400).json({ message: 'No FF IDs available.' });
    }
    
    const assignedID = ids.shift(); // Take the first available ID
    payment.verified = true;
    payment.ffAccount = assignedID;
    
    savePayments(payments);
    saveIDs(ids);
    
    res.json({ message: 'Transaction verified successfully.', ffAccount: assignedID });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
