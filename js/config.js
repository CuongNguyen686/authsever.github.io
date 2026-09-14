// Single configuration surface for the whole application.
// Put only PUBLIC browser configuration here. Never put database admin credentials,
// service-account JSON, private API secrets, signing keys, or other privileged secrets here.
export const CONFIG = Object.freeze({
  APP_NAME: "SEVER KEY NGUYENCUONG",
  ADMIN_GATE_SECRET: "nguyencuongios", // Optional client-side gate. Not a security boundary.
  API_BASE_URL: "",       // Example: https://api.example.com/api — leave empty to use Firebase adapter.
  firebase: {
    // Realtime Database endpoint supplied by the user.
    // REST mode only needs databaseURL; do not reuse credentials from the old Firebase project.
    databaseURL: "https://authsever-91133-default-rtdb.asia-southeast1.firebasedatabase.app"
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
  Boolean(CONFIG.firebase.databaseURL);