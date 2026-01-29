// ========================================
// FILE: web-ui/src/App.js
// Enhanced Web UI with All Features
// ========================================
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './index.css';

// VULN: Hardcoded API endpoints exposed in frontend
const API_BASE = '';
const API_KEY = 'scaler_vulnerable_key_12345'; // VULN: Exposed API key

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // VULN: Storing user data in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Navigation user={user} setUser={setUser} />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/courses" element={<Courses user={user} />} />
            <Route path="/courses/:id" element={<CourseDetail user={user} />} />
            <Route path="/my-courses" element={<MyCourses user={user} />} />
            <Route path="/grades" element={<Grades user={user} />} />
            <Route path="/shop" element={<Shop user={user} />} />
            <Route path="/cart" element={<Cart user={user} />} />
            <Route path="/orders" element={<Orders user={user} />} />
            <Route path="/forums" element={<Forums />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/admin" element={<AdminPanel user={user} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function Navigation({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="nav">
      	<img src="/logo.png" alt="Scaler Logo" className="logo" />
	<ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/courses">Courses</Link></li>
        {user && <li><Link to="/my-courses">My Courses</Link></li>}
        {user && <li><Link to="/grades">Grades</Link></li>}
        <li><Link to="/shop">Shop</Link></li>
        <li><Link to="/forums">Forums</Link></li>
        {user ? (
          <>
            <li><Link to={`/profile/${user.id}`}>Profile</Link></li>
            {user.role === 'admin' && <li><Link to="/admin">Admin</Link></li>}
            <li><button onClick={handleLogout} className="btn-link">Logout ({user.username})</button></li>
          </>
        ) : (
          <li><Link to="/login">Login</Link></li>
        )}
      </ul>
    </nav>
  );
}

function Home() {
  return (
    <div>
      <div className="hero">
        <h1>Welcome to Scaler Vulnersity</h1>
        <p>Learn API Security Through Hands-On Practice</p>
        <p style={{marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8}}>
          ⚠️ This is an intentionally vulnerable application for educational purposes
        </p>
      </div>
      <div className="card">
        <h2>About Scaler Vulnersity</h2>
        <p>Master API security by exploiting real vulnerabilities in a safe environment.</p>
        <h3>What You'll Learn:</h3>
        <ul style={{marginLeft: '2rem', marginTop: '1rem'}}>
          <li>OWASP API Top 10 Vulnerabilities</li>
          <li>Broken Object Level Authorization (BOLA)</li>
          <li>SQL Injection Techniques</li>
          <li>JWT Security Issues</li>
          <li>Business Logic Flaws</li>
          <li>And much more...</li>
        </ul>
        <div style={{marginTop: '2rem'}}>
          <Link to="/courses" className="btn">Explore Courses</Link>
        </div>
      </div>
    </div>
  );
}

function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
        username,
        password
      });
      
      // VULN: Storing JWT in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setUser(response.data.user);
      setMessage('Login successful!');
      
      // VULN: Logging sensitive data to console
      console.log('Login response:', response.data);
      
      setTimeout(() => navigate('/courses'), 1000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          className="input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn">Login</button>
      </form>
      {message && <p className={message.includes('successful') ? 'success' : 'error'}>{message}</p>}
      <div style={{marginTop: '1rem'}}>
        <p>Don't have an account? <Link to="/register">Register here</Link></p>
        <p><Link to="/forgot-password">Forgot password?</Link></p>
        <div style={{marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '5px'}}>
          <strong>Test Credentials:</strong>
          <p>Student: student1 / student123</p>
          <p>Instructor: instructor1 / instructor123</p>
          <p>Admin: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student' // VULN: Exposed role field
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/api/v1/auth/register`, formData);
      setMessage('Registration successful! Password: ' + response.data.password); // VULN
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="card">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          className="input"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        {/* VULN: Exposing role selection */}
        <select 
          className="input"
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="btn">Register</button>
      </form>
      {message && <p className="success">{message}</p>}
    </div>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/api/v1/auth/forgot-password`, { email });
      setMessage(response.data.message);
      setResetToken(response.data.resetToken); // VULN: Exposing token
    } catch (error) {
      setMessage(error.response?.data?.error || 'Request failed');
    }
  };

  return (
    <div className="card">
      <h2>Forgot Password</h2>
      <form onSubmit={handleForgotPassword}>
        <input
          type="email"
          className="input"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn">Send Reset Link</button>
      </form>
      {message && <p className="success">{message}</p>}
      {resetToken && (
        <div style={{marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '5px'}}>
          <p><strong>Reset Token:</strong> {resetToken}</p>
          <p><Link to={`/reset-password?token=${resetToken}`}>Reset Password</Link></p>
        </div>
      )}
    </div>
  );
}

