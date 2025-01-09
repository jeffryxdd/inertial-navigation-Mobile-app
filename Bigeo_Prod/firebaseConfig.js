// firebaseConfig.js
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth'; // Si usas autenticación

const firebaseConfig = {
  apiKey: "AIzaSyCMcvDxjeM1QaKrvpOEYiD7NT3IjacmXkY",
  authDomain: "bigeo-3003a.firebaseapp.com",
  projectId: "bigeo-3003a",
  storageBucket: "bigeo-3003a.firebasestorage.app",
  messagingSenderId: "200419538073",
  appId: "1:200419538073:web:016420748bcbcf0c707408"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const dbs = firebase.firestore(); // Inicializa Firestore
const auth = firebase.auth(); // Inicializa autenticación si la necesitas
export { dbs, auth };
