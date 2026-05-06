# Create your views here.
from django.shortcuts import render, redirect
from .models import User, Activity, Enrollment
from datetime import date


# 🏠 HOME
def home(request):
    return render(request, 'index.html')


# 📝 REGISTER
def register_view(request):
    if request.method == "POST":
        role = request.POST.get('role')

        # 🔥 default approved
        is_approved = True

        # coordinator ko approval chahiye
        if role == 'coordinator':
            is_approved = False

        # ❗ duplicate email check (important)
        if User.objects.filter(email=request.POST.get('email')).exists():
            return render(request, 'register.html', {
                'error': 'Email already exists'
            })

        User.objects.create(
            name=request.POST.get('name'),
            email=request.POST.get('email'),
            password=request.POST.get('password'),
            role=role,
            dept=request.POST.get('dept'),
            phone=request.POST.get('phone'),
            is_approved=is_approved
        )

        return redirect('/login/')

    return render(request, 'register.html')


# 🔐 LOGIN
def login_view(request):
    if request.method == "POST":
        email = request.POST['email']
        password = request.POST['password']

        user = User.objects.filter(email=email, password=password).first()

        if user:

            # 🔥 APPROVAL CHECK
            if user.role == 'coordinator' and not user.is_approved:
                return render(request, 'login.html', {
                    'error': 'Wait for admin approval'
                })

            request.session['user_id'] = user.id

            # 🔥 REDIRECT
            if user.role == 'admin':
                return redirect('/admin/')   # ✅ Django admin
            elif user.role == 'coordinator':
                return redirect('/coordinator-dashboard/')
            else:
                return redirect('/student-dashboard/')

        else:
            return render(request, 'login.html', {'error': 'Invalid credentials'})

    return render(request, 'login.html')


# 🚪 LOGOUT
def logout_view(request):
    request.session.flush()
    return redirect('/login/')


# ➕ SUBMIT ACTIVITY
def submit_activity(request):
    if request.method == "POST":
        Activity.objects.create(
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
            status='active',
        )
        return redirect('/coordinator-dashboard/')

    return render(request, 'submit-activity.html')


# 🎟️ ENROLL
def enroll(request, id):
    activity = Activity.objects.get(id=id)

    if request.method == "POST":
        user_id = request.session.get('user_id')
        user = User.objects.get(id=user_id)

        Enrollment.objects.create(
            student=user,
            activity=activity,
            status='pending'
        )

        return redirect('/student-dashboard/')

    return render(request, 'enroll.html', {'activity': activity})


# 🎓 STUDENT DASHBOARD
def student_dashboard(request):
    user_id = request.session.get('user_id')
    user = User.objects.get(id=user_id)

    enrollments = Enrollment.objects.filter(student=user)
    activities = Activity.objects.all()

    upcoming_activities = activities.filter(date__gte=date.today())

    context = {
        'user': user,
        'enrollments': enrollments,
        'total_enrollments': enrollments.count(),
        'activities_count': activities.count(),
        'confirmed': enrollments.filter(status='confirmed').count(),
        'upcoming': upcoming_activities.count(),
        'upcoming_activities': upcoming_activities[:5],
    }

    return render(request, 'student-dashboard.html', context)


# 🎯 COORDINATOR DASHBOARD
def coordinator_dashboard(request):
    user_id = request.session.get('user_id')
    user = User.objects.get(id=user_id)

    # ⚠️ agar model me coordinator field nahi hai to ALL use karo
    activities = Activity.objects.all()

    enrollments = Enrollment.objects.filter(activity__in=activities)

    context = {
        'user': user,
        'activities': activities,
        'enrollments': enrollments,
        'total_activities': activities.count(),
        'approved': activities.filter(status='approved').count(),
        'pending': activities.filter(status='pending').count(),
        'total_enrollments': enrollments.count(),
    }

    return render(request, 'cordinator-dashboard.html', context)





# 📋 ACTIVITIES PAGE
def activities(request):
    acts = Activity.objects.all()

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

def approve_user(request, id):
    user = User.objects.get(id=id)
    user.is_approved = True
    user.save()
    return redirect('/admin-dashboard/')

def approve_activity(request, id):
    activity = Activity.objects.get(id=id)
    activity.status = 'approved'
    activity.save()
    return redirect('/admin/')   # ya /admin-dashboard/ (jo use kar raha hai)


def reject_activity(request, id):
    activity = Activity.objects.get(id=id)
    activity.status = 'rejected'
    activity.save()
    return redirect('/admin/')

