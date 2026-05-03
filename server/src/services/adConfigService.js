import { all, get, run } from '../db/database.js';

export const adConfigService = {
  createSnapshot: () => {
    const global = get('SELECT * FROM ad_global_settings WHERE id = 1');
    const networks = all('SELECT * FROM ad_network_configs');
    const placements = all('SELECT * FROM ad_placements');
    const countryRules = all('SELECT * FROM ad_country_rules');
    const versionRules = all('SELECT * FROM ad_version_rules');
    
    const snapshotData = JSON.stringify({
      global, networks, placements, countryRules, versionRules
    });
    
    run('INSERT INTO ad_config_snapshots (snapshot_data) VALUES (?)', snapshotData);
  },

  rollbackToLastSnapshot: (adminId) => {
    const snapshot = get('SELECT * FROM ad_config_snapshots ORDER BY id DESC LIMIT 1');
    if (!snapshot) return { success: false, message: 'No snapshot available' };
    
    const data = JSON.parse(snapshot.snapshot_data);
    
    run('BEGIN TRANSACTION');
    try {
      if (data.global) {
        run(`
          UPDATE ad_global_settings SET 
            ads_enabled = ?, test_mode = ?, active_network = ?, fallback_network = ?, interstitial_gap_seconds = ?, native_refresh_seconds = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `, data.global.ads_enabled, data.global.test_mode, data.global.active_network, data.global.fallback_network, data.global.interstitial_gap_seconds, data.global.native_refresh_seconds);
      }
      if (data.networks) {
        for (const net of data.networks) {
          run(`
            UPDATE ad_network_configs SET 
              sdk_key = ?, app_id = ?, interstitial_id = ?, native_id = ?, rewarded_id = ?, banner_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE network_key = ?
          `, net.sdk_key, net.app_id, net.interstitial_id, net.native_id, net.rewarded_id, net.banner_id, net.is_active, net.network_key);
        }
      }
      if (data.placements) {
        for (const p of data.placements) {
          run(`
            UPDATE ad_placements SET 
              enabled = ?, min_delay_seconds = ?, updated_at = CURRENT_TIMESTAMP
            WHERE placement_key = ?
          `, p.enabled, p.min_delay_seconds, p.placement_key);
        }
      }
      
      run('DELETE FROM ad_country_rules');
      if (data.countryRules) {
        for (const r of data.countryRules) {
          run(`INSERT INTO ad_country_rules (country_code, ads_enabled, network_override) VALUES (?, ?, ?)`, r.country_code, r.ads_enabled, r.network_override);
        }
      }
      
      run('DELETE FROM ad_version_rules');
      if (data.versionRules) {
        for (const r of data.versionRules) {
          run(`INSERT INTO ad_version_rules (app_version, ads_enabled, force_update) VALUES (?, ?, ?)`, r.app_version, r.ads_enabled, r.force_update);
        }
      }
      
      run('COMMIT');
      adConfigService.logAudit(adminId, 'AD_CONFIG_ROLLBACK', null, null, 'ALL', 'HIGH');
      return { success: true };
    } catch (err) {
      run('ROLLBACK');
      console.error('[ZRCS] Rollback failed:', err);
      return { success: false, message: err.message };
    }
  },

  getGlobalSettings: () => {
    return get('SELECT * FROM ad_global_settings WHERE id = 1');
  },

  updateGlobalSettings: (settings, adminId) => {
    adConfigService.createSnapshot();
    const old = adConfigService.getGlobalSettings();
    const { ads_enabled, test_mode, active_network, fallback_network, interstitial_gap_seconds, native_refresh_seconds } = settings;
    
    // Risk assessment
    let risk = 'LOW';
    if (ads_enabled !== old.ads_enabled) risk = 'HIGH';
    if (active_network !== old.active_network) risk = 'MEDIUM';
    if (test_mode === 0 && old.test_mode === 1) risk = 'HIGH'; // Production switch

    run(`
      UPDATE ad_global_settings SET 
        ads_enabled = ?, 
        test_mode = ?, 
        active_network = ?, 
        fallback_network = ?, 
        interstitial_gap_seconds = ?, 
        native_refresh_seconds = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, ads_enabled, test_mode, active_network, fallback_network, interstitial_gap_seconds, native_refresh_seconds);
    
    adConfigService.logAudit(adminId, 'UPDATE_GLOBAL_SETTINGS', JSON.stringify(old), JSON.stringify(settings), 'GLOBAL', risk);
    return adConfigService.getGlobalSettings();
  },

  getNetworkConfigs: () => {
    return all('SELECT * FROM ad_network_configs');
  },

  updateNetworkConfig: (config, adminId) => {
    adConfigService.createSnapshot();
    const old = get('SELECT * FROM ad_network_configs WHERE network_key = ?', config.network_key);
    const { network_key, sdk_key, app_id, interstitial_id, native_id, rewarded_id, banner_id, is_active } = config;
    
    // Risk assessment
    let risk = 'MEDIUM';
    if (app_id !== old.app_id || interstitial_id !== old.interstitial_id) risk = 'HIGH';

    run(`
      UPDATE ad_network_configs SET 
        sdk_key = ?, 
        app_id = ?, 
        interstitial_id = ?, 
        native_id = ?, 
        rewarded_id = ?, 
        banner_id = ?, 
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE network_key = ?
    `, sdk_key, app_id, interstitial_id, native_id, rewarded_id, banner_id, is_active, network_key);
    
    adConfigService.logAudit(adminId, `UPDATE_NETWORK_${network_key.toUpperCase()}`, JSON.stringify(old), JSON.stringify(config), 'NETWORKS', risk);
    return all('SELECT * FROM ad_network_configs WHERE network_key = ?', network_key);
  },

  getPlacements: () => {
    return all('SELECT * FROM ad_placements');
  },

  updatePlacement: (placement, adminId) => {
    adConfigService.createSnapshot();
    const old = get('SELECT * FROM ad_placements WHERE placement_key = ?', placement.placement_key);
    const { placement_key, enabled, min_delay_seconds } = placement;
    
    run(`
      UPDATE ad_placements SET 
        enabled = ?, 
        min_delay_seconds = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE placement_key = ?
    `, enabled, min_delay_seconds, placement_key);
    
    adConfigService.logAudit(adminId, `UPDATE_PLACEMENT_${placement_key.toUpperCase()}`, JSON.stringify(old), JSON.stringify(placement), 'PLACEMENTS', 'MEDIUM');
    return adConfigService.getPlacements();
  },

  getCountryRules: () => {
    return all('SELECT * FROM ad_country_rules');
  },

  addCountryRule: (rule, adminId) => {
    adConfigService.createSnapshot();
    const { country_code, ads_enabled, network_override } = rule;
    run(`
      INSERT INTO ad_country_rules (country_code, ads_enabled, network_override)
      VALUES (?, ?, ?)
    `, country_code.toUpperCase(), ads_enabled, network_override);
    
    adConfigService.logAudit(adminId, 'ADD_COUNTRY_RULE', null, JSON.stringify(rule), 'GEO_RULES', 'HIGH');
    return adConfigService.getCountryRules();
  },

  removeCountryRule: (id, adminId) => {
    adConfigService.createSnapshot();
    const old = get('SELECT * FROM ad_country_rules WHERE id = ?', id);
    run('DELETE FROM ad_country_rules WHERE id = ?', id);
    adConfigService.logAudit(adminId, 'REMOVE_COUNTRY_RULE', JSON.stringify(old), null, 'GEO_RULES', 'HIGH');
    return adConfigService.getCountryRules();
  },

  getVersionRules: () => {
    return all('SELECT * FROM ad_version_rules');
  },

  addVersionRule: (rule, adminId) => {
    adConfigService.createSnapshot();
    const { app_version, ads_enabled, force_update } = rule;
    run(`
      INSERT INTO ad_version_rules (app_version, ads_enabled, force_update)
      VALUES (?, ?, ?)
    `, app_version, ads_enabled, force_update);
    
    adConfigService.logAudit(adminId, 'ADD_VERSION_RULE', null, JSON.stringify(rule), 'VERSION_RULES', 'HIGH');
    return adConfigService.getVersionRules();
  },

  removeVersionRule: (id, adminId) => {
    adConfigService.createSnapshot();
    const old = get('SELECT * FROM ad_version_rules WHERE id = ?', id);
    run('DELETE FROM ad_version_rules WHERE id = ?', id);
    adConfigService.logAudit(adminId, 'REMOVE_VERSION_RULE', JSON.stringify(old), null, 'VERSION_RULES', 'HIGH');
    return adConfigService.getVersionRules();
  },

  getAuditLogs: () => {
    return all('SELECT a.*, u.username as admin_name FROM ad_config_audit_logs a LEFT JOIN users u ON a.admin_id = u.id ORDER BY timestamp DESC LIMIT 100');
  },

  logAudit: (adminId, action, oldVal, newVal, section, risk = 'LOW') => {
    run(`
      INSERT INTO ad_config_audit_logs (admin_id, action, old_value, new_value, changed_section, risk_level) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, adminId, action, oldVal, newVal, section, risk);
  },

  getAppConfig: (countryCode, appVersion) => {
    const global = adConfigService.getGlobalSettings();
    if (!global.ads_enabled) {
      return { ads_enabled: false };
    }

    // Check version rules
    if (appVersion) {
      const vRule = get('SELECT * FROM ad_version_rules WHERE app_version = ?', appVersion);
      if (vRule && !vRule.ads_enabled) return { ads_enabled: false, force_update: !!vRule.force_update };
    }

    // Check country rules
    let activeNetwork = global.active_network;
    if (countryCode) {
      const cRule = get('SELECT * FROM ad_country_rules WHERE country_code = ?', countryCode.toUpperCase());
      if (cRule) {
        if (!cRule.ads_enabled) return { ads_enabled: false };
        if (cRule.network_override) activeNetwork = cRule.network_override;
      }
    }

    const placements = adConfigService.getPlacements();
    const networks = adConfigService.getNetworkConfigs();
    const activeNet = networks.find(n => n.network_key === activeNetwork) || networks.find(n => n.network_key === global.fallback_network);

    const placementObj = {};
    placements.forEach(p => {
      placementObj[p.placement_key] = !!p.enabled;
    });

    const networkObj = {};
    if (activeNet) {
      networkObj[activeNet.network_key] = {
        app_id: activeNet.app_id,
        interstitial: activeNet.interstitial_id,
        native: activeNet.native_id,
        rewarded: activeNet.rewarded_id,
        banner: activeNet.banner_id,
        sdk_key: activeNet.sdk_key
      };
    }

    return {
      ads_enabled: true,
      test_mode: !!global.test_mode,
      active_network: activeNet ? activeNet.network_key : null,
      fallback_network: global.fallback_network,
      intervals: {
        interstitial_gap_seconds: global.interstitial_gap_seconds,
        native_refresh_seconds: global.native_refresh_seconds
      },
      placements: placementObj,
      networks: networkObj
    };
  },

  exportConfig: () => {
    return {
      global: adConfigService.getGlobalSettings(),
      networks: adConfigService.getNetworkConfigs(),
      placements: adConfigService.getPlacements(),
      countryRules: adConfigService.getCountryRules(),
      versionRules: adConfigService.getVersionRules(),
      latestAuditLogs: get('SELECT * FROM ad_config_audit_logs ORDER BY timestamp DESC LIMIT 50')
    };
  }
};
