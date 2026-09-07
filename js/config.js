// Single configuration surface for the whole application.
// Put only PUBLIC browser configuration here. Never put database admin credentials,
// service-account JSON, private API secrets, signing keys, or other privileged secrets here.
export const CONFIG = Object.freeze({
  APP_NAME: "SEVER KEY NGUYENCUONG",
  ADMIN_GATE_SECRET: "nguyencuongios", // Optional client-side gate. Not a security boundary.
  API_BASE_URL: "",       // Example: https://api.example.com/api — leave empty to use Firebase adapter.
  firebase: {
    apiKey: "AIzaSyBoYPFC49bqhIVlOC4Qg5cASNj-z4yQTHM",
    authDomain: "sever-key-ngcuong.firebaseapp.com",
    databaseURL: "https://sever-key-ngcuong-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sever-key-ngcuong",
    storageBucket: "sever-key-ngcuong.firebasestorage.app",
    messagingSenderId: "1486481153",
    appId: "1:1486481153:web:6a970ca8c291720d6c5d00"
  },
  defaults: {
    expirationDays: 30,
    maxDevices: 1,
    offlineGraceMinutes: 0
  },
  pageSize: 25
});

export const hasApi = () => Boolean(CONFIG.API_BASE_URL.trim());
export const hasFirebase = () =>
  Boolean(CONFIG.firebase.apiKey && CONFIG.firebase.databaseURL && CONFIG.firebase.projectId && CONFIG.firebase.appId);