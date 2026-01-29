-- ========================================
-- FILE: postgres/init/01-init.sql
-- Enhanced Database Schema
-- ========================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with enhanced fields
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    reset_token VARCHAR(255),
    api_key VARCHAR(255),
    phone_number VARCHAR(20),
    address TEXT,
    credit_card VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(id),
    price DECIMAL(10,2) DEFAULT 0.00,
    category VARCHAR(100),
    duration_hours INTEGER DEFAULT 0,
    level VARCHAR(20) DEFAULT 'beginner',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Assignments table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_score INTEGER DEFAULT 100,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id),
    student_id INTEGER REFERENCES users(id),
    content TEXT,
    score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test users
INSERT INTO users (username, email, password, role, phone_number, address) VALUES
('admin', 'admin@scaler.com', 'admin123', 'admin', '555-0001', '123 Admin St'),
('instructor1', 'instructor@scaler.com', 'instructor123', 'instructor', '555-0002', '456 Teacher Ave'),
('student1', 'student1@scaler.com', 'student123', 'student', '555-0003', '789 Student Ln'),
('student2', 'student2@scaler.com', 'student123', 'student', '555-0004', '321 Learn Rd'),
('student3', 'student3@scaler.com', 'student123', 'student', '555-0005', '654 Study Blvd');

-- Insert test courses
INSERT INTO courses (title, description, instructor_id, price, category, duration_hours, level) VALUES
('API Security Fundamentals', 'Learn API security basics and OWASP API Top 10', 2, 99.99, 'Security', 20, 'beginner'),
('Advanced Penetration Testing', 'Master pentesting skills with real-world scenarios', 2, 199.99, 'Security', 40, 'advanced'),
('Web Application Security', 'Comprehensive guide to securing web applications', 2, 149.99, 'Security', 30, 'intermediate'),
('Ethical Hacking Essentials', 'Introduction to ethical hacking and bug bounty', 2, 129.99, 'Security', 25, 'beginner'),
('Secure Coding Practices', 'Write secure code from the ground up', 2, 179.99, 'Development', 35, 'intermediate');

-- Insert test products
INSERT INTO products (name, description, price, stock, category) VALUES
('Premium Membership', 'Access to all courses and premium features', 499.99, 999, 'Membership'),
('Certification Exam', 'Get certified in API Security', 99.99, 500, 'Certification'),
('Study Materials Bundle', 'Complete study pack with videos and labs', 29.99, 100, 'Materials'),
('1-on-1 Mentorship (1 hour)', 'Personal mentorship session with expert', 150.00, 50, 'Service'),
('Security Tools Package', 'Essential security testing tools', 79.99, 200, 'Software');

-- Insert test enrollments
INSERT INTO enrollments (student_id, course_id, status, progress) VALUES
(3, 1, 'active', 50),
(3, 2, 'active', 25),
(4, 1, 'active', 75),
(5, 3, 'completed', 100);

-- Insert test assignments
INSERT INTO assignments (course_id, title, description, max_score, due_date) VALUES
(1, 'SQL Injection Lab', 'Identify and exploit SQL injection vulnerabilities', 100, CURRENT_TIMESTAMP + INTERVAL '7 days'),
(1, 'BOLA Assessment', 'Find and exploit Broken Object Level Authorization', 100, CURRENT_TIMESTAMP + INTERVAL '14 days'),
(2, 'Full Penetration Test', 'Complete penetration test of vulnerable application', 200, CURRENT_TIMESTAMP + INTERVAL '21 days');

-- Insert test submissions
INSERT INTO submissions (assignment_id, student_id, content, score, feedback) VALUES
(1, 3, 'Successfully identified SQL injection in login form', 95, 'Excellent work!'),
(2, 3, 'Found BOLA in user profile endpoint', 85, 'Good findings, missed some edge cases'),
(1, 4, 'Completed SQL injection lab', 100, 'Perfect!');

-- Insert test orders
INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address) VALUES
(3, 99.99, 'paid', 'credit_card', '789 Student Ln'),
(4, 199.99, 'pending', 'paypal', '321 Learn Rd'),
(5, 29.99, 'paid', 'credit_card', '654 Study Blvd');

-- Insert test order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 2, 1, 99.99),
(2, 1, 1, 199.99),
(3, 3, 1, 29.99);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Add some intentional vulnerabilities for testing

-- Vulnerable stored procedure (SQL Injection)
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
    id INTEGER,
    username VARCHAR(50),
    email VARCHAR(100),
    role VARCHAR(20)
) AS $$
BEGIN
    -- VULN: SQL Injection
    RETURN QUERY EXECUTE 
        'SELECT id, username, email, role FROM users WHERE username LIKE ''%' || search_term || '%''';
END;
$$ LANGUAGE plpgsql;

-- Vulnerable view exposing sensitive data
CREATE VIEW user_details AS
SELECT 
    id,
    username,
    email,
    password,  -- VULN: Exposing passwords
    role,
    phone_number,
    address,
    credit_card,  -- VULN: Exposing credit cards
    created_at
FROM users;

-- Grant permissions (vulnerable - too permissive)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scaler_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scaler_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO scaler_admin;
