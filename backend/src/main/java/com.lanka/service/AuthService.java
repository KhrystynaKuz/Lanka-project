package com.lanka.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import io.github.cdimascio.dotenv.Dotenv;

import java.util.UUID;

public class AuthService {

    private static final String JWT_SECRET;

    static {
        Dotenv dotenv = Dotenv.load();
        JWT_SECRET = dotenv.get("JWT_SECRET");
    }

    public static UUID verifyTokenAndGetUserId(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(JWT_SECRET);

            JWTVerifier verifier = JWT.require(algorithm).build();

            DecodedJWT jwt = verifier.verify(token);

            String userIdString = jwt.getSubject();

            return UUID.fromString(userIdString);

        } catch (Exception e) {
            throw new RuntimeException("Неавторизований доступ: невалідний токен", e);
        }
    }
}