package com.lanka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Головний клас запуску бекенду вебзастосунку "Ланка".
 */
@SpringBootApplication
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
        System.out.println("\n SPRING BOOT БЕКЕНД LANKA УСПІШНО ЗАПУЩЕНО НА ПОРТУ 8080");
    }
}