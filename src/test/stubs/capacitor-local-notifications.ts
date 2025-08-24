export const LocalNotifications = {
  schedule: async () => ({}),
  requestPermissions: async () => ({ display: "granted" }),
  checkPermissions: async () => ({ display: "granted" }),
  getPending: async () => ([]),
  cancel: async () => ({})
};
export default { LocalNotifications };
