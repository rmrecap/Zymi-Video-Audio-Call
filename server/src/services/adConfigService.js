import { all, get, run, withTransaction } from '../db/postgres.js';

export const adConfigService = {
  createSnapshot: async () => {
    const global = await get('SELECT * FROM ad_global_settings WHERE id = 1');
    const networks = await all('SELECT * FROM ad_network_configs');
    const placements = await all('SELECT * FROM ad_placements');
    const countryRules = await all('SELECT * FROM ad_country_rules');
    const versionRules = await all('SELECT * FROM ad_version_rules');
    
    const snapshotData = JSON.stringify({
      global, networks, placements, countryRules, versionRules
    });
    
    await run('INSERT INTO ad_config_snapshots (snapshot_data) VALUES ($1)', [snapshotData]);
  },

  rollbackToLastSnapshot: async (adminId) => {
    return await withTransaction(async (tx) => {
      const snapshot = await tx.get('SELECT * FROM ad_config_snapshots ORDER BY id DESC LIMIT 1');
      if (!snapshot) return { success: false, message: 'No snapshot available' };
      
      const data = JSON.parse(snapshot.snapshot_data);
      
      if (data.global) {
        await tx.run(`
          UPDATE ad_global_settings SET 
            ads_enabled = $1, test_mode = $2, active_network = $3, fallback_network = $4, interstitial_gap_seconds = $5, native_refresh_seconds = $6, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `, [data.global.ads_enabled, data.global.test_mode, data.global.active_network, data.global.fallback_network, data.global.interstitial_gap_seconds, data.global.native_refresh_seconds]);
      }
      if (data.networks) {
        for (const net of data.networks) {
          await tx.run(`
            UPDATE ad_network_configs SET 
              sdk_key = $1, app_id = $2, interstitial_id = $3, native_id = $4, rewarded_id = $5, banner_id = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
            WHERE network_key = $8
          `, [net.sdk_key, net.app_id, net.interstitial_id, net.native_id, net.rewarded_id, net.banner_id, net.is_active, net.network_key]);
        }
      }
      if (data.placements) {
        for (const p of data.placements) {
          await tx.run(`
            UPDATE ad_placements SET 
              enabled = $1, min_delay_seconds = $2, updated_at = CURRENT_TIMESTAMP
            WHERE placement_key = $3
          `, [p.enabled, p.min_delay_seconds, p.placement_key]);
        }
      }
      
      await tx.run('DELETE FROM ad_country_rules');
      if (data.countryRules) {
        for (const r of data.countryRules) {
          await tx.run(`INSERT INTO ad_country_rules (country_code, ads_enabled, network_override) VALUES ($1, $2, $3)`, [r.country_code, r.ads_enabled, r.network_override]);
        }
      }
      
      await tx.run('DELETE FROM ad_version_rules');
      if (data.versionRules) {
        for (const r of data.versionRules) {
          await tx.run(`INSERT INTO ad_version_rules (app_version, ads_enabled, force_update) VALUES ($1, $2, $3)`, [r.app_version, r.ads_enabled, r.force_update]);
        }
      }
      
      await adConfigService.logAudit(adminId, 'AD_CONFIG_ROLLBACK', null, null, 'ALL', 'HIGH');
      return { success: true };
    }).catch(err => {
      console.error('[ZRCS] Rollback failed:', err);
      return { success: false, message: err.message };
    });
  },

  getGlobalSettings: async () => {
    return await get('SELECT * FROM ad_global_settings WHERE id = 1');
  },

  updateGlobalSettings: async (settings, adminId) => {
    await adConfigService.createSnapshot();
    const old = await adConfigService.getGlobalSettings();
    const { ads_enabled, test_mode, active_network, fallback_network, interstitial_gap_seconds, native_refresh_seconds } = settings;
    
    // Risk assessment
    let risk = 'LOW';
    if (ads_enabled !== old.ads_enabled) risk = 'HIGH';
    if (active_network !== old.active_network) risk = 'MEDIUM';
    if (test_mode === 0 && old.test_mode === 1) risk = 'HIGH'; // Production switch

    await run(`
      UPDATE ad_global_settings SET 
        ads_enabled = $1, 
        test_mode = $2, 
        active_network = $3, 
        fallback_network = $4, 
        interstitial_gap_seconds = $5, 
        native_refresh_seconds = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [ads_enabled, test_mode, active_network, fallback_network, interstitial_gap_seconds, native_refresh_seconds]);
    
    await adConfigService.logAudit(adminId, 'UPDATE_GLOBAL_SETTINGS', JSON.stringify(old), JSON.stringify(settings), 'GLOBAL', risk);
    return await adConfigService.getGlobalSettings();
  },

  getNetworkConfigs: async () => {
    return await all('SELECT * FROM ad_network_configs');
  },

  updateNetworkConfig: async (config, adminId) => {
    await adConfigService.createSnapshot();
    const old = await get('SELECT * FROM ad_network_configs WHERE network_key = $1', [config.network_key]);
    const { network_key, sdk_key, app_id, interstitial_id, native_id, rewarded_id, banner_id, is_active } = config;
    
    // Risk assessment
    let risk = 'MEDIUM';
    if (app_id !== old.app_id || interstitial_id !== old.interstitial_id) risk = 'HIGH';

    await run(`
      UPDATE ad_network_configs SET 
        sdk_key = $1, 
        app_id = $2, 
        interstitial_id = $3, 
        native_id = $4, 
        rewarded_id = $5, 
        banner_id = $6, 
        is_active = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE network_key = $8
    `, [sdk_key, app_id, interstitial_id, native_id, rewarded_id, banner_id, is_active, network_key]);
    
    await adConfigService.logAudit(adminId, `UPDATE_NETWORK_${network_key.toUpperCase()}`, JSON.stringify(old), JSON.stringify(config), 'NETWORKS', risk);
    return await all('SELECT * FROM ad_network_configs WHERE network_key = $1', [network_key]);
  },

  getPlacements: async () => {
    return await all('SELECT * FROM ad_placements');
  },

  updatePlacement: async (placement, adminId) => {
    await adConfigService.createSnapshot();
    const old = await get('SELECT * FROM ad_placements WHERE placement_key = $1', [placement.placement_key]);
    const { placement_key, enabled, min_delay_seconds } = placement;
    
    await run(`
      UPDATE ad_placements SET 
        enabled = $1, 
        min_delay_seconds = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE placement_key = $3
    `, [enabled, min_delay_seconds, placement_key]);
    
    await adConfigService.logAudit(adminId, `UPDATE_PLACEMENT_${placement_key.toUpperCase()}`, JSON.stringify(old), JSON.stringify(placement), 'PLACEMENTS', 'MEDIUM');
    return await adConfigService.getPlacements();
  },

  getCountryRules: async () => {
    return await all('SELECT * FROM ad_country_rules');
  },

  addCountryRule: async (rule, adminId) => {
    await adConfigService.createSnapshot();
    const { country_code, ads_enabled, network_override } = rule;
    await run(`
      INSERT INTO ad_country_rules (country_code, ads_enabled, network_override)
      VALUES ($1, $2, $3)
    `, [country_code.toUpperCase(), ads_enabled, network_override]);
    
    await adConfigService.logAudit(adminId, 'ADD_COUNTRY_RULE', null, JSON.stringify(rule), 'GEO_RULES', 'HIGH');
    return await adConfigService.getCountryRules();
  },

  removeCountryRule: async (id, adminId) => {
    await adConfigService.createSnapshot();
    const old = await get('SELECT * FROM ad_country_rules WHERE id = $1', [id]);
    await run('DELETE FROM ad_country_rules WHERE id = $1', [id]);
    await adConfigService.logAudit(adminId, 'REMOVE_COUNTRY_RULE', JSON.stringify(old), null, 'GEO_RULES', 'HIGH');
    return await adConfigService.getCountryRules();
  },

  getVersionRules: async () => {
    return await all('SELECT * FROM ad_version_rules');
  },

  addVersionRule: async (rule, adminId) => {
    await adConfigService.createSnapshot();
    const { app_version, ads_enabled, force_update } = rule;
    await run(`
      INSERT INTO ad_version_rules (app_version, ads_enabled, force_update)
      VALUES ($1, $2, $3)
    `, [app_version, ads_enabled, force_update]);
    
    await adConfigService.logAudit(adminId, 'ADD_VERSION_RULE', null, JSON.stringify(rule), 'VERSION_RULES', 'HIGH');
    return await adConfigService.getVersionRules();
  },

  removeVersionRule: async (id, adminId) => {
    await adConfigService.createSnapshot();
    const old = await get('SELECT * FROM ad_version_rules WHERE id = $1', [id]);
    await run('DELETE FROM ad_version_rules WHERE id = $1', [id]);
    await adConfigService.logAudit(adminId, 'REMOVE_VERSION_RULE', JSON.stringify(old), null, 'VERSION_RULES', 'HIGH');
    return await adConfigService.getVersionRules();
  },

  getAuditLogs: async () => {
    return await all('SELECT a.*, u.username as admin_name FROM ad_config_audit_logs a LEFT JOIN users u ON a.admin_id = u.id ORDER BY timestamp DESC LIMIT 100');
  },

  logAudit: async (adminId, action, oldVal, newVal, section, risk = 'LOW') => {
    await run(`
      INSERT INTO ad_config_audit_logs (admin_id, action, old_value, new_value, changed_section, risk_level) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [adminId, action, oldVal, newVal, section, risk]);
  },

  getAppConfig: async (countryCode, appVersion) => {
    const global = await adConfigService.getGlobalSettings();
    if (!global.ads_enabled) {
      return { ads_enabled: false };
    }

    // Check version rules
    if (appVersion) {
      const vRule = await get('SELECT * FROM ad_version_rules WHERE app_version = $1', [appVersion]);
      if (vRule && !vRule.ads_enabled) return { ads_enabled: false, force_update: !!vRule.force_update };
    }

    // Check country rules
    let activeNetwork = global.active_network;
    if (countryCode) {
      const cRule = await get('SELECT * FROM ad_country_rules WHERE country_code = $1', [countryCode.toUpperCase()]);
      if (cRule) {
        if (!cRule.ads_enabled) return { ads_enabled: false };
        if (cRule.network_override) activeNetwork = cRule.network_override;
      }
    }

    const placements = await adConfigService.getPlacements();
    const networks = await adConfigService.getNetworkConfigs();
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

  exportConfig: async () => {
    return {
      global: await adConfigService.getGlobalSettings(),
      networks: await adConfigService.getNetworkConfigs(),
      placements: await adConfigService.getPlacements(),
      countryRules: await adConfigService.getCountryRules(),
      versionRules: await adConfigService.getVersionRules(),
      latestAuditLogs: await all('SELECT * FROM ad_config_audit_logs ORDER BY timestamp DESC LIMIT 50')
    };
  }
};
