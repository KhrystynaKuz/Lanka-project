package com.lanka.models;

public class VolunteerLevel {
    private int levelNumber;
    private String name;
    private int tasksCompleted;
    private int tasksRequiredForCurrentLevel;
    private int tasksRequiredForNextLevel;
    private double progressPercentage;

    public VolunteerLevel(int levelNumber, String name, int tasksCompleted, int requiredForNext) {
        this.levelNumber = levelNumber;
        this.name = name;
        this.tasksCompleted = tasksCompleted;
        this.tasksRequiredForNextLevel = requiredForNext;

        if (requiredForNext > 0) {
            this.progressPercentage = Math.min(100.0, (double) tasksCompleted / requiredForNext * 100);
        } else {
            this.progressPercentage = 100.0;
        }
    }

    public int getLevelNumber() {
        return levelNumber;
    }

    public String getName() {
        return name;
    }

    public int getTasksCompleted() {
        return tasksCompleted;
    }

    public int getTasksRequiredForCurrentLevel() {
        return tasksRequiredForCurrentLevel;
    }

    public int getTasksRequiredForNextLevel() {
        return tasksRequiredForNextLevel;
    }

    public double getProgressPercentage() {
        return progressPercentage;
    }
}