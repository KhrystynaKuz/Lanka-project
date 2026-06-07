package com.lanka.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private static String jwtSecret;

    public AuthService(@Value("${jwt.secret:${JWT_SECRET:default_key_fallback_lanka}}") String secret) {
        jwtSecret = secret;
    }

    public static UUID verifyTokenAndGetUserId(String token) {
        try {
            if (jwtSecret == null) {
                throw new IllegalStateException("JWT_SECRET не ініціалізовано конфігурацією програми");
            }

            Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
            JWTVerifier verifier = JWT.require(algorithm).build();
            DecodedJWT jwt = verifier.verify(token);
            String userIdString = jwt.getSubject();

            return UUID.fromString(userIdString);

        } catch (Exception e) {
            throw new RuntimeException("Неавторизований доступ: невалідний токен", e);
        }
    }
}