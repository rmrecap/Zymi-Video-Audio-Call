#!/bin/bash
set -e

echo "=== Step 1: Check PostgreSQL status ==="
pg_isready

echo "=== Step 2: Create ZYMI user ==="
su - postgres -c "psql -c \"CREATE USER zymi_user WITH PASSWORD 'admin123' CREATEDB;\""
echo "Create user exit code: $?"

echo "=== Step 3: Create ZYMI database ==="
su - postgres -c "psql -c \"CREATE DATABASE zymi_db OWNER zymi_user;\""
echo "Create DB exit code: $?"

echo "=== Step 4: List databases ==="
su - postgres -c "psql -l"

echo "=== Step 5: Configure listen_addresses ==="
if grep -q "listen_addresses" /etc/postgresql/18/main/postgresql.conf; then
  sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/18/main/postgresql.conf
  sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/18/main/postgresql.conf
fi

echo "=== Step 6: Add pg_hba entries ==="
echo "host all all 172.0.0.0/8 md5" >> /etc/postgresql/18/main/pg_hba.conf
echo "host all all 10.0.0.0/8 md5" >> /etc/postgresql/18/main/pg_hba.conf
echo "host all all 192.168.0.0/16 md5" >> /etc/postgresql/18/main/pg_hba.conf
echo "host all all 127.0.0.1/32 md5" >> /etc/postgresql/18/main/pg_hba.conf

echo "=== Step 7: Reload PostgreSQL ==="
pg_ctlcluster 18 main reload

echo "=== Step 8: Verify connection ==="
su - postgres -c "psql -c 'SELECT version();'"

echo "=== ALL DONE ==="
