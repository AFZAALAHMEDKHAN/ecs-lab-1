package com.scaler.identity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    User findByEmail(String email);
    User findByResetToken(String resetToken);
    User findByApiKey(String apiKey);
    
    // VULN: SQL Injection vulnerability
    @Query(value = "SELECT * FROM users WHERE username LIKE '%" + ":query" + "%'", nativeQuery = true)
    List<User> searchByUsername(@Param("query") String query);
    
    // VULN: Exposing all users without pagination
    @Query("SELECT u FROM User u WHERE u.role = :role")
    List<User> findByRole(@Param("role") String role);
}
