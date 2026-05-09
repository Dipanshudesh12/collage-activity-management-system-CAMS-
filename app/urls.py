from django.urls import path
from . import views

urlpatterns = [

    # HOME
    path('', views.home, name='home'),

    # AUTH
    path('login/', views.login_view, name='login'),

    path('register/', views.register_view, name='register'),

    path('logout/', views.logout_view, name='logout'),

    # ACTIVITIES
    path('activities/', views.activities, name='activities'),

    path(
        'submit-activity/',
        views.submit_activity,
        name='submit_activity'
    ),

    # ENROLLMENT
    path(
        'enroll/<int:id>/',
        views.enroll,
        name='enroll'
    ),

    # DASHBOARDS
    path(
        'student-dashboard/',
        views.student_dashboard,
        name='student_dashboard'
    ),

    path(
        'coordinator-dashboard/',
        views.coordinator_dashboard,
        name='coordinator_dashboard'
    ),

    path(
        'admin-dashboard/',
        views.admin_dashboard,
        name='admin_dashboard'
    ),

    # ACTIVITY APPROVAL
    path(
        'approve/<int:id>/',
        views.approve_activity,
        name='approve'
    ),

    path(
        'reject/<int:id>/',
        views.reject_activity,
        name='reject'
    ),

    # USER APPROVAL
    path(
        'approve-user/<int:id>/',
        views.approve_user,
        name='approve_user'
    ),

    # API
    path(
        'api/activities/',
        views.api_activities,
        name='api_activities'
    ),

    path(
        'api/enrollments/',
        views.api_enrollments,
        name='api_enrollments'
    ),

    # ENROLLMENT APPROVAL
    path(
        'approve-enrollment/<int:id>/',
        views.approve_enrollment,
        name='approve_enrollment'
    ),

    path(
        'reject-enrollment/<int:id>/',
        views.reject_enrollment,
        name='reject_enrollment'
    ),
]