function ResetPassword() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/api/v1/auth/reset-password`, {
        resetToken: token,
        newPassword
      });
      setMessage('Password reset successful!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Reset failed');
    }
  };

  return (
    <div className="card">
      <h2>Reset Password</h2>
      <form onSubmit={handleResetPassword}>
        <input
          className="input"
          placeholder="Reset Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <input
          type="password"
          className="input"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn">Reset Password</button>
      </form>
      {message && <p className="success">{message}</p>}
    </div>
  );
}

function Courses({ user }) {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const url = search 
        ? `${API_BASE}/api/v1/courses?search=${search}` 
        : `${API_BASE}/api/v1/courses`;
      const response = await axios.get(url);
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/v1/enrollments`, {
        student_id: user.id,
        course_id: courseId
      });
      alert('Enrolled successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Enrollment failed');
    }
  };

  return (
    <div>
      <h2 style={{color: 'white', marginBottom: '1rem'}}>Available Courses</h2>
      <div className="card">
        <input
          className="input"
          placeholder="Search courses... (try SQL injection: ' OR '1'='1)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && fetchCourses()}
        />
        <button onClick={fetchCourses} className="btn">Search</button>
      </div>
      {courses.map(course => (
        <div key={course.id} className="card">
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <p><strong>Price: ${course.price}</strong></p>
          <p>Level: {course.level} | Duration: {course.duration_hours} hours</p>
          <div style={{display: 'flex', gap: '1rem'}}>
            <Link to={`/courses/${course.id}`} className="btn">View Details</Link>
            <button onClick={() => handleEnroll(course.id)} className="btn">Enroll Now</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/courses/${id}`);
      setCourse(response.data);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    }
  };

  if (!course) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <p><strong>Price: ${course.price}</strong></p>
      <p>Instructor ID: {course.instructor_id}</p>
      <p>Category: {course.category}</p>
      <p>Level: {course.level}</p>
      <p>Duration: {course.duration_hours} hours</p>
    </div>
  );
}

function MyCourses({ user }) {
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/students/${user.id}/enrollments`);
      setEnrollments(response.data);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    }
  };

  if (!user) return <div className="card">Please login first</div>;

  return (
    <div>
      <h2 style={{color: 'white'}}>My Courses</h2>
      {enrollments.map(enrollment => (
        <div key={enrollment.id} className="card">
          <h3>{enrollment.title}</h3>
          <p>Progress: {enrollment.progress}%</p>
          <p>Status: {enrollment.status}</p>
          <p>Price: ${enrollment.price}</p>
        </div>
      ))}
    </div>
  );
}

