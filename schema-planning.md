# ZYMI Database Schema Planning

**Role:** Lead Database Architect  
**Objective:** Design a production-grade, horizontally scalable PostgreSQL schema supporting real-time communication, geospatial discovery, and high-concurrency messaging.

---

## 1. Core Configuration & Extensions

To support global uniqueness and high-performance geospatial queries, the following PostgreSQL extensions must be enabled:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";       -- For GEOMETRY type and spatial indexing
```

---

## 2. Logical Creation Sequence

The schema must be established in the following order to respect foreign key constraints:

1.  **`users`**: The root entity for all interactions.
2.  **`otp_tokens`**: Dependent on users for authentication flow.
3.  **`messages`**: Dependent on two users (sender/receiver).
4.  **`call_history`**: Dependent on two users (caller/callee).
5.  **`blocked_users`**: Intersection table for user privacy/moderation.

---

## 3. Detailed Table Specifications

### 3.1 Table: `users`
The master record for all ZYMI participants, including real-time location data.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Global unique identifier. |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Primary login identifier. |
| `phone_normalized` | VARCHAR(20) | UNIQUE, NOT NULL | Formatted phone for internal lookup. |
| `password_hash` | TEXT | NOT NULL | Bcrypt hashed password. |
| `display_name` | VARCHAR(100) | NOT NULL | User's public name. |
| `avatar_url` | TEXT | | Cloud storage link to profile image. |
| `status` | VARCHAR(20) | DEFAULT 'pending' | 'pending', 'verified', 'banned'. |
| `last_location` | GEOMETRY(Point, 4326) | | PostGIS point for "Nearby" feature. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time. |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last profile update. |

**Indexing:**
*   `GIST(last_location)`: Critical for high-performance radius searches.
*   `B-TREE(email)`: For fast login lookups.
*   `B-TREE(phone_normalized)`: For peer discovery by contact list.

---

### 3.2 Table: `otp_tokens`
Handles the short-lived tokens for registration and password resets.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique token ID. |
| `user_id` | UUID | FK -> users.id, NOT NULL | Associated user. |
| `token_hash` | TEXT | NOT NULL | Encrypted OTP code. |
| `type` | VARCHAR(20) | NOT NULL | 'email_verification', 'password_reset'. |
| `expires_at` | TIMESTAMP | NOT NULL | 5-minute expiry constraint. |

**Relationship:** 1:N (A user can have multiple tokens, but only the latest valid one is typically used).  
**Indexing:** `B-TREE(user_id, expires_at)`.

---

### 3.3 Table: `messages`
The high-concurrency log of all private communications.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique message ID. |
| `sender_id` | UUID | FK -> users.id, NOT NULL | The message author. |
| `receiver_id` | UUID | FK -> users.id, NOT NULL | The message recipient. |
| `content` | TEXT | NOT NULL | The message body. |
| `status` | VARCHAR(20) | DEFAULT 'sent' | 'sent', 'delivered', 'seen', 'failed'. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Time sent. |
| `delivered_at` | TIMESTAMP | | Time received by recipient's device. |
| `seen_at` | TIMESTAMP | | Time opened by recipient. |

**Relationship:** 1:N (Users participate in many messages).  
**Indexing:**
*   `B-TREE(sender_id, receiver_id)`: For fetching conversation history.
*   `B-TREE(created_at)`: For sorting chat threads.

---

### 3.4 Table: `call_history`
Tracks the lifecycle of WebRTC media sessions.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique call session ID. |
| `caller_id` | UUID | FK -> users.id, NOT NULL | The initiator. |
| `receiver_id` | UUID | FK -> users.id, NOT NULL | The target peer. |
| `status` | VARCHAR(20) | NOT NULL | 'completed', 'missed', 'rejected', 'dropped'. |
| `duration_seconds` | INT | DEFAULT 0 | Total call time in seconds. |
| `started_at` | TIMESTAMP | DEFAULT NOW() | Call initiation time. |
| `ended_at` | TIMESTAMP | | Call termination time. |

**Relationship:** 1:N (Users participate in many calls).  
**Indexing:** `B-TREE(caller_id, receiver_id, started_at)`.

---

### 3.5 Table: `blocked_users`
Manages user-level privacy and moderation.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique record ID. |
| `blocker_id` | UUID | FK -> users.id, NOT NULL | User performing the block. |
| `blocked_id` | UUID | FK -> users.id, NOT NULL | User being blocked. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp of the block. |

**Relationship:** N:M (Users can block many, and be blocked by many).  
**Indexing:** `UNIQUE(blocker_id, blocked_id)`: Prevents duplicate block records.

---

## 4. Performance & Scalability Strategy

1.  **UUID v4 vs v7:** While v4 is standard, consider UUID v7 if timestamp-sorting of primary keys is required for better B-tree index performance.
2.  **GIST Indexes:** The `last_location` column must use a GIST index to allow PostGIS to perform `ST_DWithin` queries in logarithmic time rather than linear table scans.
3.  **Partitioning:** For the `messages` and `call_history` tables, consider **Range Partitioning** by `created_at` (e.g., monthly partitions) as the dataset grows into the millions.
4.  **Soft Deletes:** Implement a `deleted_at` column in `users` and `messages` if regulatory compliance (GDPR/CCPA) requires data retention for a period after "deletion."
