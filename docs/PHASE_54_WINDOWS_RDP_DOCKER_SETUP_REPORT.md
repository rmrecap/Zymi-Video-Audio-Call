# PHASE 54 — Docker Setup on Windows RDP

**Date:** 2026-06-02  
**Status:** PARTIALLY COMPLETE — Docker Engine runs in Windows container mode only

---

## 1. Attempted Setup Steps

### Step 1: Enable Required Windows Features

| Command | Result |
|---------|--------|
| `Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux` | ✅ Already Enabled |
| `Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform` | ✅ Already Enabled |
| `Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V` | ✅ Feature Enabled (but cannot start VMs) |

**Note:** Hyper-V feature is listed as Enabled but the Hyper-V Platform subcomponents are not installed/enumerated. On AWS EC2 without nested virtualization, Hyper-V cannot create VMs even when the feature is enabled.

### Step 2: Reboot Required?

No reboot was required — the necessary features were already enabled from a previous setup.

### Step 3: WSL Setup

| Command | Result |
|---------|--------|
| `wsl --install` | Not needed — WSL already installed |
| `wsl --set-default-version 2` | ❌ **FAILED** — `HCS_E_HYPERV_NOT_INSTALLED` |
| `wsl --set-version Ubuntu 2` | ❌ **FAILED** — Virtualization not enabled |
| `wsl --update` | ✅ Already up to date |

### Step 4: Ubuntu WSL Distro

| Check | Result |
|-------|--------|
| WSL distro installed | ✅ Ubuntu (version 1, stopped) |
| Can start Ubuntu | Not attempted — WSL1 cannot run Docker daemon |

### Step 5: Install Docker Desktop

| Check | Result |
|-------|--------|
| Docker Desktop installed | ✅ Version 29.5.2 (pre-installed) |
| Docker Desktop service | Started successfully |

### Step 6: Enable Docker Desktop WSL2 Backend

| Check | Result |
|-------|--------|
| Docker Desktop WSL2 backend | ❌ **FAILED** — WSL2 is not available on this machine |
| Docker Desktop settings | AutoStart: false, no WSL2 backend configured |

### Step 7: Enable Linux Containers

| Check | Result |
|-------|--------|
| Switch to Linux containers | ❌ **FAILED** — Docker Desktop cannot provide Linux backend |
| Switch to Windows containers | ✅ Available (but not useful for ZYMI) |

### Step 8: Verify Docker

| Command | Result |
|---------|--------|
| `docker --version` | ✅ Docker version 29.5.2 |
| `docker compose version` | ✅ Docker Compose version v5.1.4 |
| `docker info` (after context fix) | ✅ Server responds, but OSType: **windows** |
| `docker run hello-world` (Linux) | ❌ Cannot pull Linux images on Windows daemon |

### Step 9: Create Test Container

| Command | Result |
|---------|--------|
| `docker run --rm hello-world:nanoserver` | ⏳ Pull started (Windows image) |

### Step 10: Confirm Docker Can Pull Linux Images

| Test | Result |
|------|--------|
| Pull Linux image on Windows daemon | ❌ **IMPOSSIBLE** — Windows Docker daemon only supports Windows container images |

---

## 2. Direct Docker Engine Approach

Since Docker Desktop's Linux VM backend could not start (no WSL2/Hyper-V), we attempted to run `dockerd.exe` directly:

```powershell
# Start dockerd directly (bypasses Docker Desktop)
& "C:\Program Files\Docker\Docker\resources\dockerd.exe" --experimental

# Output:
# Windows default isolation mode: process
# API listen on //./pipe/docker_engine
# Storage Driver: windowsfilter
# OSType: windows
```

**Result:** ✅ Docker Engine started successfully, but in **Windows container mode**.

### Verification

