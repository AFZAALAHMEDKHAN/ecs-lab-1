// ========================================
// FILE: AuthController.java
// ========================================
package com.scaler.identity;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*") // VULN: CORS misconfiguration
public class AuthController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    // ENDPOINT 1: User Registration
    // VULN: No input validation, Mass Assignment, Password exposure
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            // VULN: No password complexity validation
            // VULN: No email verification
            // VULN: Storing plain text password
            user.setRole("student"); // Default role
            User savedUser = userRepository.save(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("userId", savedUser.getId());
            response.put("username", savedUser.getUsername());
            response.put("password", savedUser.getPassword()); // VULN: Exposing password in response
            response.put("email", savedUser.getEmail());
            
            // Send welcome email
            sendWelcomeEmail(savedUser.getEmail(), savedUser.getUsername());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // VULN: Exposing stack trace
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("stackTrace", Arrays.toString(e.getStackTrace()));
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // ENDPOINT 2: User Login
    // VULN: No rate limiting, Weak authentication, Information disclosure
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        // VULN: SQL Injection possible if using native queries
        User user = userRepository.findByUsername(username);
        
        if (user == null) {
            // VULN: Information disclosure - revealing user doesn't exist
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        // VULN: Plain text password comparison
        if (!user.getPassword().equals(password)) {
            // VULN: Information disclosure - revealing password is wrong
            return ResponseEntity.status(401).body(Map.of("error", "Invalid password"));
        }
        
        // VULN: Weak JWT with predictable secret
        String token = Jwts.builder()
            .setSubject(user.getUsername())
            .claim("role", user.getRole())
            .claim("userId", user.getId())
            .claim("email", user.getEmail())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 24 hours
            .signWith(SignatureAlgorithm.HS256, jwtSecret) // VULN: Weak algorithm
            .compact();
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user); // VULN: Exposing full user object including password
        response.put("expiresIn", 86400);
        
        return ResponseEntity.ok(response);
    }
    
    // ENDPOINT 3: Forgot Password
    // VULN: User enumeration, Predictable reset tokens, No rate limiting
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        
        User user = userRepository.findByEmail(email);
        
        if (user == null) {
            // VULN: User enumeration - revealing user doesn't exist
            return ResponseEntity.status(404).body(Map.of("error", "Email not found"));
        }
        
        // VULN: Predictable reset token (just user ID encoded)
        String resetToken = Base64.getEncoder().encodeToString(
            (user.getId().toString() + ":" + System.currentTimeMillis()).getBytes()
        );
        
        // Store reset token (in production, this should be in DB with expiry)
        user.setResetToken(resetToken);
        userRepository.save(user);
        
        // Send reset email
        sendPasswordResetEmail(user.getEmail(), resetToken);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Password reset email sent");
        response.put("resetToken", resetToken); // VULN: Exposing reset token in response
        
        return ResponseEntity.ok(response);
    }
    
    // ENDPOINT 4: Reset Password
    // VULN: No token validation, Token reuse possible
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String resetToken = request.get("resetToken");
        String newPassword = request.get("newPassword");
        
        // VULN: No password complexity validation
        if (newPassword == null || newPassword.length() < 3) {
            return ResponseEntity.status(400).body(Map.of("error", "Password too short"));
        }
        
        // Find user by reset token
        User user = userRepository.findByResetToken(resetToken);
        
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Invalid reset token"));
        }
        
        // VULN: No token expiry check
        // VULN: Plain text password storage
        user.setPassword(newPassword);
        user.setResetToken(null); // Clear token (but no expiry validation)
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of(
            "message", "Password reset successfully",
            "newPassword", newPassword // VULN: Exposing new password
        ));
    }
    
    // ENDPOINT 5: Change Role
    // VULN: BFLA - No admin authorization check
    @PutMapping("/role")
    public ResponseEntity<?> changeRole(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        String newRole = request.get("role").toString();
        
        // VULN: No authorization check - anyone can change roles!
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        
        user.setRole(newRole);
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of(
            "message", "Role updated successfully",
            "userId", userId,
            "newRole", newRole
        ));
    }
    
    // ENDPOINT 6: Get User Profile
    // VULN: BOLA - Can access any user's profile
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        // VULN: No authentication check
        // VULN: No authorization check - can view any user
        User user = userRepository.findById(id).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        
        // VULN: Exposing sensitive data including password
        return ResponseEntity.ok(user);
    }
    
    // ENDPOINT 7: Update User Profile
    // VULN: BOLA, Mass Assignment
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        // VULN: No authentication check
        // VULN: Can update any user's profile
        User user = userRepository.findById(id).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        
        // VULN: Mass assignment - all fields can be updated
        if (updatedUser.getUsername() != null) {
            user.setUsername(updatedUser.getUsername());
        }
        if (updatedUser.getEmail() != null) {
            user.setEmail(updatedUser.getEmail());
        }
        if (updatedUser.getPassword() != null) {
            user.setPassword(updatedUser.getPassword());
        }
        if (updatedUser.getRole() != null) {
            user.setRole(updatedUser.getRole()); // VULN: Can escalate privileges
        }
        
        userRepository.save(user);
        
        return ResponseEntity.ok(user);
    }
    
    // ENDPOINT 8: Delete User
    // VULN: BFLA - No admin check
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        // VULN: No authorization check - anyone can delete users
        User user = userRepository.findById(id).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        
        userRepository.delete(user);
        
        return ResponseEntity.ok(Map.of(
            "message", "User deleted successfully",
            "deletedUserId", id
        ));
    }
    
    // ENDPOINT 9: List All Users
    // VULN: BFLA - No admin check, Excessive data exposure
    @GetMapping("/users")
    public ResponseEntity<?> listUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "100") int limit // VULN: No max limit
    ) {
        // VULN: No authentication/authorization
        // VULN: No pagination limit - can retrieve all users
        List<User> users = userRepository.findAll();
        
        // VULN: Exposing all user data including passwords
        return ResponseEntity.ok(users);
    }
    
    // ENDPOINT 10: Validate Token
    // VULN: Token information disclosure
    @PostMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        
        try {
            var claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
            
            // VULN: Exposing all token claims
            return ResponseEntity.ok(Map.of(
                "valid", true,
                "claims", claims,
                "userId", claims.get("userId"),
                "role", claims.get("role"),
                "email", claims.get("email")
            ));
        } catch (Exception e) {
            // VULN: Detailed error messages
            return ResponseEntity.status(401).body(Map.of(
                "valid", false,
                "error", e.getMessage(),
                "details", e.toString()
            ));
        }
    }
    
    // ENDPOINT 11: Refresh Token
    // VULN: No token blacklisting, Token reuse
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String oldToken = request.get("token");
        
        try {
            var claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(oldToken)
                .getBody();
            
            // VULN: No blacklist check - old token still works
            String newToken = Jwts.builder()
                .setSubject(claims.getSubject())
                .claim("role", claims.get("role"))
                .claim("userId", claims.get("userId"))
                .claim("email", claims.get("email"))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
            
            return ResponseEntity.ok(Map.of(
                "token", newToken,
                "oldToken", oldToken, // VULN: Exposing old token
                "expiresIn", 86400
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
    }
    
    // ENDPOINT 12: Search Users
    // VULN: SQL Injection, No authentication
    @GetMapping("/users/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query) {
        // VULN: SQL Injection via search query
        List<User> users = userRepository.searchByUsername(query);
        
        // VULN: Exposing all user data
        return ResponseEntity.ok(users);
    }
    
    // Helper Methods
    private void sendWelcomeEmail(String to, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Welcome to Scaler Vulnersity!");
            message.setText("Hello " + username + ",\n\nWelcome to Scaler Vulnersity!\n\nBest regards,\nScaler Team");
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Failed to send email: " + e.getMessage());
        }
    }
    
    private void sendPasswordResetEmail(String to, String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Password Reset - Scaler Vulnersity");
            message.setText("Your password reset token is: " + resetToken + 
                "\n\nUse this to reset your password.\n\nBest regards,\nScaler Team");
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Failed to send email: " + e.getMessage());
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "OK", "service", "identity"));
    }
}
