from django.db import models


# 👤 USER
class User(models.Model):

    ROLE_CHOICES = (
        ('student', 'Student'),
        ('coordinator', 'Coordinator'),
        ('admin', 'Admin'),
    )

    name = models.CharField(max_length=100)

    email = models.EmailField(unique=True)

    password = models.CharField(max_length=255)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    dept = models.CharField(max_length=100)

    phone = models.CharField(
        max_length=15,
        null=True,
        blank=True
    )

    studentId = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    dob = models.DateField(
        null=True,
        blank=True
    )

    profile_photo = models.ImageField(
        upload_to='profiles/',
        null=True,
        blank=True
    )

    is_approved = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# 🎯 ACTIVITY
class Activity(models.Model):

    CATEGORY_CHOICES = (
        ('sports', 'Sports'),
        ('cultural', 'Cultural'),
        ('technical', 'Technical'),
        ('academic', 'Academic'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    MODE_CHOICES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('hybrid', 'Hybrid'),
    )

    coordinator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activities'
    )

    title = models.CharField(max_length=200)

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES
    )

    desc = models.TextField()

    date = models.DateField()

    time = models.TimeField()

    venue = models.CharField(max_length=200)

    deadline = models.DateField()

    maxParticipants = models.IntegerField()

    mode = models.CharField(
        max_length=50,
        choices=MODE_CHOICES
    )

    contact = models.EmailField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    tags = models.JSONField(default=list, blank=True)

    registered = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# 🎟️ ENROLLMENT
class Enrollment(models.Model):

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('rejected', 'Rejected'),
    )

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'activity']

    def __str__(self):
        return f"{self.student.name} - {self.activity.title}"
    
photo = models.ImageField(
    upload_to='profile_photos/',
    blank=True,
    null=True
)