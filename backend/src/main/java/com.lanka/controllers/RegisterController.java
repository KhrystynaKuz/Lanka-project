package com.lanka.controllers;

import com.lanka.dao.DocumentDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile/documents")
@CrossOrigin(origins = "*")
public class RegisterController {

    @Autowired
    private DocumentDAO documentDAO;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("userId") UUID userId,
            @RequestParam("file") MultipartFile file) {

        try {
            String originalName = file.getOriginalFilename();
            String sanitizedName = (originalName != null) ? originalName.replaceAll("\\s+", "_") : "document.png";

            String bucketName = "user-documents";
            String fileName = userId.toString() + "/" + sanitizedName;
            String supabaseUrl = "https://dxgywtqqzpyrueostjdy.supabase.co/storage/v1/object/" + bucketName + "/" + fileName;

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();

            headers.set("apikey", serviceRoleKey);
            headers.set("Authorization", "Bearer " + serviceRoleKey);
            String contentType = file.getContentType();
            headers.setContentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

            restTemplate.exchange(supabaseUrl, HttpMethod.PUT, requestEntity, String.class);

            documentDAO.addDocument(userId, "IDENTITY_DOC", supabaseUrl);

            return ResponseEntity.ok().body("{\"message\": \"Файл успішно завантажено в Supabase та збережено в БД\"}");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Помилка завантаження: " + e.getMessage());
        }
    }
}