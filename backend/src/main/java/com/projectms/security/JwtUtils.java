package com.projectms.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)                          // 0.12.x: .subject() not .setSubject()
                .issuedAt(new Date())                       // 0.12.x: .issuedAt() not .setIssuedAt()
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration)) // 0.12.x
                .signWith(getSigningKey())                  // 0.12.x: no need to pass algorithm separately
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()                               // 0.12.x: .parser() not .parserBuilder()
                .verifyWith(getSigningKey())               // 0.12.x: .verifyWith() not .setSigningKey()
                .build()
                .parseSignedClaims(token)                  // 0.12.x: .parseSignedClaims() not .parseClaimsJws()
                .getPayload()                              // 0.12.x: .getPayload() not .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}