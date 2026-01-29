# ========================================
# FILE: app.py - Enhanced Course Service
# ========================================
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import requests
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # VULN: Allows all origins

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://scaler_admin:VulnerablePassword123!@postgres:5432/scaler_db')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

# ENDPOINT 1: List All Courses
# VULN: No rate limiting, Excessive data exposure
@app.route('/api/v1/courses', methods=['GET'])
def get_courses():
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    limit = request.args.get('limit', '1000')  # VULN: No max limit
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    if search:
        # VULN: SQL Injection
        query = f"SELECT * FROM courses WHERE title LIKE '%{search}%' LIMIT {limit}"
        cur.execute(query)
    else:
        cur.execute(f"SELECT * FROM courses LIMIT {limit}")
    
    courses = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify([dict(row) for row in courses]), 200

# ENDPOINT 2: Get Single Course
# VULN: SQL Injection via parameter
@app.route('/api/v1/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # VULN: SQL Injection
    query = f"SELECT * FROM courses WHERE id = {course_id}"
    cur.execute(query)
    course = cur.fetchone()
    cur.close()
    conn.close()
    
    if course:
        return jsonify(dict(course)), 200
    return jsonify({'error': 'Course not found'}), 404

# ENDPOINT 3: Create Course
# VULN: BFLA - No instructor/admin check
@app.route('/api/v1/courses', methods=['POST'])
def create_course():
    data = request.get_json()
    
    # VULN: No authentication check
    # VULN: No input validation
    title = data.get('title')
    description = data.get('description')
    instructor_id = data.get('instructor_id', 1)
    price = data.get('price', 0.0)
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO courses (title, description, instructor_id, price) VALUES (%s, %s, %s, %s) RETURNING id",
        (title, description, instructor_id, price)
    )
    course_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'id': course_id,
        'title': title,
        'description': description,
        'instructor_id': instructor_id,
        'price': price,
        'message': 'Course created successfully'
    }), 201

# ENDPOINT 4: Update Course
# VULN: BOLA - Can update any course
@app.route('/api/v1/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    data = request.get_json()
    
    # VULN: No authorization check
    conn = get_db_connection()
    cur = conn.cursor()
    
    # VULN: Mass assignment
    if 'title' in data:
        cur.execute("UPDATE courses SET title = %s WHERE id = %s", (data['title'], course_id))
    if 'description' in data:
        cur.execute("UPDATE courses SET description = %s WHERE id = %s", (data['description'], course_id))
    if 'price' in data:
        # VULN: Can manipulate price
        cur.execute("UPDATE courses SET price = %s WHERE id = %s", (data['price'], course_id))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'message': 'Course updated successfully'}), 200

# ENDPOINT 5: Delete Course
# VULN: BFLA - No admin check
@app.route('/api/v1/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    # VULN: No authorization check
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM courses WHERE id = %s", (course_id,))
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'message': 'Course deleted successfully'}), 200

# ENDPOINT 6: Enroll in Course
# VULN: No payment verification, Can enroll anyone
@app.route('/api/v1/enrollments', methods=['POST'])
def create_enrollment():
    data = request.get_json()
    student_id = data.get('student_id')
    course_id = data.get('course_id')
    
    # VULN: No authentication check
    # VULN: No payment verification
    # VULN: Can enroll other users
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if already enrolled
    cur.execute(
        "SELECT id FROM enrollments WHERE student_id = %s AND course_id = %s",
        (student_id, course_id)
    )
    existing = cur.fetchone()
    
    if existing:
        cur.close()
        conn.close()
        return jsonify({'error': 'Already enrolled'}), 400
    
    cur.execute(
        "INSERT INTO enrollments (student_id, course_id, status) VALUES (%s, %s, %s) RETURNING id",
        (student_id, course_id, 'active')
    )
    enrollment_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'id': enrollment_id,
        'student_id': student_id,
        'course_id': course_id,
        'status': 'active',
        'message': 'Enrolled successfully'
    }), 201

