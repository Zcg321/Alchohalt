/**
 * Ambient declaration so typechecking doesn't fail on web where the module may not be present.
 * At runtime, we dynamically import and guard uses.
 */
declare module '@capacitor/local-notifications' {
  export const LocalNotifications: unknown;
}
