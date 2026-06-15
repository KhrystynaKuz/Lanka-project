package com.lanka.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendRejectionEmail(String to, String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("christinakuz12@gmail.com");
        message.setTo(to);
        message.setSubject("Статус перевірки ваших документів на Lanka");
        message.setText("Добрий день! На жаль, ваш документ було відхилено.\n\nПричина: " + reason +
                "\n\nБудь ласка, виправте зауваження та завантажте документ повторно.");

        mailSender.send(message);
    }

    public void sendWelcomeEmail(String to) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("christinakuz12@gmail.com");
        message.setTo(to);
        message.setSubject("Вітаємо у системі ЛАНКА!");
        message.setText("Ваші документи було успішно перевірено, і ваш акаунт тепер повністю активовано. Дякуємо, що ви з нами!");

        mailSender.send(message);
    }
}
