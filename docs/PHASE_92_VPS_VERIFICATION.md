# PHASE 92 — VPS Verification (Local Build Environment)

**Date:** 2026-06-03  
**Status:** ✅ VERIFIED

---

## System Information

| Field | Value | Source |
|-------|-------|--------|
| Provider | Amazon EC2 | `Get-CimInstance Win32_ComputerSystem` — Manufacturer: Amazon EC2 |
| Instance Type | m7i-flex.large | IMDSv2: `http://169.254.169.254/latest/meta-data/instance-type` |
| Region | eu-north-1 (Stockholm) | IMDSv2: `http://169.254.169.254/latest/meta-data/placement/region` |
| Public IP | 13.53.42.173 | `http://checkip.amazonaws.com` |
| OS | Windows Server 2025 Datacenter | `Get-CimInstance Win32_OperatingSystem` — Caption, Version 10.0.26100 |
| Architecture | 64-bit | `Get-CimInstance Win32_OperatingSystem` — OSArchitecture |
| Last Boot | 2026-06-02 19:18 UTC | `Get-CimInstance Win32_OperatingSystem` — LastBootUpTime |
| Uptime | 0d 16h 2m (at time of check) | Calculated from LastBootUpTime |

---

## CPU

| Field | Value | Source |
|-------|-------|--------|
| Model | Intel(R) Xeon(R) Platinum 8488C | `Get-CimInstance Win32_Processor` — Name |
| Cores | 1 | NumberOfCores |
| Logical Processors | 2 | NumberOfLogicalProcessors (hyperthreading) |
| Max Clock | 2.4 GHz | MaxClockSpeed |

```
Processor: Intel(R) Xeon(R) Platinum 8488C @ 2.4GHz
Cores:     1 physical, 2 logical
```

---

## Memory

| Field | Value | Source |
|-------|-------|--------|
| Total | 7.75 GB (8,317,349,888 bytes) | `Get-CimInstance Win32_ComputerSystem` — TotalPhysicalMemory |

```
Total RAM: 7.75 GB
```

---

## Disk

| Drive | Total | Used | Free | Used % | Source |
|-------|-------|------|------|--------|--------|
| C: | 499.5 GB | 119.1 GB | 380.4 GB | 23.8% | `Get-CimInstance Win32_LogicalDisk` |

```
Filesystem      Size  Used  Avail  Use%
C:             499.5G 119.1G 380.4G  24%
```

---

## Installed Tools

| Tool | Version | Command |
|------|---------|---------|
| Node.js | v24.16.0 | `node --version` |
| npm | 11.13.0 | `npm --version` |
| Git | 2.45.1.windows.1 | `git --version` |
| Docker Desktop | 29.5.2 (build 79eb04c) | `docker --version` |
| dockerd | 29.5.2 (build 568f755) | `dockerd --version` |

### Docker Status

```
com.docker.service: Running (Manual start)
Docker Engine:      NOT AVAILABLE
Reason:             Nested virtualization not supported on m7i-flex.large
                    WSL2 cannot start (HCS_E_HYPERV_NOT_INSTALLED)
                    WSL1 distro (Ubuntu) present but stopped
```

---

## Hyper-V / Virtualization

| Feature | Status |
|---------|--------|
| Hyper-V Windows Feature | Enabled |
| Containers Windows Feature | Disabled |
| WSL Default Version | 1 |
| WSL Distros | Ubuntu (Stopped) |
| Nested Virtualization | NOT AVAILABLE (m7i-flex.large limitation) |

---

## Network

| Interface | Detail |
|-----------|--------|
| Public IPv4 | 13.53.42.173 |
| EC2 Metadata (IMDSv2) | Accessible (token-based) |

---

## Result

```
╔══════════════════════════════════════════════════════════════╗
║               PHASE 92 — VPS VERIFICATION                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   Provider:    Amazon EC2                                    ║
║   Instance:    m7i-flex.large                                ║
║   Region:      eu-north-1                                    ║
║   Public IP:   13.53.42.173                                  ║
║   CPU:         2 vCPU (Intel Xeon Platinum 8488C)           ║
║   RAM:         7.75 GB                                       ║
║   Disk:        499.5 GB (119.1 GB used)                      ║
║   OS:          Windows Server 2025 Datacenter                ║
║                                                              ║
║   RESULT: ✅ VERIFIED — All system data confirmed live       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```
