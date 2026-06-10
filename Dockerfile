# 1. Етап збірки
FROM maven:3.8.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# 2. Етап запуску
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Копіюємо конкретно твій файл і перейменовуємо в app.jar всередині контейнера
COPY --from=build /app/target/volunteer-system-backend-1.0-SNAPSHOT.jar app.jar

# Запускаємо додаток
CMD ["java", "-jar", "app.jar"]