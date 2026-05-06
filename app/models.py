

# Create your models here.
from django.db import models

# 👤 USER
class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    password = models.CharField(max_length=100)
    role = models.CharField(max_length=20)
    dept = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, null=True, blank=True)

    is_approved = models.BooleanField(default=False)  # 🔥 NEW

    def __str__(self):
        return self.name


# 🎯 ACTIVITY
class Activity(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50)
    desc = models.TextField()
    date = models.DateField()
    time = models.TimeField()
    venue = models.CharField(max_length=200)
    deadline = models.DateField()
    maxParticipants = models.IntegerField()
    mode = models.CharField(max_length=50)
    contact = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='pending')

    def __str__(self):
        return self.title 


# 🎟️ ENROLLMENT
class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default='pending')

    def __str__(self):
        return f"{self.student.name} - {self.activity.title} ({self.status})"