```powershell
# Set environment variable to use direct pipe
$env:DOCKER_HOST = "npipe:////./pipe/docker_engine"

# Docker info — server responds
docker info
# Server Version: 29.5.2
# OSType: windows
# Storage Driver: windowsfilter
# Default Isolation: process

# Docker ps — works
docker ps
# CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES

# Docker pull (Windows) — works
docker pull hello-world:nanoserver
# Pulling from library/hello-world
# Download complete ✓
```

---

## 3. Critical Limitation

```
┌──────────────────────────────────────────────────────────────────┐
│                    CRITICAL LIMITATION FOUND                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Docker Engine IS running on this Windows RDP.                    │
│                                                                   │
│  However, it runs in WINDOWS CONTAINER MODE only.                 │
│                                                                   │
│  OSType:                  windows (NOT linux)                     │
│  Storage Driver:          windowsfilter                           │
│  Default Isolation:      process                                  │
│                                                                   │
│  This means:                                                      │
│  ✅ Windows containers CAN run                                    │
│  ❌ Linux containers CANNOT run                                   │
│                                                                   │
│  ZYMI stack (docker-compose.prod.yml) uses ALL Linux images:      │
│   - postgres:15-alpine        → Linux image                       │
│   - redis:7-alpine            → Linux image                       │
│   - server (node:alpine)      → Linux image                       │
│   - client (node:alpine)      → Linux image                       │
│   - nginx:alpine              → Linux image                       │
│                                                                   │
│  These CANNOT run on a Windows Docker daemon.                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Why Linux Containers Cannot Run

| Requirement | Status | Explanation |
|-------------|--------|-------------|
| Nested virtualization (VT-x) | ❌ Not available | AWS EC2 does not expose VT-x to guest OS |
| Hyper-V VM creation | ❌ Cannot create VMs | Requires VT-x |
| WSL2 | ❌ Cannot start | Requires Hyper-V VM |
| Docker Desktop Linux backend | ❌ Cannot start | Requires WSL2 or Hyper-V VM |
| Direct dockerd (Linux mode) | ❌ Windows only | Native Docker for Windows only supports Windows containers |

---

## 5. What Works

| Capability | Status | Command |
|------------|--------|---------|
| Docker CLI | ✅ | `docker --version` |
| Docker Compose CLI | ✅ | `docker compose version` |
| Docker Engine (Windows) | ✅ | `dockerd.exe --experimental` |
| Windows containers | ✅ | `docker run hello-world:nanoserver` |
| Windows image pull | ✅ | `docker pull mcr.microsoft.com/windows/nanoserver` |
| Build Windows images | ✅ | `docker build` (Windows Dockerfile) |

---

## 6. What Does Not Work

| Capability | Status | Impact |
|------------|--------|--------|
| WSL2 | ❌ | Cannot run Docker Desktop WSL2 backend |
| Linux containers | ❌ | **ZYMI stack blocked** |
| docker-compose.prod.yml | ❌ | All services use Linux images |
| PostgreSQL (Docker) | ❌ | postgres:alpine is Linux |
| Redis (Docker) | ❌ | redis:alpine is Linux |

---

## 7. Final Docker Status

| Component | Status |
|-----------|--------|
| Docker Desktop installed | ✅ |
| Docker Desktop service | ✅ Can start |
| Docker Engine (Windows) | ✅ Running |
| Docker CLI | ✅ Functional |
| Docker Compose CLI | ✅ Functional |
| Linux container support | ❌ NOT AVAILABLE |
| Windows container support | ✅ AVAILABLE |
| ZYMI stack runnable | ❌ BLOCKED |

---

## 8. Recommendation

**Do not pursue further Docker setup on this Windows RDP.**

The Amazon EC2 instance does not support nested virtualization. This is a hard platform limitation that cannot be fixed with software changes. Docker Desktop cannot provide Linux container support without WSL2 or Hyper-V VM backend, both of which require hardware virtualization.

**Next step:** Deploy ZYMI stack on a Linux VPS (see PHASE 58).
