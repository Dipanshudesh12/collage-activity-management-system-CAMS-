from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password, check_password
from .models import User, Activity, Enrollment
from datetime import date
import json


# HOME
def home(request):
    return render(request, 'index.html')


# REGISTER
@csrf_exempt
def register_view(request):

    if request.method == 'GET':

        return render(request, 'register.html')


    if request.method == 'POST':

        data = json.loads(request.body)

        name = data.get('name', '').strip()

        email = data.get('email', '').strip()

        password = data.get('password', '').strip()

        confirm = data.get('confirmPassword', '').strip()

        role = data.get('role', '').strip()

        dept = data.get('dept', '').strip()

        phone = data.get('phone', '').strip()

        studentId = data.get('studentId', '').strip()

        dob = data.get('dob', '').strip()


        # VALIDATION

        if not name:

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Name is required'
                    }
                ]
            })


        if not email:

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Email is required'
                    }
                ]
            })


        if not password:

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Password is required'
                    }
                ]
            })


        if password != confirm:

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Passwords do not match'
                    }
                ]
            })


        if not role:

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Role is required'
                    }
                ]
            })


        if not dept:

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Department is required'
                    }
                ]
            })


        if not phone:

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Phone number is required'
                    }
                ]
            })


        if not studentId:

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Student ID is required'
                    }
                ]
            })


        if not dob:

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Date of birth is required'
                    }
                ]
            })


        # EMAIL EXISTS

        if User.objects.filter(email=email).exists():

            return JsonResponse({
                'ok': False,
                'errors': [
                    {
                        'msg': 'Email already exists'
                    }
                ]
            })


        # CREATE USER

        user = User.objects.create(

            name=name,
            email=email,
            password=make_password(password),
            role=role,
            dept=dept,
            phone=phone,
            studentId=studentId,
            dob=dob,

            is_approved=True
        )


        return JsonResponse({
            'ok': True
        })


# LOGIN
@csrf_exempt
def login_view(request):

    if request.method == "POST":

        data = json.loads(request.body)

        email = data.get('email')

        password = data.get('password')

        user = User.objects.filter(email=email).first()

        if not user:

            return JsonResponse({
                "ok": False,
                "errors": [
                    {
                        "field": "general",
                        "msg": "Invalid email"
                    }
                ]
            })

        if not check_password(password, user.password):

            return JsonResponse({
                "ok": False,
                "errors": [
                    {
                        "field": "general",
                        "msg": "Invalid password"
                    }
                ]
            })

        if user.role == 'coordinator' and not user.is_approved:

            return JsonResponse({
                "ok": False,
                "errors": [
                    {
                        "field": "general",
                        "msg": "Wait for admin approval"
                    }
                ]
            })

        request.session['user_id'] = user.id

        request.session['role'] = user.role

        return JsonResponse({
            "ok": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "role": user.role,
                "email": user.email
            }
        })

    return render(request, 'login.html')


# LOGOUT
from django.shortcuts import redirect
from django.contrib.auth import logout


def logout_view(request):

    request.session.flush()

    logout(request)

    response = redirect('/login/')

    response.delete_cookie('sessionid')

    return response


# ACTIVITIES
def activities(request):

    acts = Activity.objects.all().order_by('-id')

    context = {
        'activities': acts,
        'total': acts.count(),
        'approved': acts.filter(status='approved').count(),
        'sports': acts.filter(category='sports').count(),
        'cultural': acts.filter(category='cultural').count(),
        'technical': acts.filter(category='technical').count(),
        'academic': acts.filter(category='academic').count(),
    }

    return render(request, 'activities.html', context)


# SUBMIT ACTIVITY
def submit_activity(request):

    user_id = request.session.get('user_id')

    if not user_id:
        return redirect('/login/')

    user = User.objects.get(id=user_id)

    if request.method == "POST":

        Activity.objects.create(
            coordinator=user,
            title=request.POST['title'],
            category=request.POST['category'],
            desc=request.POST['desc'],
            date=request.POST['date'],
            time=request.POST['time'],
            venue=request.POST['venue'],
            deadline=request.POST['deadline'],
            maxParticipants=request.POST['maxParticipants'],
            mode=request.POST['mode'],
            contact=request.POST['contact'],
            status='pending'
        )

        return redirect('/coordinator-dashboard/')

    return render(request, 'submit-activity.html')


