import { adConfigService } from './adConfigService.js';

export const adConfigValidator = {
  validateConfig: (settings, networks, placements, countryRules, versionRules) => {
    const errors = [];
    const warnings = [];

    // Global active_network check
    const validNetworks = ['admob', 'meta', 'applovin', 'pangle', 'inmobi'];
    if (settings && !validNetworks.includes(settings.active_network)) {
      errors.push(`Invalid active_network: ${settings.active_network}. Must be one of: ${validNetworks.join(', ')}`);
    }

    if (settings && settings.fallback_network && !validNetworks.includes(settings.fallback_network)) {
      errors.push(`Invalid fallback_network: ${settings.fallback_network}.`);
    }

    // Interval checks
    if (settings && settings.interstitial_gap_seconds < 60) {
      errors.push(`interstitial_gap_seconds must not be below safe minimum (60s). Got ${settings.interstitial_gap_seconds}.`);
    }
    
    if (settings && settings.native_refresh_seconds < 30) {
      errors.push(`native_refresh_seconds must not be below safe minimum (30s). Got ${settings.native_refresh_seconds}.`);
    }

    // If master switch ON, check active network IDs
    if (settings && settings.ads_enabled === 1) {
      const activeNet = networks.find(n => n.network_key === settings.active_network);
      if (!activeNet) {
        errors.push(`Active network ${settings.active_network} configuration is missing.`);
      } else {
        if (!activeNet.app_id || activeNet.app_id.trim() === '') {
          errors.push(`Active network ${settings.active_network} is missing app_id.`);
        }
        if (!activeNet.interstitial_id || activeNet.interstitial_id.trim() === '') {
          errors.push(`Active network ${settings.active_network} is missing interstitial_id.`);
        }
        // Test mode check
        if (settings.test_mode === 0) {
          if (activeNet.app_id.includes('test') || activeNet.app_id.includes('placeholder')) {
            errors.push(`Production mode cannot allow obvious placeholder app_id.`);
          }
          if (activeNet.interstitial_id.includes('test') || activeNet.interstitial_id.includes('placeholder')) {
            errors.push(`Production mode cannot allow obvious placeholder interstitial_id.`);
          }
        }
      }
    }

    // Placement checks
    placements.forEach(p => {
      if (p.enabled) {
        const activeNet = networks.find(n => n.network_key === (settings ? settings.active_network : 'admob'));
        if (activeNet) {
          if (p.placement_key === 'app_open' || p.placement_key === 'call_end_interstitial') {
            if (!activeNet.interstitial_id || activeNet.interstitial_id.trim() === '') {
              warnings.push(`Placement ${p.placement_key} is ON but interstitial_id is missing for active network.`);
            }
          }
          if (p.placement_key.includes('native') && (!activeNet.native_id || activeNet.native_id.trim() === '')) {
            warnings.push(`Placement ${p.placement_key} is ON but native_id is missing for active network.`);
          }
          if (p.placement_key.includes('rewarded') && (!activeNet.rewarded_id || activeNet.rewarded_id.trim() === '')) {
            warnings.push(`Placement ${p.placement_key} is ON but rewarded_id is missing for active network.`);
          }
        }
      }
    });

    // Country Rule checks
    countryRules.forEach(rule => {
      if (!rule.country_code || rule.country_code.length > 3) {
        errors.push(`Invalid country rule: ${rule.country_code}`);
      }
    });

    // Version Rule checks
    versionRules.forEach(rule => {
      if (!rule.app_version || !/^\d+\.\d+\.\d+$/.test(rule.app_version)) {
        errors.push(`Invalid version rule format: ${rule.app_version}. Use semantic versioning (e.g. 1.0.0).`);
      }
    });

    return { errors, warnings, isValid: errors.length === 0 };
  }
};
