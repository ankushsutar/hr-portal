#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "========================================"
echo "      HRMS DATABASE RESET SCRIPT        "
echo "========================================"

FORCE=0
DRY_RUN=0

for arg in "$@"; do
    case $arg in
        --force) FORCE=1 ;;
        --dry-run) DRY_RUN=1 ;;
    esac
done

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${POSTGRES_PORT:-5432}
if [ -d "$PWD/.pgdata_local" ]; then
    DB_PORT=5433
fi
DB_NAME=${DB_NAME:-hrms_db}
DB_USER=${DB_USER:-hrms_user}
APP_ENV=${APP_ENV:-development}

# Display Info
echo "Environment:   $APP_ENV"
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "========================================"

# Safety validation
if [[ "$APP_ENV" == "production" || "$APP_ENV" == "prod" ]]; then
    echo "ERROR: Refusing to reset a production environment!"
    exit 1
fi

if [[ "$DB_HOST" != "localhost" && "$DB_HOST" != "127.0.0.1" ]]; then
    echo "WARNING: Database is NOT on localhost. Are you sure you want to proceed?"
fi

if [[ $DRY_RUN -eq 1 ]]; then
    echo "[DRY RUN] Would connect to postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    echo "[DRY RUN] Would drop and recreate schema 'public'"
    echo "[DRY RUN] Would execute migrations in backend/migrations/*.up.sql"
    echo "[DRY RUN] Would verify schema creation."
    exit 0
fi

if [[ $FORCE -eq 0 ]]; then
    echo "WARNING: THIS WILL DELETE ALL DATA IN THE LOCAL/TEST DATABASE."
    read -p "Are you sure you want to proceed? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Check PSQL availability
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql is required but not installed or not in PATH."
    exit 1
fi

echo "[1/4] Dropping and recreating public schema..."
PGPASSWORD=${hrms_password:-hrms_password} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO $DB_USER; GRANT ALL ON SCHEMA public TO public;" > /dev/null

echo "[2/4] Running sequential migrations..."
MIGRATION_DIR="backend/migrations"
if [ ! -d "$MIGRATION_DIR" ]; then
    echo "ERROR: Migration directory $MIGRATION_DIR not found!"
    exit 1
fi

for file in $(ls $MIGRATION_DIR/*.up.sql | sort); do
    echo "  -> Applying $(basename $file)..."
    PGPASSWORD=${hrms_password:-hrms_password} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$file" > /dev/null
done

# Apply standalone schema fixes that aren't natively in the numbered sequence
if [ -f "fix_leave_schema.sql" ]; then
    echo "  -> Applying fix_leave_schema.sql..."
    PGPASSWORD=${hrms_password:-hrms_password} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "fix_leave_schema.sql" > /dev/null
fi
if [ -f "create_view.sql" ]; then
    echo "  -> Applying create_view.sql..."
    PGPASSWORD=${hrms_password:-hrms_password} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "create_view.sql" > /dev/null
fi

echo "[3/4] Verifying Schema..."
TABLES=$(PGPASSWORD=${hrms_password:-hrms_password} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")
echo "  -> Created $(echo $TABLES | xargs) tables/views in public schema."

REQUIRED_TABLES=("users" "employees" "departments" "roles" "attendance_daily_status")
for table in "${REQUIRED_TABLES[@]}"; do
    EXISTS=$(PGPASSWORD=${hrms_password:-hrms_password} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '$table');")
    if [[ "$(echo $EXISTS | xargs)" != "t" ]]; then
        echo "ERROR: DATABASE RESET FAILED. Required table '$table' is missing."
        exit 1
    fi
done

echo "[4/4] DATABASE RESET SUCCESSFUL"
echo "========================================"
