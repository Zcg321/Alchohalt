/** Runtime-only accessors to keep Capacitor plugins out of initial bundle */
export async function getLocalNotifications(){
  return (await import("@capacitor/local-notifications")).LocalNotifications;
}
export async function getPreferences(){
  return (await import("@capacitor/preferences")).Preferences;
}