# ENDPOINT 7: Get Enrollment
# VULN: BOLA - Can view any enrollment
@app.route('/api/v1/enrollments/<int:enrollment_id>', methods=['GET'])
def get_enrollment(enrollment_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM enrollments WHERE id = %s", (enrollment_id,))
    enrollment = cur.fetchone()
    cur.close()
    conn.close()
    
    if enrollment:
        return jsonify(dict(enrollment)), 200
    return jsonify({'error': 'Enrollment not found'}), 404

# ENDPOINT 8: Get Student Enrollments
# VULN: BOLA - Can view any student's enrollments
@app.route('/api/v1/students/<int:student_id>/enrollments', methods=['GET'])
def get_student_enrollments(student_id):
    limit = request.args.get('limit', '1000')  # VULN: No rate limiting
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # VULN: SQL injection
    query = f"SELECT e.*, c.title, c.price FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.student_id = {student_id} LIMIT {limit}"
    cur.execute(query)
    enrollments = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify([dict(row) for row in enrollments]), 200

# ENDPOINT 9: Cancel Enrollment
# VULN: BOLA - Can cancel anyone's enrollment
@app.route('/api/v1/enrollments/<int:enrollment_id>/cancel', methods=['PUT'])
def cancel_enrollment(enrollment_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE enrollments SET status = %s WHERE id = %s",
        ('cancelled', enrollment_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'message': 'Enrollment cancelled'}), 200

# ENDPOINT 10: Create Assignment
# VULN: BFLA - No instructor check
@app.route('/api/v1/courses/<int:course_id>/assignments', methods=['POST'])
def create_assignment(course_id):
    data = request.get_json()
    
    # VULN: No authorization check
    title = data.get('title')
    description = data.get('description')
    max_score = data.get('max_score', 100)
    due_date = data.get('due_date')
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO assignments (course_id, title, description, max_score, due_date) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (course_id, title, description, max_score, due_date)
    )
    assignment_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'id': assignment_id,
        'course_id': course_id,
        'title': title,
        'message': 'Assignment created'
    }), 201

# ENDPOINT 11: Submit Assignment
# VULN: Can submit for other students
@app.route('/api/v1/assignments/<int:assignment_id>/submit', methods=['POST'])
def submit_assignment(assignment_id):
    data = request.get_json()
    student_id = data.get('student_id')
    content = data.get('content')
    
    # VULN: No authentication
    # VULN: Can submit for other students
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO submissions (assignment_id, student_id, content) VALUES (%s, %s, %s) RETURNING id",
        (assignment_id, student_id, content)
    )
    submission_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'id': submission_id,
        'assignment_id': assignment_id,
        'student_id': student_id,
        'message': 'Assignment submitted'
    }), 201

# ENDPOINT 12: Get Student Grades
# VULN: BOLA - Can view any student's grades
@app.route('/api/v1/students/<int:student_id>/grades', methods=['GET'])
def get_student_grades(student_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT s.id, a.title, s.score, s.submitted_at, c.title as course_title, a.max_score
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        JOIN courses c ON a.course_id = c.id
        WHERE s.student_id = %s
    """, (student_id,))
    grades = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify([dict(row) for row in grades]), 200

# ENDPOINT 13: Update Grade
# VULN: BFLA - No instructor/admin check
@app.route('/api/v1/submissions/<int:submission_id>/grade', methods=['PUT'])
def update_grade(submission_id):
    data = request.get_json()
    score = data.get('score')
    
    # VULN: No authorization check - anyone can grade
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE submissions SET score = %s WHERE id = %s",
        (score, submission_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'message': 'Grade updated successfully'}), 200

# ENDPOINT 14: Get Course Statistics
# VULN: Information disclosure
@app.route('/api/v1/courses/<int:course_id>/stats', methods=['GET'])
def get_course_stats(course_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cur.execute("SELECT COUNT(*) as total_enrollments FROM enrollments WHERE course_id = %s", (course_id,))
    enrollments = cur.fetchone()['total_enrollments']
    
    cur.execute("SELECT AVG(s.score) as avg_score FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.course_id = %s", (course_id,))
    avg_score = cur.fetchone()['avg_score']
    
    cur.close()
    conn.close()
    
    # VULN: Exposing sensitive statistics
    return jsonify({
        'course_id': course_id,
        'total_enrollments': enrollments,
        'average_score': float(avg_score) if avg_score else 0
    }), 200

# ENDPOINT 15: Bulk Enroll
# VULN: No rate limiting, Mass enrollment
@app.route('/api/v1/enrollments/bulk', methods=['POST'])
def bulk_enroll():
    data = request.get_json()
    enrollments = data.get('enrollments', [])
    
    # VULN: No rate limiting - can enroll unlimited users
    conn = get_db_connection()
    cur = conn.cursor()
    
    created = []
    for enrollment in enrollments:
        try:
            cur.execute(
                "INSERT INTO enrollments (student_id, course_id, status) VALUES (%s, %s, %s) RETURNING id",
                (enrollment['student_id'], enrollment['course_id'], 'active')
            )
            created.append(cur.fetchone()[0])
        except:
            pass
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': f'{len(created)} enrollments created',
        'enrollment_ids': created
    }), 201

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK", "service": "course"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081, debug=True)  # VULN: Debug mode on
