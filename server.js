const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// Root route
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.redirect('/signup');
});

app.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    await admin.firestore().collection('users').doc(userRecord.uid).set({ fullName, email });
    res.redirect('/login');
  } catch (error) {
    res.status(400).send('Error creating user: ' + error.message);
  }
});

app.post('/login', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      res.redirect('/dashboard'); // Redirect to dashboard after login
    } else {
      res.status(404).send('User data not found.');
    }
  } catch (error) {
    res.status(400).send('Error logging in: ' + error.message);
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
