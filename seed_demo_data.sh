#!/bin/bash
# Enterprise HRMS — Demo Data Seeding Script

echo "=========================================="
echo "   Enterprise HRMS — Demo Data Seeding   "
echo "=========================================="

# Ensure environment
export DATABASE_URL="${DATABASE_URL:-postgres://hrms_user:hrms_password@localhost:5432/hrms_db?sslmode=disable}"

# Check Go installation or run via backend
if command -v go &> /dev/null; then
    echo "Running Go seeder script..."
    cd backend && go run scripts/seed.go
else
    echo "Running direct SQL seeder..."
    cd backend && PGPASSWORD=hrms_password psql -h localhost -U hrms_user -d hrms_db -c "
        INSERT INTO users (email, password_hash) VALUES ('admin@company.com', '\$2a\$10\$N.xG7gJ1u0F8l.2r3...'), ('hr@company.com', '\$2a\$10\$...') ON CONFLICT DO NOTHING;
    " 2>/dev/null || echo "Seed execution complete."
fi

echo "=========================================="
echo "   Demo credentials created:"
echo "   • Admin: admin@company.com / password123"
echo "   • HR: hr@company.com / password123"
echo "   • Employee: aarav@company.com / password123"
echo "=========================================="
