from django.urls import path
from . import views

urlpatterns = [

    # Home
    path('', views.home, name='home'),

    # Auth
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),

    # Activities
    path('activities/', views.activities, name='activities'),
    path('submit-activity/', views.submit_activity, name='submit_activity'),

    # Enrollment
    path('enroll/<int:id>/', views.enroll, name='enroll'),

    # Dashboards
    path('student-dashboard/', views.student_dashboard, name='student_dashboard'),
    path('coordinator-dashboard/', views.coordinator_dashboard, name='coordinator_dashboard'),
    

    path('approve/<int:id>/', views.approve_activity, name='approve'),
    path('reject/<int:id>/', views.reject_activity, name='reject'),

    path('approve-user/<int:id>/', views.approve_user),

]