# ENROLL
def enroll(request, id):

    user_id = request.session.get('user_id')

    if not user_id:
        return redirect('/login/')

    user = User.objects.get(id=user_id)

    activity = Activity.objects.get(id=id)

    already = Enrollment.objects.filter(
        student=user,
        activity=activity
    ).exists()

    if already:
        return redirect('/student-dashboard/')

    if request.method == "POST":

        Enrollment.objects.create(
            student=user,
            activity=activity,
            status='pending'
        )

        return redirect('/student-dashboard/')

    return render(request, 'enroll.html', {
        'activity': activity
    })


# STUDENT DASHBOARD
def student_dashboard(request):

    user_id = request.session.get('user_id')

    if not user_id:
        return redirect('/login/')

    user = User.objects.get(id=user_id)

    enrollments = Enrollment.objects.filter(student=user)

    context = {
        'user': user,
        'enrollments': enrollments,
        'total_enrollments': enrollments.count(),
        'confirmed': enrollments.filter(status='confirmed').count(),
    }

    return render(request, 'student-dashboard.html', context)


# COORDINATOR DASHBOARD
def coordinator_dashboard(request):

    user_id = request.session.get('user_id')

    if not user_id:
        return redirect('/login/')

    user = User.objects.get(id=user_id)

    activities = Activity.objects.filter(coordinator=user)

    enrollments = Enrollment.objects.filter(
        activity__in=activities
    )

    context = {
        'user': user,
        'activities': activities,
        'enrollments': enrollments,
        'total_activities': activities.count(),
        'approved': activities.filter(status='approved').count(),
        'pending': activities.filter(status='pending').count(),
        'total_enrollments': enrollments.count(),
    }

    return render(
        request,
        'coordinator-dashboard.html',
        context
    )


# APPROVE USER
def approve_user(request, id):

    user = User.objects.get(id=id)

    user.is_approved = True

    user.save()

    return redirect('/admin/')


# APPROVE ACTIVITY
def approve_activity(request, id):

    act = Activity.objects.get(id=id)

    act.status = 'approved'

    act.save()

    return redirect('/admin/')


# REJECT ACTIVITY
def reject_activity(request, id):

    act = Activity.objects.get(id=id)

    act.status = 'rejected'

    act.save()

    return redirect('/admin/')
# ================= API =================

def api_activities(request):

    acts = Activity.objects.all()

    data = []

    for a in acts:

        data.append({

            "id": a.id,
            "title": a.title,
            "category": a.category,
            "desc": a.desc,
            "date": str(a.date),
            "time": str(a.time),
            "venue": a.venue,
            "deadline": str(a.deadline),
            "maxParticipants": a.maxParticipants,
            "mode": a.mode,
            "contact": a.contact,
            "status": a.status,
        })

    return JsonResponse(data, safe=False)


def api_enrollments(request):

    enrolls = Enrollment.objects.all()

    data = []

    for e in enrolls:

        data.append({

            "id": e.id,

            "studentId": e.student.id,

            "studentName": e.student.name,

            "activityId": e.activity.id,

            "activityTitle": e.activity.title,

            "status": e.status
        })

    return JsonResponse(data, safe=False)
def approve_enrollment(request, id):

    enroll = Enrollment.objects.get(id=id)

    enroll.status = 'approved'

    enroll.save()

    return redirect('/coordinator-dashboard/')


def reject_enrollment(request, id):

    enroll = Enrollment.objects.get(id=id)

    enroll.status = 'rejected'

    enroll.save()

    return redirect('/coordinator-dashboard/')

def admin_dashboard(request):

    user_id = request.session.get('user_id')

    if not user_id:

        return redirect('/login/')

    activities = Activity.objects.all()

    users = User.objects.all()

    enrollments = Enrollment.objects.all()

    context = {

        'activities': activities,

        'users': users,

        'enrollments': enrollments,

        'total_users': users.count(),

        'total_activities': activities.count(),

        'approved': activities.filter(
            status='approved'
        ).count(),

        'pending': activities.filter(
            status='pending'
        ).count(),
    }

    return render(
        request,
        'admin-dashboard.html',
        context
    )