function Grades({ user }) {
  const [grades, setGrades] = useState([]);
  const [studentId, setStudentId] = useState(user?.id || '');

  useEffect(() => {
    if (studentId) {
      fetchGrades();
    }
  }, [studentId]);

  const fetchGrades = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/students/${studentId}/grades`);
      setGrades(response.data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    }
  };

  return (
    <div>
      <h2 style={{color: 'white'}}>Grades</h2>
      <div className="card">
        <input
          className="input"
          placeholder="Student ID (try viewing other students' grades)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <button onClick={fetchGrades} className="btn">View Grades</button>
      </div>
      {grades.map(grade => (
        <div key={grade.submission_id} className="card">
          <h3>{grade.course}: {grade.assignment}</h3>
          <p><strong>Score: {grade.score || 'Not graded'}</strong></p>
          <p>Submitted: {new Date(grade.submitted_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}

function Shop({ user }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleAddToCart = (product) => {
    // VULN: Storing cart in localStorage with client-side prices
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push({
      product_id: product.id,
      name: product.name,
      price: product.price, // VULN: Client-side price
      quantity: 1
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  return (
    <div>
      <h2 style={{color: 'white'}}>Shop</h2>
      {products.map(product => (
        <div key={product.id} className="card">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p><strong>${product.price}</strong></p>
          <p>Stock: {product.stock}</p>
          <button onClick={() => handleAddToCart(product)} className="btn">Add to Cart</button>
        </div>
      ))}
    </div>
  );
}

function Cart({ user }) {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(storedCart);
  }, []);

  const updatePrice = (index, newPrice) => {
    const updatedCart = [...cart];
    updatedCart[index].price = parseFloat(newPrice);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const createOrder = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/v1/orders`, {
        user_id: user.id,
        items: cart
      });
      alert('Order created! Order ID: ' + response.data.order_id);
      localStorage.removeItem('cart');
      navigate('/orders');
    } catch (error) {
      alert('Order failed: ' + error.message);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div>
      <h2 style={{color: 'white'}}>Shopping Cart</h2>
      {cart.length === 0 ? (
        <div className="card">Your cart is empty</div>
      ) : (
        <>
          {cart.map((item, index) => (
            <div key={index} className="card">
              <h3>{item.name}</h3>
              <p>Quantity: {item.quantity}</p>
              <div>
                <label>Price: $</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updatePrice(index, e.target.value)}
                  style={{width: '100px', marginLeft: '0.5rem'}}
                />
                <span style={{marginLeft: '0.5rem', color: '#999'}}>
                  (Edit price - VULN: Client-side price)
                </span>
              </div>
            </div>
          ))}
          <div className="card">
            <h3>Total: ${total.toFixed(2)}</h3>
            <button onClick={createOrder} className="btn">Checkout</button>
          </div>
        </>
      )}
    </div>
  );
}

function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState(user?.id || '');

  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/users/${userId}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  return (
    <div>
      <h2 style={{color: 'white'}}>Orders</h2>
      <div className="card">
        <input
          className="input"
          placeholder="User ID (try viewing other users' orders)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={fetchOrders} className="btn">View Orders</button>
      </div>
      {orders.map(order => (
        <div key={order.id} className="card">
          <h3>Order #{order.id}</h3>
          <p><strong>Total: ${order.total_amount}</strong></p>
          <p>Status: {order.status}</p>
          <p>Created: {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}

function Forums() {
  const [forums, setForums] = useState([]);

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/forums`);
      setForums(response.data);
    } catch (error) {
      console.error('Failed to fetch forums:', error);
    }
  };

  return (
    <div>
      <h2 style={{color: 'white'}}>Community Forums</h2>
      {forums.map(forum => (
        <div key={forum.id} className="card">
          <h3>{forum.title}</h3>
          <p>{forum.description}</p>
          <button className="btn">View Threads</button>
        </div>
      ))}
    </div>
  );
}

function Profile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/auth/users/${userId}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const updateProfile = async () => {
    try {
      await axios.put(`${API_BASE}/api/v1/auth/users/${userId}`, profile);
      alert('Profile updated!');
      setEditing(false);
    } catch (error) {
      alert('Update failed: ' + error.message);
    }
  };

  if (!profile) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2>User Profile</h2>
      {editing ? (
        <div>
          <input
            className="input"
            placeholder="Username"
            value={profile.username}
            onChange={(e) => setProfile({...profile, username: e.target.value})}
          />
          <input
            className="input"
            placeholder="Email"
            value={profile.email}
            onChange={(e) => setProfile({...profile, email: e.target.value})}
          />
          <select
            className="input"
            value={profile.role}
            onChange={(e) => setProfile({...profile, role: e.target.value})}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={updateProfile} className="btn">Save</button>
          <button onClick={() => setEditing(false)} className="btn">Cancel</button>
        </div>
      ) : (
        <div>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
          <p><strong>Password:</strong> {profile.password}</p>
          <button onClick={() => setEditing(true)} className="btn">Edit Profile</button>
        </div>
      )}
    </div>
  );
}

function AdminPanel({ user }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/auth/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="card">Access denied. Admin only.</div>;
  }

  return (
    <div>
      <h2 style={{color: 'white'}}>Admin Panel</h2>
      {stats && (
        <div className="card">
          <h3>Statistics</h3>
          <p>Total Orders: {stats.total_orders}</p>
          <p>Total Revenue: ${stats.total_revenue}</p>
          <p>Pending Orders: {stats.pending_orders}</p>
        </div>
      )}
      <div className="card">
        <h3>All Users</h3>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '2px solid #ddd'}}>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Password</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{borderBottom: '1px solid #eee'}}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
