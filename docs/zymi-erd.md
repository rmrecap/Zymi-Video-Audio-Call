# ZYMI Entity-Relationship Diagram (ERD)

Based on the technical features flow and schema planning, here is the comprehensive Entity-Relationship Diagram for the ZYMI application, organized into three core modules.

```mermaid
erDiagram
    %% ==========================================
    %% MODULE 1: User & Auth
    %% ==========================================
    USERS {
        UUID id PK
        VARCHAR email UK
        VARCHAR phone_normalized UK
        VARCHAR password_hash
        VARCHAR display_name
        VARCHAR avatar_url
        VARCHAR status "Enum: pending, verified, banned"
        GEOMETRY last_location "Point, 4326"
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    OTP_TOKENS {
        UUID id PK
        UUID user_id FK
        VARCHAR token_hash
        VARCHAR type "Enum: email_verify, password_reset"
        TIMESTAMP expires_at
    }

    BLOCKED_USERS {
        UUID blocker_id PK, FK
        UUID blocked_id PK, FK
        TIMESTAMP created_at
    }

    USERS ||--o{ OTP_TOKENS : "generates"
    USERS ||--o{ BLOCKED_USERS : "blocks"
    USERS ||--o{ BLOCKED_USERS : "is blocked by"

    %% ==========================================
    %% MODULE 2: Messaging & Status
    %% ==========================================
    GROUPS {
        UUID id PK
        VARCHAR name
        TEXT description
        UUID created_by FK
        TIMESTAMP created_at
    }

    GROUP_MEMBERS {
        UUID group_id PK, FK
        UUID user_id PK, FK
        VARCHAR role "Enum: admin, member"
        TIMESTAMP joined_at
    }

    MESSAGES {
        UUID id PK
        UUID sender_id FK
        UUID receiver_id FK "Nullable for group chat"
        UUID group_id FK "Nullable for 1-on-1 chat"
        TEXT content
        VARCHAR status "Enum: sent, delivered, seen, failed"
        TIMESTAMP created_at
        TIMESTAMP delivered_at
        TIMESTAMP seen_at
    }

    USERS ||--o{ GROUPS : "creates"
    USERS ||--o{ GROUP_MEMBERS : "joins"
    GROUPS ||--o{ GROUP_MEMBERS : "includes"
    
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ MESSAGES : "receives 1-on-1"
    GROUPS ||--o{ MESSAGES : "contains"

    %% ==========================================
    %% MODULE 3: WebRTC Calls & Connectivity
    %% ==========================================
    CALL_HISTORY {
        UUID id PK
        UUID caller_id FK
        UUID receiver_id FK "Nullable for group calls"
        UUID group_id FK "Nullable for 1-on-1 calls"
        VARCHAR call_type "Enum: audio, video"
        VARCHAR status "Enum: initiated, completed, missed, rejected, dropped"
        INT duration_seconds
        TIMESTAMP started_at
        TIMESTAMP ended_at
    }

    USERS ||--o{ CALL_HISTORY : "initiates"
    USERS ||--o{ CALL_HISTORY : "receives 1-on-1"
    GROUPS ||--o{ CALL_HISTORY : "hosts"
```
