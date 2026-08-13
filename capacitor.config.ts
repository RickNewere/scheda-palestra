import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ricknewere.schedapalestra',
  appName: 'Scheda Palestra',
  webDir: 'dist',
  backgroundColor: '#090c12',
  android: {
    backgroundColor: '#090c12',
    // The app owns its scrolling, the WebView bounce would fight the sheets.
    allowMixedContent: false,
  },
}

export default config
